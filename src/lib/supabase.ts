import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient<Database> | null = supabaseConfigured
  ? createClient<Database>(url!, key!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export class NotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README).');
  }
}

export function sb(): SupabaseClient<Database> {
  if (!supabase) throw new NotConfiguredError();
  return supabase;
}

export const LOGO_BUCKET = 'logos';
