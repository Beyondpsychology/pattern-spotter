import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key. Never import this from
// client components — it bypasses row level security entirely, which is
// fine here because there is no per-user auth session to scope rows to.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
