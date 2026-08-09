import { NextRequest, NextResponse } from "next/server";
import { getStripe, getCreditPack } from "@/lib/stripe";
import { normalizeEmail } from "@/lib/supabaseAdmin";

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: normalizedEmail,
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
      metadata: { email: normalizedEmail, name, credits: String(pack.credits) },
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
