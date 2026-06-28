// Shared constants for auth, pricing and the demo exception.

export const APP_NAME = "Ooze";
export const APP_TAGLINE = "Find the money oozing out of your accounts.";

/**
 * The one free-forever number for testing. Logs in with a fixed OTP and is
 * always premium — it never hits the paywall. Every other number must pay.
 */
export const DEMO_PHONE = "9800000000";
export const DEMO_OTP = "9800";

/** Premium pricing (INR). Razorpay works in paise. */
export const PRICING = {
  monthly: { id: "monthly", label: "Monthly", amount: 179, sub: "cancel anytime" },
  yearly: { id: "yearly", label: "Yearly", amount: 1599, sub: "2 months free" },
  oneTime: { id: "oneTime", label: "Deep audit", amount: 99, sub: "one-time unlock" },
} as const;

export type PlanId = keyof typeof PRICING;

export const SESSION_COOKIE = "ooze_session";
export const SESSION_TTL_DAYS = 30;

/** Normalise an Indian mobile to 10 digits (strips +91 / 0 / spaces). */
export function normalisePhone(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : DEMO_PHONE === ten ? ten : null;
}

export function isDemoPhone(phone: string): boolean {
  return phone === DEMO_PHONE;
}
