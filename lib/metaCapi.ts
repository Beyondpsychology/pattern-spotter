import crypto from "crypto";
import { META_PIXEL_ID } from "@/lib/metaPixel";

const READING_PACK_VALUE = 27;
const CURRENCY = "EUR";
const CONTENT_ID = "pattern-spotter-5-pack";
const CONTENT_NAME = "The Pattern Spotter — 5 Readings";

function hashSha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// eventId must match the client-side trackPurchase() eventID (the Stripe
// checkout session id) so Meta dedupes this server-side event against the
// browser one instead of double-counting the sale.
export async function trackPurchaseServer(email: string, eventId: string) {
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
          value: READING_PACK_VALUE,
          currency: CURRENCY,
          content_ids: [CONTENT_ID],
          content_name: CONTENT_NAME,
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
