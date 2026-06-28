import { ratesToINR as fallbackRates } from "../currency";

// Real-time FX rates → INR, fetched server-side and cached. Uses the free,
// key-less open.er-api.com (base INR) and inverts to get "1 FOREIGN = X INR".
// Falls back to the static table (currency.ts) on any failure or offline, so
// the audit never breaks.

const TTL_MS = 60 * 60 * 1000; // refresh hourly
// Default is the free, key-less open.er-api (base INR). For higher rate limits
// / intraday refresh, set FX_RATES_URL to any endpoint returning the same shape
// ({ rates: { USD: <per-INR>, ... } }) — e.g. a keyed provider URL.
const SOURCE = process.env.FX_RATES_URL || "https://open.er-api.com/v6/latest/INR";

export interface LiveRates {
  rates: Record<string, number>; // 1 unit of FOREIGN currency in INR
  asOf: string;
  live: boolean;
}

let cache: (LiveRates & { fetchedAt: number }) | null = null;

export async function getRatesToINR(): Promise<LiveRates> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) return cache;
  const fallback = fallbackRates();

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(SOURCE, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    const data = (await res.json()) as {
      result?: string;
      time_last_update_utc?: string;
      rates?: Record<string, number>;
    };

    if (data.result === "success" && data.rates) {
      const rates: Record<string, number> = { ...fallback };
      for (const cur of Object.keys(fallback)) {
        const perInr = data.rates[cur]; // how many FOREIGN per 1 INR
        if (perInr && perInr > 0) rates[cur] = Number((1 / perInr).toFixed(4));
      }
      cache = {
        rates,
        asOf: data.time_last_update_utc ?? new Date().toUTCString(),
        live: true,
        fetchedAt: Date.now(),
      };
      return cache;
    }
  } catch {
    /* fall through to fallback below */
  }

  cache = { rates: fallback, asOf: new Date().toUTCString(), live: false, fetchedAt: Date.now() };
  return cache;
}
