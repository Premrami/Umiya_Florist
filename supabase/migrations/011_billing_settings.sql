begin;
update site_settings set private='{"invoice_prefix":"UF","quotation_prefix":"UQ","due_days":7,"invoice_footer":"Thank you for choosing Umiya Florist.","payment_instructions":"","gstin":"","tax_bps":0,"retention_days":365,"default_delivery_charge":0}'::jsonb||private;
create function public.recalculate_invoice(p_id uuid)returns void language plpgsql security definer set search_path=public as $$declare i invoices;cfg jsonb;base bigint;rate bigint;tax bigint;due_days integer;begin
if not has_permission('finance')then raise exception 'Forbidden';end if;select * into strict i from invoices where id=p_id and status='draft' for update;select private into cfg from site_settings where id=1;
base=coalesce((select sum(amount)from invoice_items where invoice_id=p_id),0)+coalesce((select sum(amount)from invoice_adjustments where invoice_id=p_id),0);
if base<0 then raise exception 'Negative taxable base';end if;
rate=coalesce((i.snapshot->>'tax_bps')::bigint,(cfg->>'tax_bps')::bigint,0);if rate<0 or rate>2800 or rate>0 and length(coalesce(cfg->>'gstin',''))<>15 then raise exception 'Tax configuration requires a valid GSTIN';end if;
tax=(base*rate+5000)/10000;due_days=coalesce((cfg->>'due_days')::integer,7);
update invoices set total=base+tax,due_date=case when i.snapshot?'tax_bps'then i.due_date when i.period is not null then(i.period+interval'1 month')::date+due_days else current_date+due_days end,snapshot=i.snapshot||jsonb_build_object('subtotal',base,'tax_bps',rate,'tax_amount',tax,'gstin',coalesce(i.snapshot->>'gstin',cfg->>'gstin',''))where id=p_id;end$$;
alter function generate_monthly(date)rename to generate_monthly_base;
create function public.generate_monthly(p_month date)returns integer language plpgsql security definer set search_path=public as $$declare n integer;i record;begin
if not has_permission('finance')then raise exception 'Forbidden';end if;n=generate_monthly_base(p_month);for i in select id from invoices where status='draft' and period=date_trunc('month',p_month)::date and not(snapshot?'tax_bps')loop perform recalculate_invoice(i.id);end loop;return n;end$$;
alter function create_direct_invoice(uuid,uuid,text,bigint)rename to create_direct_invoice_base;
create function public.create_direct_invoice(p_customer uuid,p_event uuid,p_description text,p_amount bigint)returns uuid language plpgsql security definer set search_path=public as $$declare i uuid;begin i=create_direct_invoice_base(p_customer,p_event,p_description,p_amount);perform recalculate_invoice(i);return i;end$$;
alter function adjust_invoice(uuid,text,bigint)rename to adjust_invoice_base;
create function public.adjust_invoice(p_id uuid,p_description text,p_amount bigint)returns void language plpgsql security definer set search_path=public as $$begin perform adjust_invoice_base(p_id,p_description,p_amount);perform recalculate_invoice(p_id);end$$;
create or replace function public.finalize_invoice(p_id uuid)returns void language plpgsql security definer set search_path=public as $$declare inv invoices;c customers;issuer jsonb;cfg jsonb;items jsonb;adjustments jsonb;begin
if not has_permission('finance')then raise exception 'Forbidden';end if;perform recalculate_invoice(p_id);select * into strict inv from invoices where id=p_id and status='draft' for update;
select * into strict c from customers where id=inv.customer_id;select public,private into issuer,cfg from site_settings where id=1;
issuer=issuer||jsonb_build_object('gstin',inv.snapshot->>'gstin','invoice_footer',cfg->>'invoice_footer','payment_instructions',cfg->>'payment_instructions');
select coalesce(jsonb_agg(to_jsonb(x)),'[]')into items from invoice_items x where invoice_id=p_id;select coalesce(jsonb_agg(to_jsonb(x)),'[]')into adjustments from invoice_adjustments x where invoice_id=p_id;
update invoices set status='finalized',snapshot=inv.snapshot||jsonb_build_object('number_label',coalesce(cfg->>'invoice_prefix','UF')||'-'||inv.number,'issuer',issuer,'customer',jsonb_build_object('name',c.name,'phone',c.phone,'email',c.email,'billing_address',c.billing_address),'items',items,'adjustments',adjustments)where id=p_id;end$$;
-- Base functions are implementation details, not alternate public billing paths.
revoke all on function recalculate_invoice(uuid),generate_monthly_base(date),create_direct_invoice_base(uuid,uuid,text,bigint),adjust_invoice_base(uuid,text,bigint)from public,anon,authenticated;
revoke all on function generate_monthly(date),create_direct_invoice(uuid,uuid,text,bigint),adjust_invoice(uuid,text,bigint)from public,anon;
grant execute on function generate_monthly(date),create_direct_invoice(uuid,uuid,text,bigint),adjust_invoice(uuid,text,bigint)to authenticated;
commit;
