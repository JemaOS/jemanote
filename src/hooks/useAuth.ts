// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import { User, Session, AuthError } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

import { translate } from '@/i18n/translations';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error);
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const translateAuthError = (error: AuthError): string => {
    const errorMessage = error.message.toLowerCase();

    // Messages d'erreur Supabase traduits en français
    if (errorMessage.includes('invalid login credentials')) {
      return translate('authInvalidCredentials');
    }
    if (errorMessage.includes('email not confirmed')) {
      return translate('authEmailNotConfirmed');
    }
    if (errorMessage.includes('user not found')) {
      return translate('authUserNotFound');
    }
    if (
      errorMessage.includes('email already registered') ||
      errorMessage.includes('user already registered')
    ) {
      return translate('authEmailAlreadyRegistered');
    }
    if (errorMessage.includes('password')) {
      return translate('authPasswordTooShort');
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return translate('authNetworkError');
    }
    if (errorMessage.includes('rate limit')) {
      return translate('authRateLimit');
    }
    if (errorMessage.includes('invalid email')) {
      return translate('authInvalidEmail');
    }

    // Message générique par défaut
    return translate('authGenericError');
  };

  const ENV = import.meta.env as Record<string, string | undefined>;
  // Proxy d'authentification anti-robot (edge function `auth-guard`).
  const AUTH_GUARD_ENABLED = ENV.VITE_AUTH_GUARD_ENABLED === 'true';

  /** Extrait l'erreur structurée d'un appel d'edge function. */
  const extractGuardError = async (
    error: unknown,
    data: unknown
  ): Promise<{ code: string; message: string } | null> => {
    const d = data as { error?: { code?: string; message?: string } } | null;
    if (d?.error && (d.error.code || d.error.message)) {
      return { code: d.error.code ?? '', message: d.error.message ?? '' };
    }
    if (!error) return null;
    const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const parsed = (await ctx.json()) as { error?: { code?: string; message?: string } };
        if (parsed?.error && (parsed.error.code || parsed.error.message)) {
          return { code: parsed.error.code ?? '', message: parsed.error.message ?? '' };
        }
      } catch {
        /* body non JSON */
      }
    }
    return { code: 'UNKNOWN', message: (error as Error).message ?? '' };
  };

  /** Traduit une erreur renvoyée par `auth-guard`. */
  const mapGuardError = (code: string, rawMessage: string) => {
    if (code === 'CAPTCHA_REQUIRED' || code === 'CAPTCHA_INVALID') {
      return { message: rawMessage || 'Vérification anti-robot requise.', captchaRequired: true, code };
    }
    if (code === 'RATE_LIMITED') return { message: rawMessage || translate('authRateLimit') };
    if (code === 'INVALID_CREDENTIALS') return { message: translate('authInvalidCredentials') };
    if (code === 'VALIDATION_ERROR') {
      const m = rawMessage.toLowerCase();
      if (m.includes('email')) return { message: translate('authInvalidEmail') };
      if (m.includes('password')) return { message: translate('authPasswordTooShort') };
      return { message: rawMessage };
    }
    if (code === 'SIGNUP_FAILED') {
      const m = rawMessage.toLowerCase();
      if (m.includes('already') || m.includes('registered') || m.includes('exists')) {
        return { message: translate('authEmailAlreadyRegistered') };
      }
      if (m.includes('password')) return { message: translate('authPasswordTooShort') };
      return { message: translate('authGenericError') };
    }
    return { message: rawMessage || translate('authGenericError') };
  };

  const callGuard = async (
    action: 'signin' | 'signup',
    email: string,
    password: string,
    captchaToken?: string
  ): Promise<{ error?: { message: string; captchaRequired?: boolean; code?: string }; gotrue?: any }> => {
    const { data, error } = await supabase.functions.invoke('auth-guard', {
      body: { action, email, password, ...(captchaToken ? { captchaToken } : {}) },
    });
    const guardError = await extractGuardError(error, data);
    if (guardError) {
      return { error: mapGuardError(guardError.code, guardError.message) };
    }
    return { gotrue: (data as { data?: unknown })?.data ?? data };
  };

  const signUp = async (email: string, password: string, captchaToken?: string) => {
    if (AUTH_GUARD_ENABLED) {
      try {
        const res = await callGuard('signup', email, password, captchaToken);
        if (res.error) return { data: null, error: res.error };
        const gotrue = res.gotrue as { access_token?: string; refresh_token?: string } | null;
        if (gotrue?.access_token && gotrue?.refresh_token) {
          await supabase.auth.setSession({
            access_token: gotrue.access_token,
            refresh_token: gotrue.refresh_token,
          });
        }
        return { data: res.gotrue, error: null };
      } catch {
        return { data: null, error: { message: translate('authNetworkError') } };
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { data: null, error: { ...error, message: translateAuthError(error) } };
    }

    return { data, error: null };
  };

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    if (AUTH_GUARD_ENABLED) {
      try {
        const res = await callGuard('signin', email, password, captchaToken);
        if (res.error) return { data: null, error: res.error };
        const gotrue = res.gotrue as { access_token?: string; refresh_token?: string; user?: unknown } | null;
        if (gotrue?.access_token && gotrue?.refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: gotrue.access_token,
            refresh_token: gotrue.refresh_token,
          });
          if (setErr) return { data: null, error: { message: translateAuthError(setErr) } };
          return { data: { user: gotrue.user, session: null }, error: null };
        }
        return { data: null, error: { message: translate('authInvalidCredentials') } };
      } catch {
        return { data: null, error: { message: translate('authNetworkError') } };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error: { ...error, message: translateAuthError(error) } };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
