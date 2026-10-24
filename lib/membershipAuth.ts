import { createHmac, timingSafeEqual } from "crypto";

// Stateless membership access, bridging the WordPress membership site and
// this tool with no shared database and no login here. WordPress signs a
// short-lived link (email|name|exp, HMAC-SHA256, MEMBERSHIP_LINK_SECRET)
// when an active member clicks "Open Pattern Spotter" - that link is only
// checked once, at the moment it's opened, since 5 minutes is too tight a
// window to cover an entire reading (someone can easily spend longer than
// that thinking through the questions). Once that initial link verifies,
// this tool mints its own longer-lived session token (mintSessionToken),
// which is what actually travels with /api/hypotheses and /api/generate for
// the rest of that visit. Both tokens are HMAC-signed; nothing is ever
// trusted as a bare client-side flag.

const LINK_TTL_SECONDS = 5 * 60; // must match what WordPress issues
const SESSION_TTL_SECONDS = 2 * 60 * 60; // generous enough to cover a full, unhurried reading
const SESSION_PREFIX = "session"; // keeps the two token kinds from ever being interchangeable

function getSecret(): string | null {
  const secret = process.env.MEMBERSHIP_LINK_SECRET;
  return secret && secret.length > 0 ? secret : null;
}

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export interface MembershipLinkParams {
  email: string;
  name: string;
  exp: string;
  token: string;
}

/**
 * Verifies the link WordPress generates for an active member
 * (email|name|exp, signed with MEMBERSHIP_LINK_SECRET). Checked once, right
 * when the link is opened - see mintSessionToken for what covers the rest
 * of the visit.
 */
export function verifyMembershipLink({ email, name, exp, token }: MembershipLinkParams): boolean {
  const secret = getSecret();
  if (!secret || !email || !name || !exp || !token) return false;

  const expSeconds = Number(exp);
  if (!Number.isFinite(expSeconds)) return false;
  if (Math.floor(Date.now() / 1000) > expSeconds) return false;

  // Sanity bound so a link can't be (mis)issued with an absurdly long expiry
  // and quietly outlive its intended 5-minute window.
  if (expSeconds > Math.floor(Date.now() / 1000) + LINK_TTL_SECONDS + 60) return false;

  const expected = sign(secret, `${email}|${name}|${exp}`);
  return safeEqual(expected, token);
}

/**
 * Mints this tool's own session token after a membership link has already
 * verified once. Carries only the email (what /api/hypotheses and
 * /api/generate actually need to key off), a fresh expiry, and the
 * SESSION_PREFIX discriminator so it can never be confused with (or
 * replayed as) a WordPress link token.
 */
export function mintSessionToken(email: string): { token: string; exp: number } | null {
  const secret = getSecret();
  if (!secret) return null;

  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = sign(secret, `${SESSION_PREFIX}|${email}|${exp}`);
  return { token, exp };
}

/**
 * Verifies this tool's own session token (see mintSessionToken). This is
 * what /api/hypotheses and /api/generate actually check to decide whether
 * to skip the credits/payment gate for a member.
 */
export function verifySessionToken(email: string, exp: number | string, token: string): boolean {
  const secret = getSecret();
  if (!secret || !email || !exp || !token) return false;

  const expSeconds = Number(exp);
  if (!Number.isFinite(expSeconds)) return false;
  if (Math.floor(Date.now() / 1000) > expSeconds) return false;

  const expected = sign(secret, `${SESSION_PREFIX}|${email}|${expSeconds}`);
  return safeEqual(expected, token);
}
