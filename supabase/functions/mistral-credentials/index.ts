// Copyright (c) 2025 Jema Technology.
// Edge Function: mistral-credentials
//
// Manages the *per-user* Mistral account connection for JemaNote.
//
//   POST /mistral-credentials/status     -> { connected, model, key_last4 }
//   POST /mistral-credentials/connect    -> body { api_key, model? } -> status
//   POST /mistral-credentials/model      -> body { model }           -> status
//   POST /mistral-credentials/disconnect -> { connected:false }
//
// The caller must present a valid Supabase user JWT. The API key is validated
// against Mistral, then encrypted at rest through Supabase Vault. It is never
// returned to the client.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.84.0';

// ---------------------------------------------------------------------------
// Self-contained helpers (no sibling _shared import) so the function deploys
// via any method (CLI, Management API, MCP).
// ---------------------------------------------------------------------------
const DEFAULT_MODEL = 'mistral-medium-latest';
const MODEL_ALLOWLIST: readonly string[] = [
  'mistral-small-latest',
  'mistral-medium-latest',
  'mistral-large-latest',
];

function resolveModel(model: unknown, fallback = DEFAULT_MODEL): string {
  if (typeof model === 'string' && MODEL_ALLOWLIST.includes(model)) {
    return model;
  }
  return fallback;
}

function corsHeaders(req: Request): Record<string, string> {
  const requestOrigin = req.headers.get('Origin') ?? '';
  const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  let allowOrigin = '';
  if (configured.length === 0) {
    allowOrigin = requestOrigin || '*';
  } else if (requestOrigin && configured.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  }

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (allowOrigin !== '') {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
  }
  return headers;
}

function jsonResponse(
  body: unknown,
  cors: Record<string, string>,
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function errorResponse(
  cors: Record<string, string>,
  status: number,
  code: string,
  message: string
): Response {
  return jsonResponse({ error: { code, message } }, cors, status);
}
// ---------------------------------------------------------------------------

interface CredentialsStatus {
  connected: boolean;
  model: string | null;
  key_last4: string | null;
  connected_at?: string | null;
}

const MISTRAL_MODELS_URL = 'https://api.mistral.ai/v1/models';

function actionFrom(req: Request, body: Record<string, unknown>): string {
  const path = new URL(req.url).pathname;
  const segment = path.split('/').filter(Boolean).pop() ?? '';
  if (segment && segment !== 'mistral-credentials') {
    return segment;
  }
  return typeof body.action === 'string' ? body.action : 'status';
}

type KeyCheck = 'valid' | 'invalid' | 'unreachable';

async function validateMistralKey(apiKey: string): Promise<KeyCheck> {
  try {
    const res = await fetch(MISTRAL_MODELS_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      return 'valid';
    }
    if (res.status === 401 || res.status === 403) {
      return 'invalid';
    }
    return 'unreachable';
  } catch {
    return 'unreachable';
  }
}

function normalizeStatus(row: CredentialsStatus | null | undefined): CredentialsStatus {
  return {
    connected: Boolean(row?.connected),
    model: row?.model ?? null,
    key_last4: row?.key_last4 ?? null,
    connected_at: row?.connected_at ?? null,
  };
}

Deno.serve(async req => {
  const cors = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (req.method !== 'POST') {
    return errorResponse(cors, 405, 'method_not_allowed', 'Method not allowed');
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  // Cheap pre-check: reject obviously unauthenticated calls before any
  // Auth round-trip or client construction.
  if (!/^Bearer\s+\S+/i.test(authHeader)) {
    return errorResponse(cors, 401, 'unauthorized', 'Authentication required');
  }

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return errorResponse(cors, 500, 'server_misconfigured', 'AI service is not configured');
  }

  const userClient: SupabaseClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return errorResponse(cors, 401, 'unauthorized', 'Authentication required');
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const action = actionFrom(req, body);

  try {
    const { data: allowed, error: rateError } = await admin.rpc('ai_check_rate_limit', {
      p_user_id: user.id,
      p_limit: 30,
      p_window_seconds: 60,
    });
    // Fail closed: if the limiter itself errors, do not let the request through.
    if (rateError || allowed !== true) {
      return errorResponse(
        cors,
        rateError ? 503 : 429,
        rateError ? 'rate_limit_unavailable' : 'rate_limited',
        rateError ? 'Rate limiter unavailable' : 'Too many requests. Please slow down.'
      );
    }

    if (action === 'connect') {
      const apiKey = typeof body.api_key === 'string' ? body.api_key.trim() : '';
      if (apiKey.length < 20) {
        return errorResponse(cors, 400, 'invalid_key', 'The API key looks invalid');
      }

      const check = await validateMistralKey(apiKey);
      if (check === 'invalid') {
        return errorResponse(
          cors,
          400,
          'invalid_key',
          'Mistral rejected this key. Check it and try again.'
        );
      }
      if (check === 'unreachable') {
        return errorResponse(
          cors,
          503,
          'upstream_unreachable',
          'Could not reach Mistral to validate the key. Please retry.'
        );
      }

      const model = resolveModel(body.model);
      const { data, error } = await admin.rpc('ai_connect_mistral', {
        p_user_id: user.id,
        p_api_key: apiKey,
        p_model: model,
      });
      if (error) {
        return errorResponse(cors, 500, 'store_failed', 'Could not save the connection');
      }
      return jsonResponse(normalizeStatus((data as CredentialsStatus[])?.[0]), cors);
    }

    if (action === 'model') {
      const model = resolveModel(body.model);
      const { error } = await admin.rpc('ai_set_mistral_model', {
        p_user_id: user.id,
        p_model: model,
      });
      if (error) {
        return errorResponse(cors, 500, 'store_failed', 'Could not update the model');
      }
      const { data } = await admin.rpc('ai_credentials_status', { p_user_id: user.id });
      return jsonResponse(normalizeStatus((data as CredentialsStatus[])?.[0]), cors);
    }

    if (action === 'disconnect') {
      const { error } = await admin.rpc('ai_disconnect_mistral', { p_user_id: user.id });
      if (error) {
        return errorResponse(cors, 500, 'delete_failed', 'Could not disconnect the account');
      }
      return jsonResponse({ connected: false, model: null, key_last4: null }, cors);
    }

    // Default: status
    const { data, error } = await admin.rpc('ai_credentials_status', { p_user_id: user.id });
    if (error) {
      return errorResponse(cors, 500, 'status_failed', 'Could not read the connection status');
    }
    return jsonResponse(normalizeStatus((data as CredentialsStatus[])?.[0]), cors);
  } catch {
    return errorResponse(cors, 500, 'unexpected', 'Unexpected error');
  }
});
