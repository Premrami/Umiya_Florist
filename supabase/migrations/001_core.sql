begin;
create extension if not exists pgcrypto;
create table public.profiles(id uuid primary key references auth.users(id),display_name text not null,role text not null check(role in ('owner','admin','manager','staff','accountant','editor')),active boolean not null default true,created_at timestamptz not null default now());
create function public.has_permission(p text) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from profiles where id=auth.uid() and active and (role='owner' or (role='admin' and p<>'owner') or (role='manager' and p in ('crm','operations')) or (role='accountant' and p='finance') or (role='editor' and p='content')))$$;
create table customers(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 2 and 100),phone text not null,whatsapp text,email text,customer_type text not null default 'Other',billing_address text,delivery_address text,area text,city text default 'Ahmedabad',notes text,marketing_consent boolean not null default false,consent_at timestamptz,consent_source text,status text not null default 'active' check(status in ('active','archived')),created_at timestamptz not null default now());
create unique index customer_phone on customers(phone) where status='active';
create index customers_search on customers(lower(name));
create table flower_subscriptions(id uuid primary key default gen_random_uuid(),customer_id uuid not null references customers,name text not null,daily_amount bigint not null check(daily_amount>=0),frequency text not null default 'daily' check(frequency in ('daily','weekdays','weekly')),delivery_days integer[] not null default '{0,1,2,3,4,5,6}',start_date date not null,end_date date,status text not null default 'active' check(status in ('active','paused','cancelled','completed')),address text,notes text,created_at timestamptz not null default now(),check(end_date is null or end_date>=start_date));
create table subscription_pause_periods(id uuid primary key default gen_random_uuid(),subscription_id uuid not null references flower_subscriptions,start_date date not null,end_date date not null,reason text,check(end_date>=start_date));
create table delivery_records(id uuid primary key default gen_random_uuid(),subscription_id uuid not null references flower_subscriptions,delivery_date date not null,status text not null default 'pending' check(status in ('pending','delivered','skipped','cancelled','failed')),amount bigint not null check(amount>=0),assigned_to uuid references profiles,notes text,created_at timestamptz not null default now(),unique(subscription_id,delivery_date));
create index deliveries_date on delivery_records(delivery_date,status);
create table inquiries(id uuid primary key default gen_random_uuid(),name text not null,phone text not null,email text,type text not null,message text not null,details jsonb not null default '{}',marketing_consent boolean not null default false,consent_at timestamptz,status text not null default 'new' check(status in ('new','contacted','qualified','quotation_sent','converted','closed','spam')),customer_id uuid references customers,assigned_to uuid references profiles,followup_at timestamptz,notes text,idempotency_key uuid not null unique,created_at timestamptz not null default now());
create table events(id uuid primary key default gen_random_uuid(),customer_id uuid not null references customers,name text not null,event_type text,event_date date not null,venue text,guests integer check(guests>=0),requirements text,agreed_amount bigint not null default 0 check(agreed_amount>=0),status text not null default 'inquiry' check(status in ('inquiry','quotation_prepared','quotation_sent','negotiating','confirmed','planning','in_progress','completed','cancelled')),notes text,created_at timestamptz not null default now());
create table event_expenses(id uuid primary key default gen_random_uuid(),event_id uuid not null references events,name text not null,category text not null,amount bigint not null check(amount>=0),created_at timestamptz not null default now());
create table site_settings(id integer primary key default 1 check(id=1),public jsonb not null default '{"name":"Umiya Florist","city":"Ahmedabad"}',private jsonb not null default '{"invoice_prefix":"UF","tax_bps":0}',updated_at timestamptz default now());
insert into site_settings default values;
create table site_sections(id uuid primary key default gen_random_uuid(),key text not null unique,draft jsonb not null default '{}',published jsonb,published_at timestamptz,sort_order integer not null default 0,created_at timestamptz not null default now());
create table content_revisions(id uuid primary key default gen_random_uuid(),section_id uuid not null references site_sections,content jsonb not null,actor uuid references profiles,created_at timestamptz not null default now());
create table catalog_items(id uuid primary key default gen_random_uuid(),name text not null,slug text unique,category text not null,description text not null default '',image_url text not null,alt_text text,price bigint check(price>=0),available boolean not null default true,featured boolean not null default false,sort_order integer not null default 0,status text not null default 'draft' check(status in ('draft','published','archived')),created_at timestamptz not null default now());
create table services(id uuid primary key default gen_random_uuid(),name text not null,description text not null,image_url text not null,status text not null default 'draft' check(status in ('draft','published','archived')),created_at timestamptz default now());
create table portfolio_projects(id uuid primary key default gen_random_uuid(),name text not null,description text,image_url text not null,event_id uuid references events,permission_confirmed boolean not null default false,status text not null default 'draft' check(status in ('draft','published','archived')),created_at timestamptz default now(),check(status<>'published' or permission_confirmed));
create table testimonials(id uuid primary key default gen_random_uuid(),display_name text not null,quote text not null,permission_confirmed boolean not null default false,status text not null default 'draft' check(status in ('draft','published','archived')),created_at timestamptz default now(),check(status<>'published' or permission_confirmed));
create table media_assets(id uuid primary key default gen_random_uuid(),name text not null,path text not null unique,public boolean not null default false,mime_type text not null,bytes bigint not null,alt_text text not null default '',created_at timestamptz not null default now());
create table quotations(id uuid primary key default gen_random_uuid(),number bigint generated always as identity unique,customer_id uuid not null references customers,event_id uuid references events,name text not null,status text not null default 'draft' check(status in ('draft','sent','accepted','rejected')),valid_until date not null,total bigint not null check(total>=0),snapshot jsonb not null,created_at timestamptz not null default now());
create table invoices(id uuid primary key default gen_random_uuid(),number bigint generated always as identity unique,customer_id uuid not null references customers,subscription_id uuid references flower_subscriptions,event_id uuid references events,period date,status text not null default 'draft' check(status in ('draft','finalized','void')),due_date date not null,total bigint not null check(total>=0),snapshot jsonb not null default '{}',created_at timestamptz not null default now(),unique(subscription_id,period));
create table invoice_items(id uuid primary key default gen_random_uuid(),invoice_id uuid not null references invoices,delivery_id uuid unique references delivery_records,description text not null,quantity integer not null default 1 check(quantity>0),unit_price bigint not null check(unit_price>=0),amount bigint not null check(amount>=0));
create table invoice_adjustments(id uuid primary key default gen_random_uuid(),invoice_id uuid not null references invoices,description text not null,amount bigint not null,created_at timestamptz default now());
create table payments(id uuid primary key default gen_random_uuid(),invoice_id uuid not null references invoices,amount bigint not null check(amount>0),method text not null check(method in ('cash','bank','upi','razorpay')),provider_payment_id text unique,idempotency_key uuid not null unique,reference text,recorded_by uuid references profiles,created_at timestamptz not null default now());
create table payment_links(id uuid primary key default gen_random_uuid(),invoice_id uuid not null references invoices,provider_link_id text not null unique,url text not null,amount bigint not null check(amount>0),status text not null default 'created',created_at timestamptz not null default now());
create table payment_provider_events(id text primary key,payload_hash text not null,created_at timestamptz not null default now());
create table invoice_share_logs(id uuid primary key default gen_random_uuid(),invoice_id uuid not null references invoices,token_hash text unique,expires_at timestamptz,revoked_at timestamptz,status text not null default 'prepared' check(status in ('prepared','whatsapp_opened','manually_sent','failed')),created_at timestamptz default now());
create table inventory_items(id uuid primary key default gen_random_uuid(),name text not null,item_type text not null,unit text not null check(unit in ('stems','bunches','kg','packets','pieces')),reorder_threshold numeric(12,3) not null default 0,unit_cost bigint not null default 0 check(unit_cost>=0),status text not null default 'active' check(status in ('active','archived')),created_at timestamptz default now());
create table inventory_movements(id uuid primary key default gen_random_uuid(),item_id uuid not null references inventory_items,event_id uuid references events,quantity numeric(12,3) not null check(quantity<>0),reason text not null check(reason in ('purchase','received','used','waste','adjustment')),notes text,idempotency_key uuid not null unique,created_at timestamptz default now());
create table campaigns(id uuid primary key default gen_random_uuid(),name text not null,message text not null,status text not null default 'draft' check(status in ('draft','prepared','archived')),created_at timestamptz default now());
create table communication_logs(id uuid primary key default gen_random_uuid(),customer_id uuid references customers,invoice_id uuid references invoices,campaign_id uuid references campaigns,channel text not null,status text not null,provider_id text,created_at timestamptz default now());
create table audit_logs(id uuid primary key default gen_random_uuid(),actor uuid,entity text not null,record_id text,action text not null,created_at timestamptz not null default now());
create table inquiry_limits(key text primary key,window_start timestamptz not null,hits integer not null);
create index events_date on events(event_date);create index invoice_status on invoices(status,created_at);create index inquiry_status on inquiries(status,created_at);create index stock_item on inventory_movements(item_id);
-- Financial locks prevent editing historical amounts through direct PostgREST calls.
create function protect_invoice() returns trigger language plpgsql set search_path=public as $$begin if old.status in ('finalized','void') then raise exception 'Finalized invoice is immutable; issue a credit note';end if;return new;end$$;
create trigger invoice_immutable before update or delete on invoices for each row execute function protect_invoice();
create function protect_lines() returns trigger language plpgsql set search_path=public as $$declare inv uuid;begin inv=coalesce(new.invoice_id,old.invoice_id);perform 1 from invoices where id=inv and status='draft' for update;if not found then raise exception 'Invoice lines are immutable';end if;return coalesce(new,old);end$$;
create trigger items_immutable before insert or update or delete on invoice_items for each row execute function protect_lines();
create trigger adjustments_immutable before insert or update or delete on invoice_adjustments for each row execute function protect_lines();
create function protect_billed_delivery() returns trigger language plpgsql set search_path=public as $$begin if exists(select 1 from invoice_items where delivery_id=old.id) then raise exception 'Billed delivery cannot be changed';end if;return coalesce(new,old);end$$;
create trigger billed_delivery before update or delete on delivery_records for each row execute function protect_billed_delivery();
create function audit_change() returns trigger language plpgsql security definer set search_path=public as $$begin insert into audit_logs(actor,entity,record_id,action) values(auth.uid(),tg_table_name,coalesce(new.id,old.id)::text,tg_op);return coalesce(new,old);end$$;
-- Every business table uses explicit permissions. No public read policy on private data.
alter table profiles enable row level security;
create policy own_profile on profiles for select to authenticated using(id=auth.uid() or has_permission('owner'));
create policy manage_profiles on profiles for all to authenticated using(has_permission('owner')) with check(has_permission('owner'));
do $$declare t text;p text;begin
for t,p in select * from (values ('customers','crm'),('flower_subscriptions','operations'),('subscription_pause_periods','operations'),('delivery_records','operations'),('inquiries','crm'),('events','operations'),('event_expenses','operations'),('site_settings','owner'),('site_sections','content'),('content_revisions','content'),('catalog_items','content'),('services','content'),('portfolio_projects','content'),('testimonials','content'),('media_assets','content'),('quotations','finance'),('invoices','finance'),('invoice_items','finance'),('invoice_adjustments','finance'),('payments','finance'),('payment_links','finance'),('invoice_share_logs','finance'),('inventory_items','operations'),('inventory_movements','operations'),('campaigns','marketing'),('communication_logs','marketing')) v(t,p) loop
execute format('alter table %I enable row level security',t);
execute format('create policy staff_read on %I for select to authenticated using(has_permission(%L))',t,p);
if t not in ('payments','payment_links','invoice_items','invoice_adjustments','invoices','inventory_movements','invoice_share_logs','content_revisions','communication_logs') then
execute format('create policy staff_insert on %I for insert to authenticated with check(has_permission(%L))',t,p);
execute format('create policy staff_update on %I for update to authenticated using(has_permission(%L)) with check(has_permission(%L))',t,p,p);
end if;
execute format('create trigger audit after insert or update or delete on %I for each row execute function audit_change()',t);
end loop;end$$;
-- Accountants need limited customer identity for billing. CRM columns are still private outside staff roles.
create policy billing_customer_read on customers for select to authenticated using(has_permission('finance'));
alter table audit_logs enable row level security;create policy owner_audit on audit_logs for select to authenticated using(has_permission('owner'));
alter table payment_provider_events enable row level security;alter table inquiry_limits enable row level security;
-- Views expose only published content and intentionally exclude private draft/version data.
create view public_site_sections with(security_barrier=true) as select key,published,sort_order from site_sections where published is not null;
create view public_site_settings with(security_barrier=true) as select public from site_settings;
grant select on public_site_sections,public_site_settings to anon,authenticated;
do $$declare t text;begin foreach t in array array['catalog_items','services','portfolio_projects','testimonials'] loop execute format('create policy published_read on %I for select to anon,authenticated using(status=''published'')',t);end loop;end$$;
-- Monetary mutations are transactions exposed through narrowly scoped functions.
create function schedule_deliveries(p_date date) returns integer language plpgsql security definer set search_path=public as $$declare n integer;begin
if not has_permission('operations') then raise exception 'Forbidden';end if;
insert into delivery_records(subscription_id,delivery_date,amount)
select s.id,p_date,s.daily_amount from flower_subscriptions s where s.status='active' and p_date>=s.start_date and (s.end_date is null or p_date<=s.end_date) and extract(dow from p_date)::int=any(s.delivery_days) and (s.frequency<>'weekdays' or extract(dow from p_date) between 1 and 5) and (s.frequency<>'weekly' or extract(dow from p_date)=extract(dow from s.start_date)) and not exists(select 1 from subscription_pause_periods p where p.subscription_id=s.id and p_date between p.start_date and p.end_date) on conflict(subscription_id,delivery_date) do nothing;
get diagnostics n=row_count;return n;end$$;
create function generate_monthly(p_month date) returns integer language plpgsql security definer set search_path=public as $$declare s record;i uuid;n integer:=0;start_at date:=date_trunc('month',p_month)::date;finish_at date:=(date_trunc('month',p_month)+interval '1 month')::date;begin
if not has_permission('finance') then raise exception 'Forbidden';end if;
perform pg_advisory_xact_lock(hashtext('billing:'||start_at));
for s in select fs.id,fs.customer_id from flower_subscriptions fs where exists(select 1 from delivery_records d where d.subscription_id=fs.id and d.delivery_date>=start_at and d.delivery_date<finish_at and d.status='delivered') loop
if exists(select 1 from invoices where subscription_id=s.id and period=start_at) then continue;end if;
perform 1 from delivery_records where subscription_id=s.id and delivery_date>=start_at and delivery_date<finish_at for update;
insert into invoices(customer_id,subscription_id,period,due_date,total) values(s.customer_id,s.id,start_at,finish_at+7,0) returning id into i;
insert into invoice_items(invoice_id,delivery_id,description,unit_price,amount) select i,id,'Flower delivery — '||delivery_date,amount,amount from delivery_records where subscription_id=s.id and delivery_date>=start_at and delivery_date<finish_at and status='delivered';
update invoices set total=(select coalesce(sum(amount),0) from invoice_items where invoice_id=i) where id=i;n=n+1;
end loop;return n;end$$;
create function finalize_invoice(p_id uuid) returns void language plpgsql security definer set search_path=public as $$declare inv invoices;c customers;issuer jsonb;items jsonb;adjustments jsonb;t bigint;begin
if not has_permission('finance') then raise exception 'Forbidden';end if;
select * into strict inv from invoices where id=p_id and status='draft' for update;
select * into strict c from customers where id=inv.customer_id;
select public into issuer from site_settings where id=1;
select coalesce(jsonb_agg(to_jsonb(x)),'[]'),coalesce(sum(amount),0) into items,t from invoice_items x where invoice_id=p_id;
select coalesce(jsonb_agg(to_jsonb(x)),'[]') into adjustments from invoice_adjustments x where invoice_id=p_id;
t=t+(select coalesce(sum(amount),0) from invoice_adjustments where invoice_id=p_id);
if t<0 then raise exception 'Negative invoice';end if;
update invoices set status='finalized',total=t,snapshot=jsonb_build_object('issuer',issuer,'customer',jsonb_build_object('name',c.name,'phone',c.phone,'billing_address',c.billing_address),'items',items,'adjustments',adjustments,'tax_bps',0) where id=p_id;
end$$;
create function manual_payment(p_invoice uuid,p_amount bigint,p_method text,p_reference text,p_key uuid) returns uuid language plpgsql security definer set search_path=public as $$declare balance bigint;result uuid;begin
if not has_permission('finance') or p_method not in ('cash','bank','upi') or p_amount<=0 then raise exception 'Invalid payment';end if;
perform 1 from invoices where id=p_invoice and status='finalized' for update;if not found then raise exception 'Finalized invoice required';end if;
select id into result from payments where idempotency_key=p_key;if result is not null then return result;end if;
select b.balance into balance from invoice_balances b where b.id=p_invoice;
if p_amount>balance then raise exception 'Payment exceeds outstanding amount';end if;
insert into payments(invoice_id,amount,method,reference,idempotency_key,recorded_by) values(p_invoice,p_amount,p_method,p_reference,p_key,auth.uid()) returning id into result;return result;end$$;
create function stock_movement(p_item uuid,p_quantity numeric,p_reason text,p_notes text,p_key uuid) returns void language plpgsql security definer set search_path=public as $$begin
if not has_permission('operations') then raise exception 'Forbidden';end if;
perform 1 from inventory_items where id=p_item for update;if not found then raise exception 'Unknown stock';end if;
if exists(select 1 from inventory_movements where idempotency_key=p_key) then return;end if;
if coalesce((select sum(quantity) from inventory_movements where item_id=p_item),0)+p_quantity<0 then raise exception 'Insufficient stock';end if;
if p_reason in ('purchase','received') and p_quantity<=0 or p_reason in ('used','waste') and p_quantity>=0 then raise exception 'Invalid stock direction';end if;
insert into inventory_movements(item_id,quantity,reason,notes,idempotency_key) values(p_item,p_quantity,p_reason,p_notes,p_key);end$$;
create function publish_section(p_id uuid) returns void language plpgsql security definer set search_path=public as $$begin
if not has_permission('content') then raise exception 'Forbidden';end if;
perform 1 from site_sections where id=p_id for update;
insert into content_revisions(section_id,content,actor) select id,draft,auth.uid() from site_sections where id=p_id;
update site_sections set published=draft,published_at=now() where id=p_id;end$$;
create function convert_inquiry(p_id uuid) returns uuid language plpgsql security definer set search_path=public as $$declare q inquiries;c uuid;begin
if not has_permission('crm') then raise exception 'Forbidden';end if;select * into strict q from inquiries where id=p_id for update;if q.customer_id is not null then return q.customer_id;end if;
select id into c from customers where phone=q.phone and status='active';if c is null then insert into customers(name,phone,email,marketing_consent,consent_at,consent_source) values(q.name,q.phone,q.email,q.marketing_consent,q.consent_at,'inquiry') returning id into c;end if;
update inquiries set status='converted',customer_id=c where id=p_id;return c;end$$;
-- Only the server may submit public inquiries, with database-wide rate limits.
create function submit_inquiry(p_payload jsonb,p_rate_key text) returns uuid language plpgsql security definer set search_path=public as $$declare result uuid;lim inquiry_limits;begin
perform pg_advisory_xact_lock(hashtext(p_rate_key));select * into lim from inquiry_limits where key=p_rate_key;
if lim.window_start>now()-interval '15 minutes' and lim.hits>=5 then raise exception 'Too many inquiries';end if;
insert into inquiry_limits(key,window_start,hits) values(p_rate_key,now(),1) on conflict(key) do update set hits=case when inquiry_limits.window_start<now()-interval '15 minutes' then 1 else inquiry_limits.hits+1 end,window_start=case when inquiry_limits.window_start<now()-interval '15 minutes' then now() else inquiry_limits.window_start end;
insert into inquiries(name,phone,email,type,message,details,marketing_consent,consent_at,idempotency_key) values(p_payload->>'name',p_payload->>'phone',p_payload->>'email',p_payload->>'type',p_payload->>'message',p_payload-'name'-'phone'-'email'-'message'-'idempotency_key',coalesce((p_payload->>'marketing_consent')::boolean,false),case when (p_payload->>'marketing_consent')::boolean then now() end,(p_payload->>'idempotency_key')::uuid) on conflict(idempotency_key) do nothing returning id into result;
if result is null then select id into result from inquiries where idempotency_key=(p_payload->>'idempotency_key')::uuid;end if;return result;end$$;
-- Explicitly revoke PostgreSQL's default PUBLIC execute grant.
revoke execute on all functions in schema public from public,anon;
grant execute on function has_permission(text) to authenticated;
grant execute on function schedule_deliveries(date),generate_monthly(date),finalize_invoice(uuid),manual_payment(uuid,bigint,text,text,uuid),stock_movement(uuid,numeric,text,text,uuid),publish_section(uuid),convert_inquiry(uuid) to authenticated;
grant execute on function submit_inquiry(jsonb,text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('promotional','promotional',true,10485760,array['image/jpeg','image/png','image/webp']),('private','private',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy media_upload on storage.objects for insert to authenticated with check((bucket_id='promotional' and has_permission('content')) or (bucket_id='private' and has_permission('operations')));
create policy media_read on storage.objects for select to authenticated using((bucket_id='promotional' and has_permission('content')) or (bucket_id='private' and has_permission('operations')));
commit;
