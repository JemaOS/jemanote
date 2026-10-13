-- Copyright (c) 2025 Jema Technology.
-- Per-user AI credentials (Mistral).
--
-- The user's own Mistral API key is stored encrypted at rest using Supabase
-- Vault. The browser NEVER receives this table or the key: API clients have no
-- access (RLS + REVOKE) and every read/write goes through the Edge Functions
-- using the service role, after the caller's JWT has been verified.

create extension if not exists supabase_vault with schema vault;

create table if not exists public.ai_credentials (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  provider        text not null default 'mistral',
  model           text not null default 'mistral-medium-latest',
  vault_secret_id uuid not null,
  key_last4       text,
  connected_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.ai_credentials is
  'Per-user AI provider credentials. API keys are encrypted with Supabase Vault.';

-- Deny everything to API clients. The service role bypasses RLS.
alter table public.ai_credentials enable row level security;
revoke all on public.ai_credentials from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER). Only the service role may execute them;
-- the Edge Functions call them after verifying the caller's JWT.
--
-- Defence in depth: each function also refuses to act on a user id that is not
-- the caller's own (unless the caller is the service role). This keeps the
-- invariant even if the EXECUTE grants are ever loosened by mistake.
-- ---------------------------------------------------------------------------

create or replace function public.ai_credentials_status(p_user_id uuid)
returns table (connected boolean, model text, key_last4 text, connected_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_user_id then
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
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_user_id then
    raise exception 'forbidden';
  end if;

  if p_user_id is null then
    raise exception 'missing_user';
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
    -- Existing credential with a live secret: rotate in place.
    perform vault.update_secret(v_existing, v_key);
    update public.ai_credentials c
       set key_last4 = v_last4,
           model     = v_model,
           updated_at = now()
     where c.user_id = p_user_id;
  else
    -- No row, or a row whose secret no longer exists: create a fresh secret.
    -- The secret name is unique per connection so a stale secret (whose delete
    -- failed) can never block a future reconnection.
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
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_user_id then
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
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_user_id then
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
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_user_id then
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
    -- Deleting the Vault secret may be restricted on some projects. The
    -- credential row is already gone (access revoked) and the secret name is
    -- unique, so a leftover secret can never block a future reconnection.
    raise warning 'ai_disconnect_mistral: could not delete vault secret %: %',
      v_secret, sqlerrm;
  end;

  return true;
end;
$$;

-- Lock every function down to the service role only.
revoke all on function public.ai_credentials_status(uuid) from public, anon, authenticated;
revoke all on function public.ai_connect_mistral(uuid, text, text) from public, anon, authenticated;
revoke all on function public.ai_get_mistral_key(uuid) from public, anon, authenticated;
revoke all on function public.ai_set_mistral_model(uuid, text) from public, anon, authenticated;
revoke all on function public.ai_disconnect_mistral(uuid) from public, anon, authenticated;

grant execute on function public.ai_credentials_status(uuid) to service_role;
grant execute on function public.ai_connect_mistral(uuid, text, text) to service_role;
grant execute on function public.ai_get_mistral_key(uuid) to service_role;
grant execute on function public.ai_set_mistral_model(uuid, text) to service_role;
grant execute on function public.ai_disconnect_mistral(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Per-user rate limiting (durable, service-role only). Guards the Edge
-- Functions against abuse: `connect` validates a caller-supplied key against
-- Mistral (outbound request + key oracle), and the proxy is an unbounded relay.
-- ---------------------------------------------------------------------------

create table if not exists public.ai_rate_limits (
  user_id      uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (user_id, window_start)
);

alter table public.ai_rate_limits enable row level security;
revoke all on public.ai_rate_limits from anon, authenticated;

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
  if coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is distinct from p_user_id then
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

  -- Opportunistically drop old windows for this user.
  delete from public.ai_rate_limits
   where user_id = p_user_id
     and window_start < v_window - interval '5 minutes';

  return v_count <= p_limit;
end;
$$;

revoke all on function public.ai_check_rate_limit(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.ai_check_rate_limit(uuid, integer, integer) to service_role;
