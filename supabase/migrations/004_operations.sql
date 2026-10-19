begin;
create table public.customer_addresses(id uuid primary key default gen_random_uuid(),customer_id uuid not null references customers,label text not null,address text not null,created_at timestamptz default now());
create table public.customer_notes(id uuid primary key default gen_random_uuid(),customer_id uuid not null references customers,note text not null,created_at timestamptz default now());
create table public.customer_followups(id uuid primary key default gen_random_uuid(),customer_id uuid not null references customers,name text not null,due_at timestamptz not null,status text not null default 'pending' check(status in('pending','done','cancelled')),created_at timestamptz default now());
create table public.marketing_consents(id uuid primary key default gen_random_uuid(),customer_id uuid not null references customers,consented boolean not null,source text not null,recorded_by uuid references profiles,created_at timestamptz default now());
create table public.event_tasks(id uuid primary key default gen_random_uuid(),event_id uuid not null references events,name text not null,assigned_to uuid references profiles,status text not null default 'pending' check(status in('pending','done','cancelled')),due_date date,created_at timestamptz default now());
create table public.event_materials(id uuid primary key default gen_random_uuid(),event_id uuid not null references events,item_id uuid not null references inventory_items,quantity numeric not null check(quantity>0),status text not null default 'reserved' check(status in('reserved','used','released')),created_at timestamptz default now());
create table public.social_posts(id uuid primary key default gen_random_uuid(),name text not null,image_url text not null,alt_text text not null,status text not null default 'draft' check(status in('draft','published','archived')),created_at timestamptz default now());
create table public.faqs(id uuid primary key default gen_random_uuid(),name text not null,answer text not null,status text not null default 'draft' check(status in('draft','published','archived')),created_at timestamptz default now());
do $$declare t text;p text;begin for t,p in select * from(values('customer_addresses','crm'),('customer_notes','crm'),('customer_followups','crm'),('marketing_consents','marketing'),('event_tasks','operations'),('event_materials','operations'),('social_posts','content'),('faqs','content'))v(t,p)loop execute format('alter table %I enable row level security',t);execute format('create policy read_staff on %I for select to authenticated using(has_permission(%L))',t,p);if t<>'marketing_consents' then execute format('create policy write_staff on %I for insert to authenticated with check(has_permission(%L))',t,p);execute format('create policy update_staff on %I for update to authenticated using(has_permission(%L))with check(has_permission(%L))',t,p,p);end if;execute format('create trigger audit after insert or update or delete on %I for each row execute function audit_change()',t);end loop;end$$;
create policy published on social_posts for select to anon,authenticated using(status='published');create policy published on faqs for select to anon,authenticated using(status='published');
create function public.pause_subscription(p_id uuid,p_start date,p_end date) returns void language plpgsql security definer set search_path=public as $$begin
if not has_permission('operations') or p_end<p_start then raise exception 'Invalid pause';end if;
perform 1 from flower_subscriptions where id=p_id for update;
insert into subscription_pause_periods(subscription_id,start_date,end_date)values(p_id,p_start,p_end);
update delivery_records d set status='skipped',notes='Paused by owner/staff' where subscription_id=p_id and delivery_date between p_start and p_end and status='pending' and not exists(select 1 from invoice_items i where i.delivery_id=d.id);end$$;
create function public.set_marketing_consent(p_id uuid,p_consent boolean,p_source text) returns void language plpgsql security definer set search_path=public as $$begin
if not has_permission('crm') or length(p_source)<3 then raise exception 'Forbidden or source missing';end if;
update customers set marketing_consent=p_consent,consent_at=case when p_consent then now() else null end,consent_source=p_source where id=p_id;
insert into marketing_consents(customer_id,consented,source,recorded_by)values(p_id,p_consent,p_source,auth.uid());end$$;
create function public.accept_quote(p_id uuid,p_event_date date,p_venue text) returns uuid language plpgsql security definer set search_path=public as $$declare q quotations;e uuid;begin
if not has_permission('finance') or not has_permission('operations') then raise exception 'Forbidden';end if;
select * into strict q from quotations where id=p_id and status='accepted' for update;
if q.event_id is not null then return q.event_id;end if;
insert into events(customer_id,name,event_date,venue,agreed_amount,status)values(q.customer_id,q.name,p_event_date,p_venue,q.total,'confirmed')returning id into e;
update quotations set event_id=e where id=p_id;return e;end$$;
revoke all on function pause_subscription(uuid,date,date),set_marketing_consent(uuid,boolean,text),accept_quote(uuid,date,text) from public,anon;
grant execute on function pause_subscription(uuid,date,date),set_marketing_consent(uuid,boolean,text),accept_quote(uuid,date,text) to authenticated;
commit;
