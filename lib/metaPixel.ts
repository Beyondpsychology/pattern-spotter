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

export function trackViewContent() {
  fbq("track", "ViewContent");
}

export function trackInitiateCheckout() {
  fbq("track", "InitiateCheckout", {
    value: 27,
    currency: "EUR",
    content_ids: ["pattern-spotter-5-pack"],
    content_name: "The Pattern Spotter — 5 Readings",
  });
}

// eventId should match the Stripe checkout session id so a later
// Conversions API Purchase event (fired server-side from the webhook,
// once that's wired in) can be deduplicated against this client-side one.
export function trackPurchase(eventId: string) {
  fbq(
    "track",
    "Purchase",
    {
      value: 27,
      currency: "EUR",
      content_ids: ["pattern-spotter-5-pack"],
      content_name: "The Pattern Spotter — 5 Readings",
    },
    { eventID: eventId }
  );
}
