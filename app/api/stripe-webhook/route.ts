import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, READING_PACK_CREDITS } from "@/lib/stripe";
import { getSupabaseAdmin, normalizeEmail } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("stripe-webhook: missing signature or webhook secret");
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("stripe-webhook: signature verification failed", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const emailRaw =
        session.metadata?.email || session.customer_details?.email || session.customer_email;

      if (!emailRaw) {
        console.error("stripe-webhook: checkout.session.completed with no email", session.id);
        return NextResponse.json({ received: true });
      }

      const email = normalizeEmail(emailRaw);
      const supabase = getSupabaseAdmin();

      const { data: existing, error: selectError } = await supabase
        .from("email_captures")
        .select("credits_remaining")
        .eq("email", email)
        .maybeSingle();

      if (selectError) {
        console.error("stripe-webhook: select error", selectError);
        return NextResponse.json({ error: "database_error" }, { status: 500 });
      }

      const newCredits = (existing?.credits_remaining ?? 0) + READING_PACK_CREDITS;

      const { error: upsertError } = await supabase.from("email_captures").upsert(
        { email, credits_remaining: newCredits },
        { onConflict: "email" }
      );

      if (upsertError) {
        console.error("stripe-webhook: upsert error", upsertError);
        return NextResponse.json({ error: "database_error" }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("stripe-webhook: unhandled error", err);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
