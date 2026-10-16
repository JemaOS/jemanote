-- =====================================================================
-- Anti-robot / anti-flood : rate limiting + suivi des échecs d'auth
-- Utilisé par l'edge function `auth-guard` (connexion / inscription).
-- =====================================================================
-- Stockage côté DB (les edge functions Deno sont stateless / multi-instances).
-- Les IPs sont hachées (SHA-256) avant stockage (RGPD).
-- =====================================================================

-- ─── Rate limiting brut (fenêtre glissante) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
    id BIGSERIAL PRIMARY KEY,
    key_type TEXT NOT NULL CHECK (key_type IN ('ip', 'email')),
    key_value TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('signup', 'signin')),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_lookup
    ON public.auth_rate_limits (key_type, key_value, action, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_attempted_at
    ON public.auth_rate_limits (attempted_at);

CREATE OR REPLACE FUNCTION public.check_and_record_rate_limit(
    p_key_type TEXT,
    p_key_value TEXT,
    p_action TEXT,
    p_max_attempts INT,
    p_window_seconds INT
)
RETURNS TABLE(allowed BOOLEAN, current_count INT, retry_after_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
    v_oldest TIMESTAMPTZ;
    v_window_start TIMESTAMPTZ;
BEGIN
    v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;

    SELECT COUNT(*), MIN(attempted_at)
    INTO v_count, v_oldest
    FROM public.auth_rate_limits
    WHERE key_type = p_key_type
      AND key_value = p_key_value
      AND action = p_action
      AND attempted_at > v_window_start;

    IF v_count >= p_max_attempts THEN
        RETURN QUERY SELECT
            FALSE,
            v_count,
            GREATEST(1, EXTRACT(EPOCH FROM (v_oldest + (p_window_seconds || ' seconds')::INTERVAL - NOW()))::INT);
        RETURN;
    END IF;

    INSERT INTO public.auth_rate_limits (key_type, key_value, action)
    VALUES (p_key_type, p_key_value, p_action);

    RETURN QUERY SELECT TRUE, v_count + 1, 0;
END;
$$;

-- ─── Échecs d'authentification (déclencheur du CAPTCHA) ───────────────
CREATE TABLE IF NOT EXISTS public.auth_login_failures (
    id BIGSERIAL PRIMARY KEY,
    key_type TEXT NOT NULL CHECK (key_type IN ('ip', 'email')),
    key_value TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('signup', 'signin')),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_login_failures_lookup
    ON public.auth_login_failures (key_type, key_value, action, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_login_failures_attempted_at
    ON public.auth_login_failures (attempted_at);

CREATE OR REPLACE FUNCTION public.record_auth_failure(
    p_key_type TEXT,
    p_key_value TEXT,
    p_action TEXT
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO public.auth_login_failures (key_type, key_value, action)
    VALUES (p_key_type, p_key_value, p_action);
$$;

CREATE OR REPLACE FUNCTION public.count_auth_failures(
    p_key_type TEXT,
    p_key_value TEXT,
    p_action TEXT,
    p_window_seconds INT
)
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::INT
    FROM public.auth_login_failures
    WHERE key_type = p_key_type
      AND key_value = p_key_value
      AND action = p_action
      AND attempted_at > NOW() - (p_window_seconds || ' seconds')::INTERVAL;
$$;

CREATE OR REPLACE FUNCTION public.clear_auth_failures(
    p_key_type TEXT,
    p_key_value TEXT,
    p_action TEXT
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    DELETE FROM public.auth_login_failures
    WHERE key_type = p_key_type
      AND key_value = p_key_value
      AND action = p_action;
$$;

-- ─── Purge (> 24h) ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.purge_auth_throttle()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INT;
BEGIN
    DELETE FROM public.auth_rate_limits WHERE attempted_at < NOW() - INTERVAL '24 hours';
    DELETE FROM public.auth_login_failures WHERE attempted_at < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

-- ─── RLS : service_role uniquement ────────────────────────────────────
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_login_failures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_rate_limits FROM anon, authenticated;
REVOKE ALL ON public.auth_login_failures FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.check_and_record_rate_limit(TEXT, TEXT, TEXT, INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_auth_failure(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.count_auth_failures(TEXT, TEXT, TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_auth_failures(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_auth_throttle() TO service_role;
