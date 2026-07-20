// Single on/off switch for the whole paid-credits system. While false, every
// route behaves exactly as the original free one-reading-per-email tool
// (has_completed-gated). Flip PAYMENTS_ENABLED=true in Vercel's environment
// variables and redeploy when ready to require payment — no code change
// needed to go live.
export const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === "true";

export function checkTesterCoupon(code: string | undefined | null): boolean {
  const secret = process.env.TESTER_COUPON_CODE;
  if (!secret || !code) return false;
  return code.trim() === secret;
}
