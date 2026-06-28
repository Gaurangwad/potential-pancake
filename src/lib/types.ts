// The contract shared between the parsing pipeline, the API and the UI.

export type TxnType = "debit" | "credit";

/** A single normalised statement line. */
export interface Transaction {
  date: string; // ISO yyyy-mm-dd (IST)
  narration: string; // raw bank narration string
  amount: number; // positive rupees (INR — converted if the charge was foreign)
  type: TxnType;
  balance?: number;
  // Original foreign currency + amount when this was an international charge.
  fx?: { currency: string; amount: number };
}

export type Category =
  | "subscription"
  | "utility"
  | "emi"
  | "investment" // SIP / mutual fund / RD — never call this waste
  | "rent"
  | "insurance"
  | "unknown";

export type Cadence = "monthly" | "quarterly" | "annual" | "irregular";

/** A flag explains WHY an item is suspicious — drives the "fix" actions. */
export type LeakFlag =
  | "forgotten" // long-running, low usefulness
  | "duplicate" // overlaps another service
  | "price-creep" // amount rose over time
  | "trial-converted" // first charge looks like a converted free trial
  | "annual-arbitrage" // could save by paying yearly
  | "autopay"; // runs on UPI AutoPay / e-mandate — easy to forget

/** A detected recurring charge — the unit the whole audit is built on. */
export interface RecurringItem {
  id: string;
  merchant: string; // clean resolved name, e.g. "Netflix"
  rawNarration: string; // a representative raw narration
  category: Category;
  cadence: Cadence;
  monthlyAmount: number; // normalised to a per-month figure
  lastAmount: number; // most recent charge
  firstAmount: number; // earliest charge in window
  occurrences: number;
  firstChargedOn: string; // earliest charge we can see
  lastChargedOn: string; // ISO date
  observedTotal: number; // total ₹ paid across the visible window (sunk cost)
  is80C: boolean; // tax-saving (ELSS/PPF/NPS/insurance) — counts toward 80C
  nextRenewalOn?: string; // ISO date estimate
  isAutoPay: boolean;
  flags: LeakFlag[];
  // Set when this charge is billed in a foreign currency. `amount` is the
  // original foreign value; `inrToday` is its value at the live FX rate.
  fx?: { currency: string; amount: number; inrToday?: number; rate?: number };
  // True only for things the user can actually cancel without harm.
  isWaste: boolean;
  // Concrete ₹/year the user could recover from this item (cancel, or switch
  // to annual). 0 for things we'd never tell them to touch.
  annualSavings: number;
}

/** Small at-a-glance stats derived from the account, shown after the audit. */
export interface QuickStats {
  // Next predicted salary credit (from detected salary deposits).
  salary: { inDays: number; amount: number; onDate: string } | null;
  avgMonthlySpend: number;
  currentMonthSpend: number;
  spendDelta: number; // currentMonth − average (negative = below avg = good)
  // Soonest upcoming auto-debit / UPI AutoPay (prefers a cancellable sub).
  nextAutopay: { merchant: string; amount: number; onDate: string; inDays: number; category: Category } | null;
}

export interface AuditResult {
  currency: "INR";
  bank?: string;
  statementKind: "bank" | "card";
  txnCount: number;
  windowDays: number;
  monthlyBurn: number; // SUBSCRIPTION spend / month — the hero number
  recurringTotalMonthly: number; // all recurring (subs + utilities + SIP + EMI…)
  annualBurn: number; // monthlyBurn * 12
  forgottenMonthly: number; // the "you've probably forgotten about" subset
  wasteMonthly: number; // cancellable leaks / month
  investmentMonthly: number; // SIP etc — shown but protected
  emiMonthly: number;
  internationalMonthly: number; // foreign-currency spend, in INR / month
  eightyCAnnual: number; // annual 80C-eligible investment/insurance (uncapped)
  fxAsOf?: string; // when the live FX rates were last updated
  fxLive?: boolean; // true if rates are live, false if the static fallback
  potentialAnnualSavings: number; // concrete ₹/year they could recover
  quickStats: QuickStats;
  healthScore: number; // 0..100
  items: RecurringItem[];
  notes: string[]; // human, helpful messages (e.g. unrecognised format)
  usedAI: boolean; // whether Claude refined the categorisation
}
