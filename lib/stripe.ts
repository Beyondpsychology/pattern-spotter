import Stripe from "stripe";

export const READING_PACK_PRICE_CENTS = 2700; // €27
export const READING_PACK_CREDITS = 5;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY env var.");
  }
  return new Stripe(key);
}
