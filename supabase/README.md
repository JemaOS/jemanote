# JemaNote — AI backend (Supabase)

Per-user Mistral connection. Each user connects **their own** Mistral account;
the API key is validated, then encrypted at rest with **Supabase Vault** and
never returned to the browser. The global/master key is no longer used.

## Contents

| Path | Role |
| --- | --- |
| `migrations/20261013120000_ai_credentials.sql` | Table `ai_credentials` (RLS deny-all) + Vault helpers, service-role only |
| `functions/mistral-credentials/index.ts` | `status` / `connect` / `model` / `disconnect` |
| `functions/mistral-proxy/index.ts` | Chat endpoint using the caller's own key |

## Deploy

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli) and a project
access token (`SUPABASE_ACCESS_TOKEN`).

```bash
cd jemanote
supabase link --project-ref yadtnmgyrmigqbndnmho
supabase db push                       # applies the migration
supabase functions deploy mistral-credentials --no-verify-jwt
supabase functions deploy mistral-proxy       --no-verify-jwt
```

Set `ALLOWED_ORIGINS` (optional, comma-separated) as a function secret to lock
CORS down:

```bash
supabase secrets set ALLOWED_ORIGINS="https://jemanote.app,http://localhost:5173"
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically by the platform.

## Security notes

- The API key is never readable by `anon`/`authenticated`; only `service_role`
  can execute the helper functions.
- `mistral-proxy` resolves the key from the authenticated user's JWT, so one
  user can never spend another user's credits.
- Keys are validated against `GET https://api.mistral.ai/v1/models` before
  being stored.
