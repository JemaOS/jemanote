// Copyright (c) 2025 Jema Technology.
// Edge Function: mistral-proxy
//
// Forwards chat requests to Mistral using the *connected user's own* API key.
// The global/master key is never used: if the caller has not connected an
// account, the request is rejected with a `not_connected` error so the client
// can prompt the user to connect.
//
// Contract kept for the client: the upstream Mistral payload is wrapped in
// `{ data: <payload> }`.

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

const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions';
const MAX_TOKENS_CAP = 8192;
const MAX_MESSAGES = 50;
const MAX_TOTAL_CHARS = 200_000;
const ALLOWED_ROLES = new Set(['system', 'user', 'assistant', 'tool']);

interface ChatBody {
  model?: string;
  messages?: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
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

  let body: ChatBody = {};
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return errorResponse(cors, 400, 'invalid_request', 'Invalid JSON body');
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return errorResponse(cors, 400, 'invalid_request', 'No messages provided');
  }
  if (messages.length > MAX_MESSAGES) {
    return errorResponse(cors, 400, 'invalid_request', 'Too many messages');
  }

  let totalChars = 0;
  for (const message of messages) {
    if (
      !message ||
      typeof message.content !== 'string' ||
      typeof message.role !== 'string' ||
      !ALLOWED_ROLES.has(message.role)
    ) {
      return errorResponse(cors, 400, 'invalid_request', 'Invalid message format');
    }
    totalChars += message.content.length;
  }
  if (totalChars > MAX_TOTAL_CHARS) {
    return errorResponse(cors, 400, 'invalid_request', 'Payload too large');
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: allowed, error: rateError } = await admin.rpc('ai_check_rate_limit', {
    p_user_id: user.id,
    p_limit: 120,
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

  const { data: apiKeyData, error: keyError } = await admin.rpc('ai_get_mistral_key', {
    p_user_id: user.id,
  });

  const apiKey = typeof apiKeyData === 'string' ? apiKeyData : '';

  if (keyError || !apiKey) {
    return errorResponse(
      cors,
      409,
      'not_connected',
      'No Mistral account is connected for this user'
    );
  }

  // Model: the user's stored choice, overridable per-request within allowlist.
  const { data: statusData } = await admin.rpc('ai_credentials_status', {
    p_user_id: user.id,
  });
  const storedModel =
    (statusData as Array<{ model?: string }> | null)?.[0]?.model ?? undefined;
  const model = resolveModel(body.model, resolveModel(storedModel));

  const rawMaxTokens = Number(body.max_tokens);
  const maxTokens = Number.isFinite(rawMaxTokens)
    ? Math.min(Math.max(1, Math.floor(rawMaxTokens)), MAX_TOKENS_CAP)
    : 2048;
  const rawTemperature = Number(body.temperature);
  const temperature = Number.isFinite(rawTemperature)
    ? Math.min(Math.max(0, rawTemperature), 1)
    : 0.7;

  try {
    const upstream = await fetch(MISTRAL_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const text = await upstream.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: { message: text } };
    }

    if (!upstream.ok) {
      // Do not relay the raw upstream body to the caller; return a generic,
      // normalized error (no internal/upstream detail leakage).
      return errorResponse(
        cors,
        upstream.status >= 500 ? 502 : 400,
        'upstream_error',
        'Mistral API error'
      );
    }

    return jsonResponse({ data: payload }, cors);
  } catch {
    return errorResponse(cors, 502, 'upstream_unreachable', 'Mistral API is unreachable');
  }
});
