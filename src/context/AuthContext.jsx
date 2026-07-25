import { createContext, useContext, useEffect, useState } from 'react';
import { configured, supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(configured);

  useEffect(function () {
    if (!configured) return undefined;
    let active = true;

    async function bootstrap() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      await refreshAdminStatus(data.session);
      if (active) setLoading(false);
    }

    async function refreshAdminStatus(sess) {
      if (!sess) {
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase.from('salon_admins').select('user_id').eq('user_id', sess.user.id).maybeSingle();
      if (!active) return;
      setIsAdmin(!error && Boolean(data));
    }

    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange(function (_event, sess) {
      setSession(sess);
      refreshAdminStatus(sess);
    });

    return function () {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function claimAdmin() {
    const { data, error } = await supabase.rpc('salon_bootstrap_admin');
    if (error) throw error;
    setIsAdmin(Boolean(data));
    return Boolean(data);
  }

  const value = { session, isAdmin, loading, signIn, signUp, signOut, claimAdmin };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}
