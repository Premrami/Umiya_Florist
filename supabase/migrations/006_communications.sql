begin;
alter table communication_logs add constraint provider_message_unique unique(provider_id);
-- Supabase authentication remains invitation-only; account membership is separately provisioned.
-- Staff data access stays denied unless the assigned-work permission model is implemented.
commit;
