import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, normalizeEmail } from "@/lib/supabaseAdmin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const normalized = normalizeEmail(email);
  const supabase = getSupabaseAdmin();

  const { data: existing, error: selectError } = await supabase
    .from("email_captures")
    .select("has_completed")
    .eq("email", normalized)
    .maybeSingle();

  if (selectError) {
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
    return NextResponse.json({ error: "database_error" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
