// In-memory per-IP rate limiter. Resets on server restart/redeploy — that's
// fine, this exists only as a safety net against a single source hammering
// the free tool, not as the primary abuse defense (has_completed is).
const requestLog = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 20;

export function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestLog.get(ip);

  if (!entry || now > entry.resetAt) {
    requestLog.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
