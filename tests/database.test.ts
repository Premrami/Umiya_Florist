import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
let db: PGlite;
const owner = '11111111-1111-4111-8111-111111111111',
  editor = '22222222-2222-4222-8222-222222222222';
let customer: string, subscription: string, invoice: string;
async function role(role: string, id = '') {
  await db.exec(
    `reset role;set role ${role};select set_config('request.jwt.claim.sub','${id}',false)`,
  );
}
async function one<T extends Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return (await db.query<T>(sql, params)).rows[0];
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema auth,public,storage to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`,
  );
  for (const file of [
    '001_core.sql',
    '002_workflows.sql',
    '003_reporting.sql',
    '004_operations.sql',
    '005_quotations.sql',
    '006_communications.sql',
    '007_subscription_items.sql',
    '008_attachments.sql',
    '009_credits_refunds.sql',
    '010_net_reporting.sql',
    '011_billing_settings.sql',
    '012_billing_identity.sql',
  ])
    await db.exec(
      (await readFile('supabase/migrations/' + file, 'utf8')).replace(
        'create extension if not exists pgcrypto;',
        '-- gen_random_uuid is built in to this PostgreSQL test runtime',
      ),
    );
  await db.exec(
    `grant select,insert,update,delete on all tables in schema public to anon,authenticated,service_role;grant usage,select on all sequences in schema public to anon,authenticated,service_role;insert into auth.users(id)values('${owner}'),('${editor}');insert into profiles(id,display_name,role)values('${owner}','Test owner','owner'),('${editor}','Test editor','editor');`,
  );
  await role('authenticated', owner);
  customer = String(
    (
      await one(
        `insert into customers(name,phone) values('Development fixture','919999999999')returning id`,
      )
    ).id,
  );
  subscription = String(
    (
      await one(
        `insert into flower_subscriptions(customer_id,name,daily_amount,start_date)values($1,'Daily fixture',5000,'2026-09-01')returning id`,
        [customer],
      )
    ).id,
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
describe.sequential('database workflows', () => {
  it('enforces private-data RLS against anonymous users', async () => {
    await role('anon');
    expect((await db.query('select * from customers')).rows).toHaveLength(0);
    await expect(
      db.exec(`insert into customers(name,phone) values('Intruder','1234567890')`),
    ).rejects.toThrow();
    await expect(db.exec(`select generate_monthly('2026-09-01')`)).rejects.toThrow();
  });
  it('allows published content but hides drafts and finances from editors', async () => {
    await role('authenticated', owner);
    await db.exec(
      `insert into catalog_items(name,category,image_url,status)values('Draft','Roses','https://images.unsplash.com/test','draft'),('Published','Roses','https://images.unsplash.com/test','published')`,
    );
    await role('anon');
    expect((await db.query('select * from catalog_items')).rows).toHaveLength(1);
    await role('authenticated', editor);
    expect((await db.query('select * from customers')).rows).toHaveLength(0);
    await expect(db.exec(`select generate_monthly('2026-09-01')`)).rejects.toThrow();
  });
  it('schedules once and respects pause ranges', async () => {
    await role('authenticated', owner);
    await db.query(
      `insert into subscription_pause_periods(subscription_id,start_date,end_date)values($1,'2026-10-02','2026-10-03')`,
      [subscription],
    );
    expect((await one(`select schedule_deliveries('2026-10-02') as count`)).count).toBe(0);
    expect((await one(`select schedule_deliveries('2026-10-04') as count`)).count).toBe(1);
    expect((await one(`select schedule_deliveries('2026-10-04') as count`)).count).toBe(0);
  });
  it('generates one invoice from actual delivered prices', async () => {
    await db.query(
      `insert into delivery_records(subscription_id,delivery_date,status,amount)select $1,'2026-09-01'::date+n,case when n<28 then 'delivered' else 'skipped' end,5000 from generate_series(0,29)n`,
      [subscription],
    );
    expect((await one(`select generate_monthly('2026-09-01')as count`)).count).toBe(1);
    expect((await one(`select generate_monthly('2026-09-20')as count`)).count).toBe(0);
    const i = await one('select id,total from invoices');
    invoice = String(i.id);
    expect(Number(i.total)).toBe(140000);
    await db.query(`select adjust_invoice($1,'Extra flowers',20000);`, [invoice]);
    await db.query(`select adjust_invoice($1,'Discount',-10000);`, [invoice]);
    await db.query('select finalize_invoice($1)', [invoice]);
    expect(Number((await one('select total from invoices where id=$1', [invoice])).total)).toBe(
      150000,
    );
  });
  it('freezes finalized lines and billed deliveries', async () => {
    expect(
      (await db.query('update invoices set total=1 where id=$1', [invoice])).affectedRows,
    ).toBe(0);
    await role('postgres');
    await expect(db.query('update invoices set total=1 where id=$1', [invoice])).rejects.toThrow();
    await expect(
      db.query('update invoice_items set amount=1 where invoice_id=$1', [invoice]),
    ).rejects.toThrow();
    await role('authenticated', owner);
    await expect(
      db.query(
        'update delivery_records set amount=1 where id=(select delivery_id from invoice_items limit 1)',
      ),
    ).rejects.toThrow();
  });
  it('posts partial manual payments exactly once and rejects overpayments', async () => {
    const key = '33333333-3333-4333-8333-333333333333';
    await db.query(`select manual_payment($1,50000,'cash','Receipt fixture',$2)`, [invoice, key]);
    await db.query(`select manual_payment($1,50000,'cash','Receipt fixture',$2)`, [invoice, key]);
    expect(Number((await one('select sum(amount) as total from payments')).total)).toBe(50000);
    await expect(
      db.query(`select manual_payment($1,100001,'cash','Too much',gen_random_uuid())`, [invoice]),
    ).rejects.toThrow();
  });
  it('validates provider invoice mapping and duplicate event/payment ids transactionally', async () => {
    await role('postgres');
    await db.query(
      `insert into payment_links(invoice_id,provider_link_id,url,amount)values($1,'plink_test','https://rzp.io/test',100000)`,
      [invoice],
    );
    await role('service_role');
    await expect(
      db.query(
        `select post_provider_payment('event_bad','hash','plink_test',$1,'pay_test',50000,'USD',100000)`,
        [invoice],
      ),
    ).rejects.toThrow();
    await db.query(
      `select post_provider_payment('event_good','hash','plink_test',$1,'pay_test',50000,'INR',100000)`,
      [invoice],
    );
    await db.query(
      `select post_provider_payment('event_good','hash','plink_test',$1,'pay_test',50000,'INR',100000)`,
      [invoice],
    );
    await db.query(
      `select post_provider_payment('event_duplicate_payment','hash','plink_test',$1,'pay_test',50000,'INR',100000)`,
      [invoice],
    );
    expect(Number((await one('select count(*)as count from payments')).count)).toBe(2);
  });
  it('uses a stock ledger and prevents negative stock or duplicate movements', async () => {
    await role('authenticated', owner);
    const item = String(
      (
        await one(
          `insert into inventory_items(name,item_type,unit)values('Rose fixture','Fresh flowers','stems')returning id`,
        )
      ).id,
    );
    const key = '44444444-4444-4444-8444-444444444444';
    await db.query(`select stock_movement($1,10,'received','Fixture',$2)`, [item, key]);
    await db.query(`select stock_movement($1,10,'received','Fixture',$2)`, [item, key]);
    expect(
      Number(
        (await one(`select sum(quantity)as n from inventory_movements where item_id=$1`, [item])).n,
      ),
    ).toBe(10);
    await expect(
      db.query(`select stock_movement($1,-11,'used','Fixture',gen_random_uuid())`, [item]),
    ).rejects.toThrow();
  });
  it('publishes snapshots and retains revision history', async () => {
    await role('authenticated', editor);
    const id = String(
      (
        await one(
          `insert into site_sections(key,draft)values('hero','{"headline":"Draft title"}')returning id`,
        )
      ).id,
    );
    await role('anon');
    expect((await db.query('select * from public_site_sections')).rows).toHaveLength(0);
    await role('authenticated', editor);
    await db.query('select publish_section($1)', [id]);
    await role('anon');
    expect((await db.query('select * from public_site_sections')).rows).toHaveLength(1);
    await role('authenticated', owner);
    expect((await db.query('select * from content_revisions')).rows).toHaveLength(1);
  });
  it('converts accepted itemized quotations into a single booking', async () => {
    await role('authenticated', owner);
    const q = String(
      (
        await one(
          `select save_quotation(null,$1,'Development wedding','2026-12-31','[{"description":"Roses","quantity":10,"unit_price":10000}]')as id`,
          [customer],
        )
      ).id,
    );
    await db.query(`select transition_quote($1,'sent')`, [q]);
    await db.query(`select transition_quote($1,'accepted')`, [q]);
    const e = String(
      (await one(`select accept_quote($1,'2026-12-01','Fixture venue')as id`, [q])).id,
    );
    expect(
      String((await one(`select accept_quote($1,'2026-12-01','Fixture venue')as id`, [q])).id),
    ).toBe(e);
    expect(
      Number((await one(`select agreed_amount from events where id=$1`, [e])).agreed_amount),
    ).toBe(100000);
    await expect(
      db.query(
        `select save_quotation($1,$2,'Changed','2026-12-31','[{"description":"Roses","quantity":1,"unit_price":1}]')`,
        [q, customer],
      ),
    ).rejects.toThrow();
  });
  it('preserves billed amounts when subscription prices change', async () => {
    await role('authenticated', owner);
    await db.query(`select change_subscription_price($1,'2026-11-01',7500,'New seasonal rate')`, [
      subscription,
    ]);
    await db.query(`select schedule_deliveries('2026-11-01')`);
    expect(
      Number(
        (
          await one(
            `select amount from delivery_records where subscription_id=$1 and delivery_date='2026-11-01'`,
            [subscription],
          )
        ).amount,
      ),
    ).toBe(7500);
    expect(Number((await one(`select total from invoices where id=$1`, [invoice])).total)).toBe(
      150000,
    );
  });
  it('pauses already scheduled pending occurrences without duplicate billing', async () => {
    await db.query(`select schedule_deliveries('2026-11-02')`);
    await db.query(`select pause_subscription($1,'2026-11-02','2026-11-03')`, [subscription]);
    expect(
      (
        await one(
          `select status from delivery_records where subscription_id=$1 and delivery_date='2026-11-02'`,
          [subscription],
        )
      ).status,
    ).toBe('skipped');
  });
  it('records opt-out evidence and excludes the client from promotional segments', async () => {
    await db.query(`select set_marketing_consent($1,true,'Written consent fixture')`, [customer]);
    await db.query(`select set_marketing_consent($1,false,'Customer opt-out fixture')`, [customer]);
    expect(
      (await one(`select marketing_consent from customers where id=$1`, [customer]))
        .marketing_consent,
    ).toBe(false);
    expect(
      Number(
        (await one(`select count(*)as n from marketing_consents where customer_id=$1`, [customer]))
          .n,
      ),
    ).toBe(2);
  });
  it('applies verified refunds exactly once and retains immutable credit notes', async () => {
    await db.query(`select issue_credit($1,20000,'Service adjustment fixture')`, [invoice]);
    await role('service_role');
    await db.exec(
      `select post_provider_refund('refund-event','hash','pay_test','rfnd_fixture',10000);select post_provider_refund('refund-event','hash','pay_test','rfnd_fixture',10000)`,
    );
    const b = await one(`select credits,paid,balance from invoice_balances where id=$1`, [invoice]);
    expect(Number(b.credits)).toBe(20000);
    expect(Number(b.paid)).toBe(90000);
    expect(Number(b.balance)).toBe(40000);
    await role('authenticated', owner);
    expect((await db.query(`update credit_notes set amount=1`)).affectedRows).toBe(0);
  });
  it('archives customers without removing historical financial records', async () => {
    await role('authenticated', owner);
    await db.query(`update customers set status='archived' where id=$1`, [customer]);
    expect(
      Number((await one(`select count(*)as n from invoices where customer_id=$1`, [customer])).n),
    ).toBe(1);
  });
  it('audits singleton settings and rounds configured tax in integer paise', async () => {
    await role('authenticated', owner);
    await db.exec(
      `update site_settings set private=private||'{"tax_bps":1800,"gstin":"24ABCDE1234F1Z5","invoice_prefix":"TEST","due_days":10}'::jsonb where id=1`,
    );
    const id = String(
      (await one(`select create_direct_invoice($1,null,'Tax fixture',999)as id`, [customer])).id,
    );
    expect(Number((await one(`select total from invoices where id=$1`, [id])).total)).toBe(1179);
    await db.query(`select finalize_invoice($1)`, [id]);
    const row = await one(`select snapshot from invoices where id=$1`, [id]);
    expect((row.snapshot as Record<string, unknown>).tax_amount).toBe(180);
    expect(String((row.snapshot as Record<string, unknown>).number_label)).toMatch(/^TEST-/);
    expect(
      (await db.query(`select * from audit_logs where entity='site_settings' and record_id='1'`))
        .rows.length,
    ).toBeGreaterThan(0);
  });
  it('limits accountants to billing identity rather than private CRM notes', async () => {
    await role('postgres');
    await db.exec(
      `insert into auth.users(id)values('55555555-5555-4555-8555-555555555555');insert into profiles(id,display_name,role)values('55555555-5555-4555-8555-555555555555','Fixture accountant','accountant')`,
    );
    await role('authenticated', '55555555-5555-4555-8555-555555555555');
    expect((await db.query('select * from customers')).rows).toHaveLength(0);
    const rows = (await db.query('select * from billing_customers()')).rows;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).not.toHaveProperty('notes');
  });
});
