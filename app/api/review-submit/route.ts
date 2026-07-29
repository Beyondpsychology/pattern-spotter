import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, normalizeEmail } from "@/lib/supabaseAdmin";
import { notifyNewReview } from "@/lib/activeCampaign";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const reviewText = typeof body?.reviewText === "string" ? body.reviewText.trim() : "";
  const rating = Number(body?.rating);

  if (!email || !reviewText || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("reviews").insert({
    name: name || null,
    email: normalizeEmail(email),
    rating,
    review_text: reviewText,
  });

  if (error) {
    console.error("review-submit: insert error", error);
    return NextResponse.json({ error: "database_error" }, { status: 500 });
  }

  await notifyNewReview(name, normalizeEmail(email), rating, reviewText);

  return NextResponse.json({ status: "ok" });
}
