-- Security hardening of legacy public objects (applied on the project).
--
-- 1) get_graph_data(p_user_id) was SECURITY DEFINER and executable by anon /
--    authenticated with an arbitrary p_user_id -> IDOR (any user could read
--    another user's notes/links). It now ignores the supplied id, uses
--    auth.uid(), runs as the caller so RLS applies, and is granted only to
--    authenticated.
-- 2) get_graph_data() (no-arg stub) is locked to service_role only.
-- 3) Trigger helper functions are no longer executable via RPC.

-- 1) get_graph_data(p_user_id): IDOR fix + least privilege.
create or replace function public.get_graph_data(p_user_id uuid)
returns table (nodes jsonb, edges jsonb)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  return query
    select
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', n.id, 'title', n.title, 'created_at', n.created_at,
            'updated_at', n.updated_at, 'is_pinned', n.is_pinned
          )
        )
        from public.notes n where n.user_id = v_uid
      ) as nodes,
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', l.id, 'source', l.source_note_id,
            'target', l.target_note_id, 'type', l.link_type
          )
        )
        from public.links l where l.user_id = v_uid
      ) as edges;
end;
$$;

revoke all on function public.get_graph_data(uuid) from public, anon;
grant execute on function public.get_graph_data(uuid) to authenticated;

-- 2) No-arg stub: service_role only.
create or replace function public.get_graph_data()
returns json
language plpgsql
security definer
set search_path = ''
as $$
begin
  return null;
end;
$$;

revoke all on function public.get_graph_data() from public, anon, authenticated;

-- 3) Trigger helpers: revoke direct RPC execution and harden search_path.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.notes_search_vector_update() from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;

alter function public.handle_new_user() set search_path = '';
alter function public.notes_search_vector_update() set search_path = '';
alter function public.update_updated_at_column() set search_path = '';
