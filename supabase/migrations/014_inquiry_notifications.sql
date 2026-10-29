begin;
create table public.inquiry_notifications (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  channel text not null check (channel in ('whatsapp','sms')),
  status text not null default 'pending' check (status in ('pending','processing','disabled','not_configured','provider_accepted','failed','uncertain')),
  attempts integer not null default 0 check (attempts>=0),
  lease_token uuid,
  locked_at timestamptz,
  provider_id text,
  provider_status text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(inquiry_id,channel)
);
alter table public.inquiry_notifications enable row level security;
create policy owner_read on public.inquiry_notifications for select to authenticated using(public.has_permission('owner'));
grant select on public.inquiry_notifications to authenticated;
grant select,insert,update,delete on public.inquiry_notifications to service_role;
create index inquiry_notifications_pending on public.inquiry_notifications(created_at) where status='pending';
create function public.queue_inquiry_notifications() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into inquiry_notifications(inquiry_id,channel) values(new.id,'whatsapp'),(new.id,'sms') on conflict(inquiry_id,channel) do nothing;
  return new;
end;
$$;
revoke all on function public.queue_inquiry_notifications() from public,anon,authenticated;
create trigger queue_admin_alerts after insert on public.inquiries for each row execute function public.queue_inquiry_notifications();
-- No historical backfill: enabling alerts must not notify about old inquiries.
create function public.claim_inquiry_notifications(p_inquiry_id uuid default null,p_notification_id uuid default null,p_limit integer default 4)
returns setof public.inquiry_notifications language plpgsql security definer set search_path=public as $$
begin
  -- A lost worker might have sent a message. Never automatically resend an ambiguous attempt.
  update inquiry_notifications set status='uncertain',last_error='Worker stopped before confirming the result. Check Twilio logs before resending.',updated_at=now()
    where status='processing' and locked_at<now()-interval '5 minutes';
  return query
    with candidates as (
      select id from inquiry_notifications where status='pending' and attempts<5
        and (p_inquiry_id is null or inquiry_id=p_inquiry_id)
        and (p_notification_id is null or id=p_notification_id)
      order by created_at,id for update skip locked limit greatest(1,least(coalesce(p_limit,4),4))
    )
    update inquiry_notifications n set status='processing',attempts=n.attempts+1,lease_token=gen_random_uuid(),locked_at=now(),updated_at=now()
      from candidates c where n.id=c.id returning n.*;
end;
$$;
revoke all on function public.claim_inquiry_notifications(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.claim_inquiry_notifications(uuid,uuid,integer) to service_role;
commit;
