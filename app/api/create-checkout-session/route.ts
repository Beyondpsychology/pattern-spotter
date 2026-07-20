import { NextRequest, NextResponse } from "next/server";
import { getStripe, READING_PACK_PRICE_CENTS } from "@/lib/stripe";
import { normalizeEmail } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email.trim()) {
      return NextResponse.json({ error: "missing_email" }, { status: 400 });
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
            unit_amount: READING_PACK_PRICE_CENTS,
            product_data: {
              name: "The Pattern Spotter — 5 Readings",
              description: "5 uses of the Pattern Spotter reading tool",
            },
          },
          quantity: 1,
        },
      ],
      metadata: { email: normalizedEmail, name },
      success_url: `${origin}/tool?checkout=success&email=${encodeURIComponent(normalizedEmail)}&name=${encodeURIComponent(name)}`,
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
