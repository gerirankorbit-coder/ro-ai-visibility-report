import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type EnvLike = Record<string, string | undefined>;

/**
 * Server-only Supabase client using the service role key. This key never reaches the browser;
 * the database itself denies the anon/authenticated roles everything (see migrations).
 */
export function serverDb(env: EnvLike): SupabaseClient | null {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
