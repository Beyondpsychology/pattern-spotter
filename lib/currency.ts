// Approximate, fixed EUR-to-USD rate for display purposes only. Actual
// charging always happens in EUR through Stripe - this exists purely so a US
// visitor isn't left guessing what a euro price means for them. It doesn't
// need to track the live rate exactly, but update it occasionally if it
// drifts far off (check e.g. https://www.ecb.europa.eu/stats/policy_and_exchange_rates).
const APPROX_EUR_TO_USD = 1.08;

// Heuristic only, not a real geolocation check: a US browser locale is a
// reasonable enough signal for a "just for reference" price hint, and a
// wrong guess here has no real consequence since the actual charge is
// always in EUR regardless of what this shows.
export function isLikelyUsVisitor(): boolean {
  if (typeof navigator === "undefined") return false;
  try {
    const locale = navigator.language || navigator.languages?.[0] || "";
    return locale.toLowerCase() === "en-us";
  } catch {
    return false;
  }
}

export function formatApproxUsd(cents: number): string {
  const usd = (cents / 100) * APPROX_EUR_TO_USD;
  return `$${usd.toFixed(2)}`;
}
