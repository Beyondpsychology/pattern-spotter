const TRAFFIC_SOURCE_KEY = "ps_traffic_source";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

export type TrafficSource = Record<string, string>;

/**
 * Captures where this visitor came from (UTM params, referrer, landing URL)
 * into sessionStorage, once per session - called on /tool's first mount.
 * Never overwrites an existing value, so a UTM captured on arrival survives
 * any in-site navigation before checkout. Never throws: sessionStorage can
 * be unavailable (private browsing, blocked), and this should never block
 * someone from using the tool.
 */
export function captureTrafficSource() {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(TRAFFIC_SOURCE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const data: TrafficSource = {};

    for (const key of UTM_PARAMS) {
      const value = params.get(key);
      if (value) data[key] = value;
    }
    if (document.referrer) data.referrer = document.referrer;
    data.landing_url = window.location.href;

    window.sessionStorage.setItem(TRAFFIC_SOURCE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
}

export function loadTrafficSource(): TrafficSource | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(TRAFFIC_SOURCE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
