import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin, normalizeEmail } from "@/lib/supabaseAdmin";
import { trackPurchaseServer } from "@/lib/metaCapi";
import { notifyNewSale } from "@/lib/activeCampaign";

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

      // credits comes from the checkout session's own metadata (set at
      // creation time in /api/create-checkout-session) rather than being
      // re-derived from the price paid, so it always reflects exactly which
      // pack was bought.
      const packCredits = Number(session.metadata?.credits);
      if (!Number.isInteger(packCredits) || packCredits <= 0) {
        console.error(
          "stripe-webhook: checkout.session.completed with invalid credits metadata",
          session.id
        );
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

      const newCredits = (existing?.credits_remaining ?? 0) + packCredits;

      const { error: upsertError } = await supabase.from("email_captures").upsert(
        { email, credits_remaining: newCredits },
        { onConflict: "email" }
      );

      if (upsertError) {
        console.error("stripe-webhook: upsert error", upsertError);
        return NextResponse.json({ error: "database_error" }, { status: 500 });
      }

      const amountEuros = (session.amount_total ?? 0) / 100;

      // event_id = the checkout session id, shared with the client-side
      // trackPurchase() call on the success redirect, so Meta dedupes the
      // two instead of double-counting the sale.
      await trackPurchaseServer(email, session.id, amountEuros, packCredits);
      await notifyNewSale(email, packCredits, amountEuros);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("stripe-webhook: unhandled error", err);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
