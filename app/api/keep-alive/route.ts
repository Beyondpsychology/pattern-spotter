import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Hit daily by both the Vercel Cron job in vercel.json and a separate
// GitHub Actions workflow (.github/workflows/keep-alive.yml), 12 hours
// apart - two independent schedulers so one having an off day doesn't
// leave Supabase un-pinged. Supabase's free tier auto-pauses a project
// after 7 days with no API/database activity; a trivial read here is
// enough to count as activity and reset that clock. A few retries absorb
// the kind of transient network blip that would otherwise burn through a
// whole day's only attempt. Not needed once the Supabase project is on a
// paid plan (those never auto-pause).
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      const { error } = await supabase.from("email_captures").select("id").limit(1);
      if (!error) {
        console.log("keep-alive: ok", new Date().toISOString(), `attempt ${attempt}`);
        return NextResponse.json({ ok: true, at: new Date().toISOString(), attempt });
      }
      lastError = error;
      console.error(`keep-alive: attempt ${attempt} failed`, error);
      if (attempt < RETRY_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }

    console.error("keep-alive: all attempts failed", lastError);
    return NextResponse.json({ ok: false }, { status: 500 });
  } catch (err) {
    console.error("keep-alive: unhandled error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
