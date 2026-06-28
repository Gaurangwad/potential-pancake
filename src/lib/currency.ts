// Multi-currency handling. Indian card/bank statements usually post the INR
// amount for an international charge, but the narration also carries the
// foreign currency + amount (e.g. "USD 19.99", "POS INTL ... EUR 9,99"). We
// detect that, keep the INR figure as authoritative, and expose the original
// currency so the UI can show "$19.99 → ₹1,665" and total international spend.
//
// Rates are approximate and config-overridable; for live rates, set
// FX_RATES_JSON (a JSON map to INR) or wire an FX API in ratesToINR().

const DEFAULT_RATES: Record<string, number> = {
  USD: 86, EUR: 93, GBP: 109, AED: 23.4, SGD: 64,
  AUD: 56, CAD: 62, JPY: 0.55, CHF: 97, SAR: 23,
};

export function ratesToINR(): Record<string, number> {
  const raw = process.env.FX_RATES_JSON;
  if (raw) {
    try {
      return { ...DEFAULT_RATES, ...(JSON.parse(raw) as Record<string, number>) };
    } catch {
      /* fall through to defaults */
    }
  }
  return DEFAULT_RATES;
}

const SYMBOL_TO_CODE: Record<string, string> = { "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY" };

export interface FxHit {
  currency: string;
  amount: number;
}

// "USD 19.99" / "USD19.99" / "19.99 USD" / "€9,99" / "$ 12.00"
const CODE_RE = /\b(USD|EUR|GBP|AED|SGD|AUD|CAD|JPY|CHF|SAR)\b\s*([\d.,]+)|([\d.,]+)\s*\b(USD|EUR|GBP|AED|SGD|AUD|CAD|JPY|CHF|SAR)\b/i;
const SYMBOL_RE = /([$€£¥])\s?([\d][\d.,]*)/;

function num(s: string): number {
  // Foreign formats vary (1,234.56 or 1.234,56). Strip thousands, keep decimal.
  const cleaned = s.replace(/,(?=\d{3}\b)/g, "").replace(/,(\d{1,2})$/, ".$1").replace(/,/g, "");
  return parseFloat(cleaned);
}

/** Detect a foreign-currency amount inside a narration, if any. */
export function detectFx(narration: string): FxHit | null {
  const intl = /\b(intl|international|foreign|forex|markup|fcy)\b/i.test(narration);

  const m = CODE_RE.exec(narration);
  if (m) {
    const currency = (m[1] || m[4] || "").toUpperCase();
    const amount = num(m[2] || m[3] || "");
    if (currency && amount > 0) return { currency, amount };
  }

  // Symbols are ambiguous (₹ uses none of these), so require an intl marker.
  if (intl) {
    const s = SYMBOL_RE.exec(narration);
    if (s) {
      const currency = SYMBOL_TO_CODE[s[1]];
      const amount = num(s[2]);
      if (currency && amount > 0) return { currency, amount };
    }
  }
  return null;
}

/** Convert a foreign amount to INR using the current rate table. */
export function toINR(fx: FxHit): number {
  const rate = ratesToINR()[fx.currency] ?? 1;
  return Math.round(fx.amount * rate);
}

export function fxLabel(fx: FxHit): string {
  const sym: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
  const prefix = sym[fx.currency] ?? fx.currency + " ";
  return `${prefix}${fx.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
