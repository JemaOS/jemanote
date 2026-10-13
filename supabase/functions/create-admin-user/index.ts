// Copyright (c) 2025 Jema Technology.
// Edge Function: create-admin-user (hardened)
//
// Creates a user via the Supabase Admin API. Privileged operation: it may only
// be called server-side, so it requires the project's service_role key.
// anon/authenticated callers are rejected with 403.
//
// NOTE: the original (vulnerable) version accepted any valid JWT, including the
// public anon key, and created users with email pre-verified. This hardened
// version restores the intended server-only contract.

import { createClient } from 'npm:@supabase/supabase-js@2.84.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function decodeRole(token: string): string {
  try {
    const part = token.split('.')[1] ?? '';
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { role?: string };
    return typeof payload.role === 'string' ? payload.role : '';
  } catch {
    return '';
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok');
  }
  if (req.method !== 'POST') {
    return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: { code: 'SERVER_MISCONFIGURED', message: 'Not configured' } }, 500);
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  // The gateway (verify_jwt) already validated the signature; only the
  // service_role key may perform privileged user creation.
  if (decodeRole(token) !== 'service_role' && token !== SERVICE_ROLE_KEY) {
    return json({ error: { code: 'FORBIDDEN', message: 'service_role required' } }, 403);
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return json(
      { error: { code: 'MISSING_PARAMS', message: 'Email and password are required' } },
      400
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return json({ error: { code: 'CREATE_FAILED', message: error.message } }, 400);
  }

  return json({
    success: true,
    message: 'User created',
    user: {
      id: data.user?.id,
      email: data.user?.email,
      created_at: data.user?.created_at,
      method: 'admin_api',
    },
  });
});
