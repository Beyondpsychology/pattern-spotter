import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, normalizeEmail } from "@/lib/supabaseAdmin";
import { syncToActiveCampaign } from "@/lib/activeCampaign";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const normalized = normalizeEmail(email);
    const supabase = getSupabaseAdmin();

    // Runs alongside the DB lookup; syncToActiveCampaign never throws, so
    // this can't fail the request even if ActiveCampaign is unreachable.
    const [{ data: existing, error: selectError }] = await Promise.all([
      supabase.from("email_captures").select("has_completed").eq("email", normalized).maybeSingle(),
      syncToActiveCampaign(normalized, name),
    ]);

    if (selectError) {
      console.error("email-capture select error", selectError);
      return NextResponse.json({ error: "database_error" }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({
        status: existing.has_completed ? "already_completed" : "ok",
      });
    }

    const { error: insertError } = await supabase
      .from("email_captures")
      .insert({ email: normalized });

    // A unique-constraint race (two tabs submitting at once) means the row
    // already exists — that's fine, treat it the same as "ok".
    if (insertError && insertError.code !== "23505") {
      console.error("email-capture insert error", insertError);
      return NextResponse.json({ error: "database_error" }, { status: 500 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("email-capture unhandled error", err);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
