#!/usr/bin/env bash
# Copyright (c) 2025 Jema Technology.
#
# Deploy the JemaNote AI backend (per-user Mistral account) to Supabase.
#
# Prerequisites:
#   - Supabase CLI installed (https://supabase.com/docs/guides/cli)
#   - SUPABASE_ACCESS_TOKEN exported (Supabase > Account > Access Tokens)
#
# Usage:
#   SUPABASE_ACCESS_TOKEN=sbp_xxx ./supabase/deploy.sh
#
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-yadtnmgyrmigqbndnmho}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install it first." >&2
  exit 1
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "SUPABASE_ACCESS_TOKEN is required." >&2
  exit 1
fi

echo "→ Linking project ${PROJECT_REF}"
supabase link --project-ref "$PROJECT_REF"

echo "→ Applying migrations"
supabase db push

echo "→ Deploying mistral-credentials"
supabase functions deploy mistral-credentials --no-verify-jwt

echo "→ Deploying mistral-proxy"
supabase functions deploy mistral-proxy --no-verify-jwt

echo "→ Deploying auth-guard"
supabase functions deploy auth-guard --no-verify-jwt

echo "Done. Optionally lock CORS with:"
echo '  supabase secrets set ALLOWED_ORIGINS="https://jemanote.app,http://localhost:5173"'
echo 'To enable the anti-robot CAPTCHA (free, Cloudflare Turnstile):'
echo '  supabase secrets set CAPTCHA_ENABLED="true" CAPTCHA_SECRET_KEY="<turnstile-secret>" CAPTCHA_ALLOWED_HOSTNAMES="jemanote.app"'
