// Copyright (c) 2025 Jema Technology.
// Edge Function: auth-guard
//
// Proxy d'authentification (email + mot de passe) avec protection anti-robot :
//   1. Rate limiting brut par IP et par email (fenêtre glissante, DB).
//   2. CAPTCHA à seuil : au-delà de N échecs, un token Turnstile est exigé.
//   3. Le mot de passe est vérifié par GoTrue (aucun secret manipulé ici).
//
// Le client peut appeler cette fonction à la place de
// `supabase.auth.signInWithPassword` / `signUp` en activant
// VITE_AUTH_GUARD_ENABLED=true. La protection native Supabase (rate limits,
// captcha) reste recommandée en défense en profondeur.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const CAPTCHA = {
  enabled: String(Deno.env.get('CAPTCHA_ENABLED') ?? 'false').toLowerCase() === 'true',
  secret: Deno.env.get('CAPTCHA_SECRET_KEY') ?? '',
  after: Number(Deno.env.get('AUTH_CAPTCHA_AFTER') ?? 3),
  windowSec: Number(Deno.env.get('AUTH_CAPTCHA_WINDOW_SEC') ?? 900),
  allowedHostnames: (Deno.env.get('CAPTCHA_ALLOWED_HOSTNAMES') ?? '')
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(Boolean)
};

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const RATE_LIMITS: Record<string, { ip: { max: number; windowSec: number }; email: { max: number; windowSec: number } }> = {
  signin: { ip: { max: 10, windowSec: 300 }, email: { max: 5, windowSec: 900 } },
  signup: { ip: { max: 5, windowSec: 3600 }, email: { max: 2, windowSec: 60 } }
};

type Action = 'signin' | 'signup';

function corsHeaders(origin: string | null): Record<string, string> {
  const header: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin'
  };
  if (ALLOWED_ORIGINS.length === 0) {
    header['Access-Control-Allow-Origin'] = '*';
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    header['Access-Control-Allow-Origin'] = origin;
  } else {
    header['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS[0];
  }
  return header;
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

function extractClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') ?? req.headers.get('cf-connecting-ip') ?? 'unknown';
}

async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function rpc(name: string, params: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  if (!res.ok) return null;
  return await res.json().catch(() => null);
}

async function checkRateLimit(
  keyType: 'ip' | 'email',
  keyValue: string,
  action: Action,
  max: number,
  windowSec: number
): Promise<{ allowed: boolean; retryAfter: number }> {
  const rows = (await rpc('check_and_record_rate_limit', {
    p_key_type: keyType,
    p_key_value: keyValue,
    p_action: action,
    p_max_attempts: max,
    p_window_seconds: windowSec
  })) as Array<{ allowed: boolean; current_count: number; retry_after_seconds: number }> | null;

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return { allowed: true, retryAfter: 0 };
  return { allowed: row.allowed === true, retryAfter: row.retry_after_seconds ?? 0 };
}

async function countFailures(keyType: 'ip' | 'email', keyValue: string, action: Action): Promise<number> {
  const n = await rpc('count_auth_failures', {
    p_key_type: keyType,
    p_key_value: keyValue,
    p_action: action,
    p_window_seconds: CAPTCHA.windowSec
  });
  return typeof n === 'number' ? n : Number(n) || 0;
}

async function recordFailure(keyType: 'ip' | 'email', keyValue: string, action: Action): Promise<void> {
  await rpc('record_auth_failure', { p_key_type: keyType, p_key_value: keyValue, p_action: action });
}

async function clearFailures(keyType: 'ip' | 'email', keyValue: string, action: Action): Promise<void> {
  await rpc('clear_auth_failures', { p_key_type: keyType, p_key_value: keyValue, p_action: action });
}

