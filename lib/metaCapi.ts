import crypto from "crypto";
import { META_PIXEL_ID } from "@/lib/metaPixel";

const CURRENCY = "EUR";

function hashSha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// eventId must match the client-side trackPurchase() eventID (the Stripe
// checkout session id) so Meta dedupes this server-side event against the
// browser one instead of double-counting the sale. valueEuros/credits
// reflect whichever pack was actually bought (prices are set dynamically at
// checkout, not fixed).
export async function trackPurchaseServer(
  email: string,
  eventId: string,
  valueEuros: number,
  credits: number
) {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("trackPurchaseServer: META_CAPI_ACCESS_TOKEN not set, skipping");
    return;
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        user_data: {
          em: [hashSha256(email)],
        },
        custom_data: {
          value: valueEuros,
          currency: CURRENCY,
          content_ids: [`pattern-spotter-${credits}-pack`],
          content_name: `The Pattern Spotter — ${credits} Reading${credits === 1 ? "" : "s"}`,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("trackPurchaseServer: Meta CAPI error", res.status, text);
    }
  } catch (err) {
    console.error("trackPurchaseServer: request failed", err);
  }
}
