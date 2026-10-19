begin;
create function public.post_provider_payment(p_event text,p_hash text,p_link text,p_reference uuid,p_payment text,p_amount bigint,p_currency text,p_link_amount bigint) returns void language plpgsql security definer set search_path=public as $$declare l payment_links;inv invoices;balance bigint;begin
select * into strict l from payment_links where provider_link_id=p_link;
select * into strict inv from invoices where id=l.invoice_id and status='finalized' for update;
if exists(select 1 from payment_provider_events where id=p_event) then return;end if;
if p_reference<>inv.id or p_currency<>'INR' or p_link_amount<>l.amount or p_amount<=0 then raise exception 'Payment mapping mismatch';end if;
if not exists(select 1 from payments where provider_payment_id=p_payment) then
select b.balance into balance from invoice_balances b where b.id=inv.id;
if p_amount>balance then raise exception 'Payment exceeds balance; reconcile manually';end if;
insert into payments(invoice_id,amount,method,provider_payment_id,idempotency_key) values(inv.id,p_amount,'razorpay',p_payment,gen_random_uuid());
end if;
insert into payment_provider_events(id,payload_hash) values(p_event,p_hash);
update payment_links set status=case when (select b.balance from invoice_balances b where b.id=inv.id)<=0 then 'paid' else 'partially_paid' end where id=l.id;
end$$;
revoke all on function post_provider_payment(text,text,text,uuid,text,bigint,text,bigint) from public,anon,authenticated;
grant execute on function post_provider_payment(text,text,text,uuid,text,bigint,text,bigint) to service_role;
create function public.create_direct_invoice(p_customer uuid,p_event uuid,p_description text,p_amount bigint) returns uuid language plpgsql security definer set search_path=public as $$declare i uuid;begin
if not has_permission('finance') or p_amount<0 then raise exception 'Forbidden';end if;
if p_event is not null and not exists(select 1 from events where id=p_event and customer_id=p_customer) then raise exception 'Event customer mismatch';end if;
insert into invoices(customer_id,event_id,total,due_date) values(p_customer,p_event,p_amount,current_date+7) returning id into i;
insert into invoice_items(invoice_id,description,unit_price,amount) values(i,p_description,p_amount,p_amount);return i;end$$;
create function public.adjust_invoice(p_id uuid,p_description text,p_amount bigint) returns void language plpgsql security definer set search_path=public as $$begin
if not has_permission('finance') then raise exception 'Forbidden';end if;
perform 1 from invoices where id=p_id and status='draft' for update;if not found then raise exception 'Draft required';end if;
if (select total from invoices where id=p_id)+p_amount<0 then raise exception 'Negative balance';end if;
insert into invoice_adjustments(invoice_id,description,amount) values(p_id,p_description,p_amount);
update invoices set total=total+p_amount where id=p_id;end$$;
revoke all on function create_direct_invoice(uuid,uuid,text,bigint),adjust_invoice(uuid,text,bigint) from public,anon;
grant execute on function create_direct_invoice(uuid,uuid,text,bigint),adjust_invoice(uuid,text,bigint) to authenticated;
-- Quotation snapshots stop changing after they leave draft. Status transitions remain explicit.
create function protect_quotation() returns trigger language plpgsql set search_path=public as $$begin
if old.status<>'draft' and (new.total<>old.total or new.snapshot<>old.snapshot or new.customer_id<>old.customer_id or new.valid_until<>old.valid_until or new.name<>old.name) then raise exception 'Quotation snapshot is immutable';end if;
return new;end$$;
create trigger quotation_snapshot before update on quotations for each row execute function protect_quotation();
commit;
