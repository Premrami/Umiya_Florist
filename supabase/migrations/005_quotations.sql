begin;
alter table subscription_pause_periods add column created_at timestamptz not null default now();
create table quotation_items(id uuid primary key default gen_random_uuid(),quotation_id uuid not null references quotations,description text not null,quantity integer not null check(quantity>0),unit_price bigint not null check(unit_price>=0),amount bigint not null check(amount>=0));
alter table quotation_items enable row level security;create policy finance_read on quotation_items for select to authenticated using(has_permission('finance'));
create function public.save_quotation(p_id uuid,p_customer uuid,p_name text,p_valid date,p_items jsonb) returns uuid language plpgsql security definer set search_path=public as $$declare q uuid;total_amount bigint;lines jsonb;begin
if not has_permission('finance') or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>100 then raise exception 'Invalid quotation';end if;
if exists(select 1 from jsonb_to_recordset(p_items) as x(description text,quantity int,unit_price bigint)where length(description)<1 or quantity<1 or unit_price<0 or unit_price>1000000000000 or quantity>10000) then raise exception 'Invalid quotation item';end if;
select sum(quantity::bigint*unit_price),jsonb_agg(jsonb_build_object('description',description,'quantity',quantity,'unit_price',unit_price,'amount',quantity::bigint*unit_price))into total_amount,lines from jsonb_to_recordset(p_items)as x(description text,quantity int,unit_price bigint);
if p_id is null then insert into quotations(customer_id,name,valid_until,total,snapshot)values(p_customer,p_name,p_valid,total_amount,jsonb_build_object('items',lines))returning id into q;
else perform 1 from quotations where id=p_id and status='draft' for update;if not found then raise exception 'Draft quotation required';end if;q=p_id;update quotations set customer_id=p_customer,name=p_name,valid_until=p_valid,total=total_amount,snapshot=jsonb_build_object('items',lines)where id=q;delete from quotation_items where quotation_id=q;end if;
insert into quotation_items(quotation_id,description,quantity,unit_price,amount)select q,description,quantity,unit_price,quantity::bigint*unit_price from jsonb_to_recordset(p_items)as x(description text,quantity int,unit_price bigint);return q;end$$;
create function public.transition_quote(p_id uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$declare q quotations;c customers;issuer jsonb;begin
if not has_permission('finance') then raise exception 'Forbidden';end if;
select * into strict q from quotations where id=p_id for update;
if not(q.status='draft' and p_status='sent' or q.status='sent' and p_status in('accepted','rejected'))then raise exception 'Invalid quotation transition';end if;
if p_status='sent' then select * into strict c from customers where id=q.customer_id;select public into issuer from site_settings where id=1;
update quotations set status=p_status,snapshot=q.snapshot||jsonb_build_object('issuer',issuer,'customer',jsonb_build_object('name',c.name,'phone',c.phone,'billing_address',c.billing_address))where id=p_id;
else update quotations set status=p_status where id=p_id;end if;end$$;
-- Quotations can only be written through the transactional functions.
drop policy staff_insert on quotations;drop policy staff_update on quotations;
revoke all on function save_quotation(uuid,uuid,text,date,jsonb),transition_quote(uuid,text) from public,anon;
grant execute on function save_quotation(uuid,uuid,text,date,jsonb),transition_quote(uuid,text) to authenticated;
commit;
