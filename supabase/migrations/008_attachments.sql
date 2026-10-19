begin;
create table event_attachments(id uuid primary key default gen_random_uuid(),event_id uuid not null references events,name text not null,path text not null unique,mime_type text not null,bytes bigint not null,created_at timestamptz default now());alter table event_attachments enable row level security;
create policy ops_read on event_attachments for select to authenticated using(has_permission('operations'));create policy ops_insert on event_attachments for insert to authenticated with check(has_permission('operations'));
commit;
