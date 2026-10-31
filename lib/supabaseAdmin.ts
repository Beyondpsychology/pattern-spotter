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
    // Next.js's App Router caches fetch() by default, including calls made
    // deep inside a library like this client's own fetch - without this,
    // every query here risks silently serving a stale cached response
    // instead of actually reaching Supabase. Confirmed this was masking a
    // real problem for the keep-alive route specifically (see its own
    // comment), but it's wrong for every query in this app, not just that
    // one - every route here wants live data (credits, has_completed, etc).
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
