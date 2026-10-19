begin;
alter table flower_subscriptions add column pricing_mode text not null default 'fixed' check(pricing_mode in('fixed','items'));
create table subscription_items(id uuid primary key default gen_random_uuid(),subscription_id uuid not null references flower_subscriptions,name text not null,quantity integer not null check(quantity>0),unit_price bigint not null check(unit_price>=0),created_at timestamptz default now());
create table subscription_price_changes(id uuid primary key default gen_random_uuid(),subscription_id uuid not null references flower_subscriptions,effective_date date not null,amount bigint not null check(amount>=0),reason text not null,created_at timestamptz default now(),unique(subscription_id,effective_date));
create table delivery_record_items(id uuid primary key default gen_random_uuid(),delivery_id uuid not null references delivery_records,description text not null,quantity integer not null check(quantity>0),unit_price bigint not null check(unit_price>=0),amount bigint not null check(amount>=0));
do $$declare t text;begin foreach t in array array['subscription_items','subscription_price_changes','delivery_record_items'] loop execute format('alter table %I enable row level security',t);execute format('create policy ops_read on %I for select to authenticated using(has_permission(''operations''))',t);end loop;end$$;
create function public.add_subscription_item(p_id uuid,p_name text,p_quantity integer,p_price bigint) returns void language plpgsql security definer set search_path=public as $$begin
if not has_permission('operations') or p_quantity<=0 or p_price<0 then raise exception 'Invalid item';end if;
perform 1 from flower_subscriptions where id=p_id for update;
insert into subscription_items(subscription_id,name,quantity,unit_price)values(p_id,p_name,p_quantity,p_price);
update flower_subscriptions set pricing_mode='items' where id=p_id;end$$;
create function public.change_subscription_price(p_id uuid,p_date date,p_amount bigint,p_reason text) returns void language plpgsql security definer set search_path=public as $$begin
if not has_permission('operations') or p_amount<0 then raise exception 'Invalid price';end if;
perform 1 from flower_subscriptions where id=p_id for update;
insert into subscription_price_changes(subscription_id,effective_date,amount,reason)values(p_id,p_date,p_amount,p_reason);
update delivery_records d set amount=p_amount where subscription_id=p_id and status='pending' and delivery_date>=p_date and not exists(select 1 from invoice_items i where i.delivery_id=d.id);end$$;
create or replace function public.schedule_deliveries(p_date date) returns integer language plpgsql security definer set search_path=public as $$declare n integer;begin
if not has_permission('operations') then raise exception 'Forbidden';end if;
with inserted as(
insert into delivery_records(subscription_id,delivery_date,amount)
select s.id,p_date,case when s.pricing_mode='items' then coalesce((select sum(quantity::bigint*unit_price)from subscription_items where subscription_id=s.id),0) else coalesce((select amount from subscription_price_changes p where p.subscription_id=s.id and p.effective_date<=p_date order by effective_date desc limit 1),s.daily_amount)end from flower_subscriptions s where s.status='active' and p_date>=s.start_date and(s.end_date is null or p_date<=s.end_date)and extract(dow from p_date)::int=any(s.delivery_days)and(s.frequency<>'weekdays' or extract(dow from p_date)between 1 and 5)and(s.frequency<>'weekly' or extract(dow from p_date)=extract(dow from s.start_date))and not exists(select 1 from subscription_pause_periods p where p.subscription_id=s.id and p_date between p.start_date and p.end_date)on conflict(subscription_id,delivery_date)do nothing returning *)
select count(*)into n from inserted;
insert into delivery_record_items(delivery_id,description,quantity,unit_price,amount)select d.id,i.name,i.quantity,i.unit_price,i.quantity::bigint*i.unit_price from delivery_records d join flower_subscriptions s on s.id=d.subscription_id and s.pricing_mode='items' join subscription_items i on i.subscription_id=s.id where d.delivery_date=p_date and d.status='pending' and not exists(select 1 from delivery_record_items x where x.delivery_id=d.id);
return n;end$$;
revoke all on function add_subscription_item(uuid,text,integer,bigint),change_subscription_price(uuid,date,bigint,text) from public,anon;
grant execute on function add_subscription_item(uuid,text,integer,bigint),change_subscription_price(uuid,date,bigint,text) to authenticated;
commit;
