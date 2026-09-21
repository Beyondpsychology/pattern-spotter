import Stripe from "stripe";

export type CreditPack = {
  id: string;
  credits: number;
  priceCents: number;
  label: string;
};

// Single pack, shown on the paywall. The id is stored in the Stripe checkout
// session's metadata so the webhook knows exactly how many credits to grant
// without re-deriving it from the price paid.
export const CREDIT_PACKS: CreditPack[] = [
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
