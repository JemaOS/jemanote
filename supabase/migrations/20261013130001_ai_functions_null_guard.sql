-- Hardening: the defence-in-depth guard used `auth.uid() is distinct from
-- p_user_id`, which is FALSE when both are NULL. A non-service caller passing
-- p_user_id = NULL therefore slipped past the guard. It is not reachable today
-- (EXECUTE is service_role only), but the guard now also rejects NULL explicitly.

create or replace function public.ai_credentials_status(p_user_id uuid)
returns table (connected boolean, model text, key_last4 text, connected_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null
     or (coalesce(auth.role(), '') <> 'service_role'
         and auth.uid() is distinct from p_user_id) then
    raise exception 'forbidden';
  end if;

  return query
    select
      c.user_id is not null as connected,
      c.model,
      c.key_last4,
      c.connected_at
    from (select p_user_id as user_id) u
    left join public.ai_credentials c on c.user_id = u.user_id;
end;
$$;

create or replace function public.ai_connect_mistral(
  p_user_id uuid,
  p_api_key text,
  p_model   text default 'mistral-medium-latest'
)
returns table (connected boolean, model text, key_last4 text, connected_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing   uuid;
  v_last4      text;
  v_model      text;
  v_key        text;
  v_new_secret uuid;
begin
  if p_user_id is null
     or (coalesce(auth.role(), '') <> 'service_role'
         and auth.uid() is distinct from p_user_id) then
    raise exception 'forbidden';
  end if;

  v_key := trim(coalesce(p_api_key, ''));
  if length(v_key) < 20 then
    raise exception 'invalid_key';
  end if;

  v_last4 := right(v_key, 4);
  v_model := coalesce(nullif(trim(coalesce(p_model, '')), ''), 'mistral-medium-latest');

  select c.vault_secret_id into v_existing
  from public.ai_credentials c
  where c.user_id = p_user_id;

  if v_existing is not null
     and exists (select 1 from vault.secrets s where s.id = v_existing) then
    perform vault.update_secret(v_existing, v_key);
    update public.ai_credentials c
       set key_last4 = v_last4,
           model     = v_model,
           updated_at = now()
     where c.user_id = p_user_id;
  else
    v_new_secret := vault.create_secret(
      v_key,
      'mistral_key_' || p_user_id::text || '_' || gen_random_uuid()::text,
      'JemaNote Mistral API key'
    );

    insert into public.ai_credentials (user_id, vault_secret_id, key_last4, model)
    values (p_user_id, v_new_secret, v_last4, v_model)
    on conflict (user_id) do update
      set vault_secret_id = excluded.vault_secret_id,
          key_last4       = excluded.key_last4,
          model           = excluded.model,
          updated_at      = now();
  end if;

  return query
    select s.connected, s.model, s.key_last4, s.connected_at
    from public.ai_credentials_status(p_user_id) s;
end;
$$;

create or replace function public.ai_get_mistral_key(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
begin
  if p_user_id is null
     or (coalesce(auth.role(), '') <> 'service_role'
         and auth.uid() is distinct from p_user_id) then
    raise exception 'forbidden';
  end if;

  select s.decrypted_secret into v_key
  from public.ai_credentials c
  join vault.decrypted_secrets s on s.id = c.vault_secret_id
  where c.user_id = p_user_id;

  return v_key;
end;
$$;

create or replace function public.ai_set_mistral_model(p_user_id uuid, p_model text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null
     or (coalesce(auth.role(), '') <> 'service_role'
         and auth.uid() is distinct from p_user_id) then
    raise exception 'forbidden';
  end if;

  update public.ai_credentials
     set model      = coalesce(nullif(trim(coalesce(p_model, '')), ''), model),
         updated_at = now()
   where user_id = p_user_id;

  return (select model from public.ai_credentials where user_id = p_user_id);
end;
$$;

create or replace function public.ai_disconnect_mistral(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret uuid;
begin
  if p_user_id is null
     or (coalesce(auth.role(), '') <> 'service_role'
         and auth.uid() is distinct from p_user_id) then
    raise exception 'forbidden';
  end if;

  select c.vault_secret_id into v_secret
  from public.ai_credentials c
  where c.user_id = p_user_id;

  if v_secret is null then
    return false;
  end if;

  delete from public.ai_credentials where user_id = p_user_id;

  begin
    delete from vault.secrets where id = v_secret;
  exception when others then
    raise warning 'ai_disconnect_mistral: could not delete vault secret %: %',
      v_secret, sqlerrm;
  end;

  return true;
end;
$$;

create or replace function public.ai_check_rate_limit(
  p_user_id        uuid,
  p_limit          integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_count  integer;
begin
  if p_user_id is null
     or (coalesce(auth.role(), '') <> 'service_role'
         and auth.uid() is distinct from p_user_id) then
    raise exception 'forbidden';
  end if;

  if p_window_seconds is null or p_window_seconds <= 0 then
    raise exception 'invalid_window';
  end if;

  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.ai_rate_limits (user_id, window_start, count)
  values (p_user_id, v_window, 1)
  on conflict (user_id, window_start)
    do update set count = public.ai_rate_limits.count + 1
  returning count into v_count;

  delete from public.ai_rate_limits
   where user_id = p_user_id
     and window_start < v_window - interval '5 minutes';

  return v_count <= p_limit;
end;
$$;
