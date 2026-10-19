begin;
create table credit_notes(id uuid primary key default gen_random_uuid(),invoice_id uuid not null references invoices,number bigint generated always as identity unique,amount bigint not null check(amount>0),reason text not null,created_at timestamptz not null default now());
create table payment_refunds(id uuid primary key default gen_random_uuid(),payment_id uuid not null references payments,provider_refund_id text unique,amount bigint not null check(amount>0),created_at timestamptz not null default now());
alter table credit_notes enable row level security;alter table payment_refunds enable row level security;
create policy finance_read on credit_notes for select to authenticated using(has_permission('finance'));create policy finance_read on payment_refunds for select to authenticated using(has_permission('finance'));
create view invoice_balances with(security_invoker=true)as select i.id,i.total,coalesce((select sum(amount)from credit_notes where invoice_id=i.id),0)as credits,coalesce((select sum(amount)from payments where invoice_id=i.id),0)-coalesce((select sum(r.amount)from payment_refunds r join payments p on p.id=r.payment_id where p.invoice_id=i.id),0)as paid,i.total-coalesce((select sum(amount)from credit_notes where invoice_id=i.id),0)-coalesce((select sum(amount)from payments where invoice_id=i.id),0)+coalesce((select sum(r.amount)from payment_refunds r join payments p on p.id=r.payment_id where p.invoice_id=i.id),0)as balance from invoices i;
grant select on invoice_balances to authenticated,service_role;
create function public.issue_credit(p_id uuid,p_amount bigint,p_reason text)returns void language plpgsql security definer set search_path=public as $$declare i invoices;begin
if not has_permission('finance') or p_amount<=0 or length(p_reason)<3 then raise exception 'Invalid credit';end if;
select * into strict i from invoices where id=p_id and status='finalized' for update;
if p_amount+coalesce((select sum(amount)from credit_notes where invoice_id=p_id),0)>i.total then raise exception 'Credits exceed invoice total';end if;
insert into credit_notes(invoice_id,amount,reason)values(p_id,p_amount,p_reason);end$$;
create function public.post_provider_refund(p_event text,p_hash text,p_payment text,p_refund text,p_amount bigint)returns void language plpgsql security definer set search_path=public as $$declare p payments;begin
select * into strict p from payments where provider_payment_id=p_payment;
perform 1 from invoices where id=p.invoice_id for update;
if exists(select 1 from payment_provider_events where id=p_event)then return;end if;
if not exists(select 1 from payment_refunds where provider_refund_id=p_refund)then
if p_amount<=0 or p_amount+coalesce((select sum(amount)from payment_refunds where payment_id=p.id),0)>p.amount then raise exception 'Invalid refund amount';end if;
insert into payment_refunds(payment_id,provider_refund_id,amount)values(p.id,p_refund,p_amount);end if;
insert into payment_provider_events(id,payload_hash)values(p_event,p_hash);end$$;
-- Manual collections cannot race a still-collectible provider link.
create function public.prevent_overcollection()returns trigger language plpgsql set search_path=public as $$declare due bigint;begin
perform 1 from invoices where id=new.invoice_id for update;
select balance into due from invoice_balances where id=new.invoice_id;
if new.amount>due then raise exception 'Payment exceeds net invoice balance';end if;
if new.method<>'razorpay' and exists(select 1 from payment_links where invoice_id=new.invoice_id and status in('created','partially_paid'))then raise exception 'Cancel active payment links before a manual collection';end if;return new;end$$;
create trigger payment_balance_guard before insert on payments for each row execute function prevent_overcollection();
create trigger audit after insert on credit_notes for each row execute function audit_change();create trigger audit after insert on payment_refunds for each row execute function audit_change();
revoke all on function issue_credit(uuid,bigint,text),post_provider_refund(text,text,text,text,bigint) from public,anon;
revoke all on function post_provider_refund(text,text,text,text,bigint) from authenticated;
grant execute on function issue_credit(uuid,bigint,text)to authenticated;grant execute on function post_provider_refund(text,text,text,text,bigint)to service_role;
commit;
