export const META_PIXEL_ID = "2288183028661395";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

function fbq(...args: any[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

type PackInfo = { credits: number; priceCents: number };

function contentDataFor(pack: PackInfo) {
  return {
    value: pack.priceCents / 100,
    currency: "EUR",
    content_ids: [`pattern-spotter-${pack.credits}-pack`],
    content_name: `The Pattern Spotter — ${pack.credits} Reading${pack.credits === 1 ? "" : "s"}`,
  };
}

export function trackViewContent() {
  fbq("track", "ViewContent");
}

export function trackInitiateCheckout(pack: PackInfo) {
  fbq("track", "InitiateCheckout", contentDataFor(pack));
}

// eventId should match the Stripe checkout session id so the server-side
// Conversions API Purchase event (fired from the webhook) can be
// deduplicated against this client-side one.
export function trackPurchase(eventId: string, pack: PackInfo) {
  fbq("track", "Purchase", contentDataFor(pack), { eventID: eventId });
}
