-- DEVELOPMENT FIXTURES ONLY. Never run against the live business database.
-- Run with a database administrator in an isolated development project.
begin;
insert into customers(id,name,phone,customer_type,billing_address,notes)values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DEVELOPMENT — daily flower client','910000000001','Regular Pooja Customer','Fixture address, not a real customer','Synthetic test fixture; do not contact')on conflict do nothing;
insert into flower_subscriptions(id,customer_id,name,daily_amount,start_date)values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DEVELOPMENT — daily pooja flowers',5000,'2026-09-01')on conflict do nothing;
insert into delivery_records(subscription_id,delivery_date,status,amount)select'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','2026-09-01'::date+n,case when n<28 then'delivered'else'skipped'end,5000 from generate_series(0,29)n on conflict do nothing;
insert into catalog_items(name,category,description,image_url,status)values('DEVELOPMENT — Rose edit','Rose Bouquets','Reference collection. Replace before publishing.','/images/roses.jpg','draft'),('DEVELOPMENT — Seasonal edit','Seasonal Flowers','Reference collection. Replace before publishing.','/images/petals.jpg','draft'),('DEVELOPMENT — Mixed blooms','Mixed Flower Bouquets','Reference collection. Replace before publishing.','/images/bouquet.jpg','draft');
insert into events(customer_id,name,event_type,event_date,venue,agreed_amount,notes)values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','DEVELOPMENT — wedding fixture','Wedding','2026-12-01','Fixture venue',1500000,'Synthetic fixture; not a real booking');
insert into inventory_items(name,item_type,unit,reorder_threshold,unit_cost)values('DEVELOPMENT — Rose stems','Fresh flowers','stems',20,1500),('DEVELOPMENT — Kraft wrap','Packaging','pieces',10,500);
-- No fabricated reviews or project photographs are published.
commit;
