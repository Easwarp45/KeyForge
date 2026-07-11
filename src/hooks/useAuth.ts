import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabaseClient } from '../api';

/**
 * useAuth — Centralised authentication state hook
 *
 * WHY: Auth state was previously handled ad-hoc inside each component that
 * needed it (Layout.tsx, TopBar.tsx), leading to duplicated `getSession()`
 * calls and inconsistent state. This hook provides a single source of truth
 * for auth state that can be composed into any component.
 *
 * BEHAVIOUR:
 * - Subscribes to Supabase auth state changes so the UI reacts instantly to
 *   sign-in, sign-out, and token refresh events without polling.
 * - In dev mode (no Supabase configured), returns loading=false immediately.
 */

export interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dev/demo mode — no Supabase client, skip auth
    if (!supabaseClient) {
      setLoading(false);
      return;
    }

    // Resolve the current session synchronously on mount
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
