/*
Migration SQL — run this once in the Supabase SQL editor to add paid-credits
support (safe to run even before PAYMENTS_ENABLED is turned on).

ALTER TABLE email_captures ADD COLUMN IF NOT EXISTS credits_remaining integer not null default 0;
*/

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, normalizeEmail } from "@/lib/supabaseAdmin";
import { syncToActiveCampaign } from "@/lib/activeCampaign";
import { PAYMENTS_ENABLED, checkTesterCoupon } from "@/lib/payments";
import { READING_PACK_CREDITS } from "@/lib/stripe";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const code = typeof body?.code === "string" ? body.code : "";

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const normalized = normalizeEmail(email);
    const supabase = getSupabaseAdmin();

    // Runs alongside the DB lookup; syncToActiveCampaign never throws, so
    // this can't fail the request even if ActiveCampaign is unreachable.
    const [{ data: existing, error: selectError }] = await Promise.all([
      supabase
        .from("email_captures")
        .select("has_completed, reading, credits_remaining")
        .eq("email", normalized)
        .maybeSingle(),
      syncToActiveCampaign(normalized, name),
    ]);

    if (selectError) {
      console.error("email-capture select error", selectError);
      return NextResponse.json({ error: "database_error" }, { status: 500 });
    }

    if (!PAYMENTS_ENABLED) {
      if (existing) {
        return NextResponse.json({
          paymentsEnabled: false,
          status: existing.has_completed ? "already_completed" : "ok",
          reading: existing.has_completed ? existing.reading ?? null : null,
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

      return NextResponse.json({ paymentsEnabled: false, status: "ok" });
    }

    // Paid-credits mode: a valid tester coupon tops up credits as if a
    // purchase had just completed, regardless of how many credits remain.
    const grantingCoupon = checkTesterCoupon(code);
    let credits = existing?.credits_remaining ?? 0;

    if (grantingCoupon) {
      credits += READING_PACK_CREDITS;
      const { error: upsertError } = await supabase
        .from("email_captures")
        .upsert({ email: normalized, credits_remaining: credits }, { onConflict: "email" });

      if (upsertError) {
        console.error("email-capture coupon upsert error", upsertError);
        return NextResponse.json({ error: "database_error" }, { status: 500 });
      }
    } else if (!existing) {
      const { error: insertError } = await supabase
        .from("email_captures")
        .insert({ email: normalized, credits_remaining: 0 });

      if (insertError && insertError.code !== "23505") {
        console.error("email-capture insert error", insertError);
        return NextResponse.json({ error: "database_error" }, { status: 500 });
      }
    }

    return NextResponse.json({ paymentsEnabled: true, status: "ok", credits });
  } catch (err) {
    console.error("email-capture unhandled error", err);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
