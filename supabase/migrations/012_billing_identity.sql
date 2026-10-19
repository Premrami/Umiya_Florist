begin;
drop policy billing_customer_read on customers;
create function public.billing_customers()returns table(id uuid,name text,phone text,email text,billing_address text,status text)language plpgsql security definer set search_path=public as $$begin
if not has_permission('finance')then raise exception 'Forbidden';end if;return query select c.id,c.name,c.phone,c.email,c.billing_address,c.status from customers c;end$$;
revoke all on function billing_customers()from public,anon;grant execute on function billing_customers()to authenticated;
commit;
