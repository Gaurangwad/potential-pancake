import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Optional Supabase backend. When the service-role env vars are present, the
// store persists users + audit snapshots here instead of the local JSON file.
// Server-side only — the service-role key must never reach the client.

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function supabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}
