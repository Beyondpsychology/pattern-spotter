import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Hit once a day by the Vercel Cron job in vercel.json. Supabase's free tier
// auto-pauses a project after 7 days with no API/database activity - a
// trivial read here is enough to count as activity and reset that clock,
// so the tool doesn't silently stop working for visitors between quiet
// periods. Not needed once the Supabase project is on a paid plan (those
// never auto-pause).
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("email_captures").select("id").limit(1);
    if (error) {
      console.error("keep-alive: query failed", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (err) {
    console.error("keep-alive: unhandled error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
