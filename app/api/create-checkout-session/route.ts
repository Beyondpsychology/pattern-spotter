import { NextRequest, NextResponse } from "next/server";
import { getStripe, getCreditPack } from "@/lib/stripe";
import { normalizeEmail } from "@/lib/supabaseAdmin";

const TRAFFIC_METADATA_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "referrer",
  "landing_url",
];
const STRIPE_METADATA_VALUE_LIMIT = 500;

function buildTrafficMetadata(trafficSource: unknown): Record<string, string> {
  if (!trafficSource || typeof trafficSource !== "object") return {};
  const source = trafficSource as Record<string, unknown>;
  const metadata: Record<string, string> = {};
  for (const field of TRAFFIC_METADATA_FIELDS) {
    const value = source[field];
    if (typeof value === "string" && value.trim()) {
      metadata[field] = value.slice(0, STRIPE_METADATA_VALUE_LIMIT);
    }
  }
  return metadata;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const packId = typeof body?.packId === "string" ? body.packId : "";

    if (!email.trim()) {
      return NextResponse.json({ error: "missing_email" }, { status: 400 });
    }

    const pack = getCreditPack(packId);
    if (!pack) {
      return NextResponse.json({ error: "invalid_pack" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const origin = req.nextUrl.origin;
    const stripe = getStripe();
    const trafficMetadata = buildTrafficMetadata(body?.trafficSource);
    const hasTrafficMetadata = Object.keys(trafficMetadata).length > 0;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: normalizedEmail,
      // Stripe defaults payment-mode sessions to "if_required" (no Customer
      // object unless something else needs one), so buyers wouldn't show up
      // in the Customers list otherwise - "always" makes every purchase
      // create/reuse a proper Customer record.
      customer_creation: "always",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: pack.priceCents,
            product_data: {
              name: `The Pattern Spotter — ${pack.label}`,
              description: `${pack.credits} use${pack.credits === 1 ? "" : "s"} of the Pattern Spotter reading tool`,
            },
          },
          quantity: 1,
        },
      ],
      // credits in metadata is what the webhook trusts to grant credits -
      // it never re-derives the pack from price, so pricing can change later
      // without breaking already-created sessions.
      metadata: { email: normalizedEmail, name, credits: String(pack.credits), ...trafficMetadata },
      // Checkout Session metadata doesn't automatically carry over to the
      // resulting Payment/Charge - payment_intent_data.metadata does, and
      // that's what's visible directly on the payment in the Stripe
      // dashboard without extra clicks, so traffic source goes there too.
      ...(hasTrafficMetadata ? { payment_intent_data: { metadata: trafficMetadata } } : {}),
      // credits/amount on the success redirect let the client-side Meta
      // Pixel Purchase event report the actual pack bought; session_id lets
      // it share an eventID with the server-side Conversions API Purchase
      // event (fired from this same checkout in the webhook), so Meta
      // dedupes them instead of double-counting the sale.
      success_url: `${origin}/tool?checkout=success&email=${encodeURIComponent(normalizedEmail)}&name=${encodeURIComponent(name)}&session_id={CHECKOUT_SESSION_ID}&credits=${pack.credits}&amount=${pack.priceCents}`,
      cancel_url: `${origin}/tool?checkout=cancelled&email=${encodeURIComponent(normalizedEmail)}&name=${encodeURIComponent(name)}`,
    });

    if (!session.url) {
      throw new Error("Stripe session created without a URL");
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error", err);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
