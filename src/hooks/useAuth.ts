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

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { data: null, error: { ...error, message: translateAuthError(error) } };
    }

    return { data, error: null };
  };

  const signIn = async (email: string, password: string) => {
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
