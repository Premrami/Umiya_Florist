begin;
-- Delete a section and its history atomically, retaining audit records.
create or replace function public.delete_site_section(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not has_permission('content') then
    raise exception 'Permission denied';
  end if;
  perform 1 from site_sections where id=p_id for update;
  if not found then
    raise exception 'Section not found';
  end if;
  delete from content_revisions where section_id=p_id;
  delete from site_sections where id=p_id;
end;
$$;
revoke all on function public.delete_site_section(uuid) from public, anon;
grant execute on function public.delete_site_section(uuid) to authenticated;
commit;
