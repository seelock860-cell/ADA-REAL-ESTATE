import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Profile, SupabaseConfig, SupabaseConnectionStatus } from '../types/database';
import {
  clearSupabaseConfig,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  validateSupabaseConnection,
} from '../lib/supabase';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface SupabaseContextValue {
  supabase: SupabaseClient | null;
  config: SupabaseConfig;
  connectionStatus: SupabaseConnectionStatus;
  connectionMessage: string;
  schemaMissing: boolean;
  isValidatingConnection: boolean;
  connectToSupabase: (url: string, publishableKey: string) => Promise<{ ok: boolean; message: string }>;
  disconnectSupabase: () => void;
  recheckConnection: () => Promise<void>;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  authLoading: boolean;
  signInAdmin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], title: string, description?: string) => void;
  dismissToast: (id: string) => void;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SupabaseConfig>(() => getStoredSupabaseConfig());
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<SupabaseConnectionStatus>('Not Connected');
  const [connectionMessage, setConnectionMessage] = useState<string>(
    'Configure your Supabase Project URL and Publishable Key to connect.'
  );
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [isValidatingConnection, setIsValidatingConnection] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4800);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadProfile = useCallback(async (client: SupabaseClient, authUser: User | null) => {
    if (!authUser) {
      setProfile(null);
      return null;
    }
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        setProfile(null);
        return null;
      }
      setProfile(data as Profile | null);
      return data as Profile | null;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  const runValidation = useCallback(async (targetConfig: SupabaseConfig) => {
    if (!targetConfig.url || !targetConfig.publishableKey) {
      setSupabase(null);
      setConnectionStatus('Not Connected');
      setConnectionMessage('Supabase Project URL and Publishable Key are not configured yet.');
      setSchemaMissing(false);
      setAuthLoading(false);
      return { ok: false, message: 'Not configured' };
    }

    setIsValidatingConnection(true);
    const result = await validateSupabaseConnection(targetConfig);
    setConnectionStatus(result.status);
    setConnectionMessage(result.message);
    setSchemaMissing(Boolean(result.schemaMissing));
    setSupabase(result.client);
    setIsValidatingConnection(false);

    return {
      ok: result.status === 'Connected',
      message: result.message,
    };
  }, []);

  useEffect(() => {
    void runValidation(config);
  }, []); // Run initial validation once on mount

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setProfile(null);
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    setAuthLoading(true);

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      await loadProfile(supabase, sessionUser);
      if (mounted) setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      await loadProfile(supabase, sessionUser);
      if (mounted) setAuthLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const connectToSupabase = useCallback(
    async (url: string, publishableKey: string) => {
      const nextConfig: SupabaseConfig = {
        url: url.trim().replace(/\/+$/, ''),
        publishableKey: publishableKey.trim(),
      };
      const outcome = await runValidation(nextConfig);
      if (outcome.ok) {
        saveSupabaseConfig(nextConfig);
        setConfig(nextConfig);
        showToast('success', 'Supabase Connected', outcome.message);
      } else {
        showToast('error', 'Connection Failed', outcome.message);
      }
      return outcome;
    },
    [runValidation, showToast]
  );

  const disconnectSupabase = useCallback(() => {
    clearSupabaseConfig();
    setConfig({ url: '', publishableKey: '' });
    setSupabase(null);
    setUser(null);
    setProfile(null);
    setSchemaMissing(false);
    setConnectionStatus('Not Connected');
    setConnectionMessage('Disconnected from Supabase.');
    showToast('info', 'Supabase Disconnected', 'Connection credentials cleared from this browser.');
  }, [showToast]);

  const recheckConnection = useCallback(async () => {
    await runValidation(config);
  }, [config, runValidation]);

  const signInAdmin = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return {
          ok: false,
          error: 'Supabase is not connected yet. Configure Supabase Project URL and Publishable Key first.',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        return { ok: false, error: error?.message || 'Invalid email or password.' };
      }

      const loadedProfile = await loadProfile(supabase, data.user);
      if (!loadedProfile || loadedProfile.role !== 'admin') {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        return {
          ok: false,
          error:
            'Access denied. Your account does not have administrator privileges in public.profiles (role = admin).',
        };
      }

      showToast('success', 'Welcome Back', 'Signed in to ADA REAL ESTATE Admin Portal.');
      return { ok: true };
    },
    [supabase, loadProfile, showToast]
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    showToast('info', 'Signed Out', 'You have been signed out of the administrator portal.');
  }, [supabase, showToast]);

  const isAdmin = Boolean(user && profile?.role === 'admin');

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        config,
        connectionStatus,
        connectionMessage,
        schemaMissing,
        isValidatingConnection,
        connectToSupabase,
        disconnectSupabase,
        recheckConnection,
        user,
        profile,
        isAdmin,
        authLoading,
        signInAdmin,
        signOut,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error('useSupabase must be used inside a SupabaseProvider');
  }
  return ctx;
}
