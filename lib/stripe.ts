import Stripe from "stripe";

export type CreditPack = {
  id: string;
  credits: number;
  priceCents: number;
  label: string;
};

// Shown on the paywall in this order, cheapest first. The id is stored in
// the Stripe checkout session's metadata so the webhook knows exactly how
// many credits to grant without re-deriving it from the price paid.
export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack-1", credits: 1, priceCents: 799, label: "1 reading" },
  { id: "pack-3", credits: 3, priceCents: 1900, label: "3 readings" },
  { id: "pack-5", credits: 5, priceCents: 2700, label: "5 readings" },
];

export function getCreditPack(id: string | undefined | null): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY env var.");
  }
  return new Stripe(key);
}
