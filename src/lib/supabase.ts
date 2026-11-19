import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseConfig, SupabaseConnectionStatus } from '../types/database';

const STORAGE_URL_KEY = 'ada_supabase_project_url';
const STORAGE_KEY_KEY = 'ada_supabase_publishable_key';

export function isServiceRoleOrSecretKey(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('sb_secret_')) return true;
  // Check JWT payload if classic service_role JWT
  const parts = trimmed.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload?.role === 'service_role') {
        return true;
      }
    } catch {
      // Non-JWT publishable keys (sb_publishable_...) are valid
    }
  }
  return false;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
  const envKey =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
    '';

  try {
    const savedUrl = localStorage.getItem(STORAGE_URL_KEY)?.trim() || '';
    const savedKey = localStorage.getItem(STORAGE_KEY_KEY)?.trim() || '';
    return {
      url: savedUrl || envUrl,
      publishableKey: savedKey || envKey,
    };
  } catch {
    return { url: envUrl, publishableKey: envKey };
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_URL_KEY, config.url.trim().replace(/\/+$/, ''));
  localStorage.setItem(STORAGE_KEY_KEY, config.publishableKey.trim());
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_KEY_KEY);
}

export function createDynamicSupabaseClient(config: SupabaseConfig): SupabaseClient | null {
  const cleanUrl = config.url.trim().replace(/\/+$/, '');
  const cleanKey = config.publishableKey.trim();
  if (!cleanUrl || !cleanKey) return null;
  try {
    new URL(cleanUrl);
  } catch {
    return null;
  }
  if (isServiceRoleOrSecretKey(cleanKey)) {
    return null;
  }
  return createClient(cleanUrl, cleanKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export interface ConnectionValidationResult {
  status: SupabaseConnectionStatus;
  client: SupabaseClient | null;
  message: string;
  schemaMissing?: boolean;
}

export async function validateSupabaseConnection(
  config: SupabaseConfig
): Promise<ConnectionValidationResult> {
  const url = config.url.trim().replace(/\/+$/, '');
  const key = config.publishableKey.trim();

  if (!url || !key) {
    return {
      status: 'Not Connected',
      client: null,
      message: 'Enter both Supabase Project URL and Supabase Publishable Key.',
    };
  }

  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('http')) {
      throw new Error('Invalid URL protocol');
    }
  } catch {
    return {
      status: 'Connection Error',
      client: null,
      message: 'Invalid Supabase Project URL format (expected https://your-project.supabase.co).',
    };
  }

  if (isServiceRoleOrSecretKey(key)) {
    return {
      status: 'Connection Error',
      client: null,
      message:
        'Security Violation Blocked: Never use a service_role or secret key in the frontend. Use your Supabase Publishable / Anon Key only.',
    };
  }

  const client = createDynamicSupabaseClient({ url, publishableKey: key });
  if (!client) {
    return {
      status: 'Connection Error',
      client: null,
      message: 'Unable to initialize Supabase client with the provided configuration.',
    };
  }

  try {
    // 1. Validate Auth endpoint reachability + API key validity via fetch to /auth/v1/settings
    const authCheck = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (authCheck.status === 401 || authCheck.status === 403) {
      return {
        status: 'Connection Error',
        client: null,
        message: 'Authentication failed: Invalid Supabase Publishable Key for this project.',
      };
    }

    if (!authCheck.ok) {
      return {
        status: 'Connection Error',
        client: null,
        message: `Supabase returned HTTP ${authCheck.status}. Verify your Project URL and Publishable Key.`,
      };
    }

    // 2. Check database tables readiness
    const { error: dbError } = await client
      .from('properties')
      .select('id', { count: 'exact', head: true });

    if (dbError) {
      const missingTable =
        dbError.code === '42P01' ||
        dbError.code === 'PGRST205' ||
        dbError.message.toLowerCase().includes('does not exist') ||
        dbError.message.toLowerCase().includes('could not find the table');

      if (missingTable) {
        return {
          status: 'Connected',
          client,
          schemaMissing: true,
          message:
            'Connected to Supabase Project, but database tables are not created yet. Run supabase/schema.sql in your SQL Editor.',
        };
      }

      return {
        status: 'Connection Error',
        client: null,
        message: dbError.message || 'Database connection error.',
      };
    }

    return {
      status: 'Connected',
      client,
      schemaMissing: false,
      message: 'Successfully connected and verified with Supabase database and authentication.',
    };
  } catch (err) {
    return {
      status: 'Connection Error',
      client: null,
      message:
        err instanceof Error
          ? `Network or CORS error connecting to Supabase: ${err.message}`
          : 'Unable to reach Supabase project.',
    };
  }
}