async function verifyCaptchaToken(token: string, ip: string): Promise<boolean> {
  if (!CAPTCHA.secret) return false;
  try {
    const form = new URLSearchParams();
    form.set('secret', CAPTCHA.secret);
    form.set('response', token);
    if (ip && ip !== 'unknown') form.set('remoteip', ip);

    const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body: form });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.success !== true) return false;
    if (
      CAPTCHA.allowedHostnames.length &&
      data?.hostname &&
      !CAPTCHA.allowedHostnames.includes(String(data.hostname).toLowerCase())
    ) {
      return false;
    }
    return true;
  } catch (e) {
    console.error('[auth-guard] captcha verification error', e);
    return false;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async req => {
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (req.method !== 'POST') {
    return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, 405, cors);
  }
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
    return json({ error: { code: 'SERVER_MISCONFIGURED', message: 'Not configured' } }, 500, cors);
  }

  let body: { action?: string; email?: string; password?: string; captchaToken?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const action = body.action === 'signup' ? 'signup' : body.action === 'signin' ? 'signin' : null;
  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  const captchaToken = body.captchaToken;

  if (!action) {
    return json({ error: { code: 'VALIDATION_ERROR', message: 'action invalide' } }, 400, cors);
  }
  if (!email || !EMAIL_RE.test(email)) {
    return json({ error: { code: 'VALIDATION_ERROR', message: 'Email invalide' } }, 400, cors);
  }
  if (!password || password.length < 6 || password.length > 128) {
    return json(
      { error: { code: 'VALIDATION_ERROR', message: 'Le mot de passe doit faire entre 6 et 128 caractères' } },
      400,
      cors
    );
  }

  const clientIp = extractClientIp(req);
  const ipKey = await sha256(clientIp);
  const emailKey = await sha256(`email:${email}`);

  // ── 1. Rate limiting brut
  const limits = RATE_LIMITS[action];
  const ipLimit = await checkRateLimit('ip', ipKey, action, limits.ip.max, limits.ip.windowSec);
  const emailLimit = await checkRateLimit('email', emailKey, action, limits.email.max, limits.email.windowSec);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    const retryAfter = Math.max(ipLimit.retryAfter, emailLimit.retryAfter, 1);
    return json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: `Trop de tentatives. Réessayez dans ${retryAfter} secondes.`
        }
      },
      429,
      cors
    );
  }

  // ── 2. CAPTCHA à seuil
  if (CAPTCHA.enabled) {
    if (!CAPTCHA.secret) {
      console.error('[auth-guard] CAPTCHA_ENABLED=true mais CAPTCHA_SECRET_KEY absent');
      return json({ error: { code: 'CONFIG_ERROR', message: 'Service indisponible.' } }, 503, cors);
    }
    const failures = Math.max(await countFailures('ip', ipKey, action), await countFailures('email', emailKey, action));
    if (failures >= CAPTCHA.after) {
      if (!captchaToken) {
        return json(
          { error: { code: 'CAPTCHA_REQUIRED', message: 'Vérification anti-robot requise.' } },
          429,
          cors
        );
      }
      const ok = await verifyCaptchaToken(captchaToken, clientIp);
      if (!ok) {
        return json(
          { error: { code: 'CAPTCHA_INVALID', message: 'Échec de la vérification anti-robot.' } },
          400,
          cors
        );
      }
    }
  }

  // ── 3. Proxy GoTrue
  const gotrueUrl =
    action === 'signup'
      ? `${SUPABASE_URL}/auth/v1/signup`
      : `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

  let gotrueRes: Response;
  try {
    gotrueRes = await fetch(gotrueUrl, {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  } catch (e) {
    console.error('[auth-guard] gotrue fetch error', e);
    return json({ error: { code: 'AUTH_ERROR', message: 'Service indisponible.' } }, 502, cors);
  }

  const gotrueBody = await gotrueRes.json().catch(() => ({}));

  if (!gotrueRes.ok) {
    await recordFailure('ip', ipKey, action);
    await recordFailure('email', emailKey, action);
    const message =
      action === 'signin'
        ? 'Identifiants invalides.'
        : (gotrueBody as { msg?: string; message?: string; error_description?: string }).msg ??
          (gotrueBody as { message?: string }).message ??
          (gotrueBody as { error_description?: string }).error_description ??
          "Échec de l'inscription.";
    return json({ error: { code: action === 'signin' ? 'INVALID_CREDENTIALS' : 'SIGNUP_FAILED', message } }, gotrueRes.status, cors);
  }

  await clearFailures('ip', ipKey, action);
  await clearFailures('email', emailKey, action);

  return json({ data: gotrueBody }, 200, cors);
});
