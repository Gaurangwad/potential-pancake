import type {
  AuditResult,
  Cadence,
  Category,
  LeakFlag,
  QuickStats,
  RecurringItem,
  Transaction,
} from "./types";
import { merchantRule, is80C as is80CNarration } from "./merchants";
import { detectFx } from "./currency";
import type { NarrationResolution } from "./categorise";

const DAY = 86_400_000;

// Flags that make a subscription genuinely cuttable waste. "trial-converted"
// is deliberately NOT here — a just-started subscription is an alert to show,
// not money we claim you're wasting (you chose it). Over-claiming savings on a
// trust product is its own kind of dark pattern.
const SUSPECT_FLAGS = new Set<LeakFlag>(["forgotten", "duplicate"]);

// Services that overlap — used both to flag duplicates and to work out which
// ones are the "extras" you'd actually cancel (keeping the priciest/best one).
const DUPLICATE_GROUPS: Record<string, string[]> = {
  "video streaming": ["Netflix", "JioHotstar", "Amazon Prime", "SonyLIV", "ZEE5"],
  "music streaming": ["Spotify", "YouTube Premium"],
  "food membership": ["Swiggy One", "Zomato Gold"],
};

function daysBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / DAY;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00+05:30");
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

/** Map an average gap (in days) to a human cadence. */
function gapToCadence(gap: number): Cadence {
  if (gap >= 20 && gap <= 40) return "monthly";
  if (gap >= 80 && gap <= 100) return "quarterly";
  if (gap >= 330 && gap <= 400) return "annual";
  return "irregular";
}

function cadenceToMonthly(amount: number, cadence: Cadence): number {
  switch (cadence) {
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "annual":
      return amount / 12;
    default:
      return amount; // treat irregular monthly-ish as monthly
  }
}

interface Cluster {
  merchant: string;
  category: Category;
  isAutoPay: boolean;
  txns: Transaction[];
}

/**
 * Group debit transactions into recurring clusters by (merchant, amount band).
 * Amounts within ~12% are treated as the same charge so price creep still
 * clusters together.
 */
function cluster(
  txns: Transaction[],
  resolve: (n: string) => NarrationResolution,
): Cluster[] {
  const byMerchant = new Map<string, Transaction[]>();
  for (const t of txns) {
    if (t.type !== "debit") continue;
    const r = resolve(t.narration);
    const key = r.merchant.toLowerCase();
    const arr = byMerchant.get(key) ?? [];
    arr.push(t);
    byMerchant.set(key, arr);
  }

  const clusters: Cluster[] = [];
  for (const [, group] of byMerchant) {
    const r = resolve(group[0].narration);
    // One cluster per merchant. A price change over time is the SAME
    // subscription getting more expensive (price creep) — never two separate
    // subscriptions, which would double-count the charge.
    clusters.push({
      merchant: r.merchant,
      category: r.category,
      isAutoPay: r.isAutoPay || group.some((t) => resolve(t.narration).isAutoPay),
      txns: group.sort((a, b) => a.date.localeCompare(b.date)),
    });
  }
  return clusters;
}

function avgGap(txns: Transaction[]): number {
  if (txns.length < 2) return 30;
  let total = 0;
  for (let i = 1; i < txns.length; i++) {
    total += daysBetween(txns[i].date, txns[i - 1].date);
  }
  return total / (txns.length - 1);
}

/** A cluster is "recurring" if it repeats, or is a single mandated/known charge. */
function isRecurring(c: Cluster): boolean {
  if (c.txns.length >= 2) {
    const gap = avgGap(c.txns);
    return gap >= 20 && gap <= 400;
  }
  // A lone charge still counts when it's clearly a standing arrangement:
  // a recognised subscription, anything on a mandate / auto-debit, or a
  // confidently-typed protected commitment (SIP / EMI / insurance) that only
  // debited once in this window — we'd rather show it (protected) than miss it.
  if (c.category === "subscription" && merchantRule(c.merchant)) return true;
  if (c.isAutoPay && c.category !== "unknown") return true;
  if (c.category === "investment" || c.category === "emi" || c.category === "insurance")
    return true;
  return false;
}

function buildItem(c: Cluster, windowDays: number): RecurringItem {
  const txns = c.txns;
  const last = txns[txns.length - 1];
  const first = txns[0];
  const gap = avgGap(txns);
  const cadence = txns.length >= 2 ? gapToCadence(gap) : inferCadenceFromAmount(c);
  const monthlyAmount = cadenceToMonthly(last.amount, cadence);

  const flags: LeakFlag[] = [];
  if (c.isAutoPay) flags.push("autopay");

  // Price creep: latest meaningfully higher than first.
  if (txns.length >= 2 && last.amount > first.amount * 1.05) {
    flags.push("price-creep");
  }

  // Forgotten: long-running, low-value, autopay subscriptions you stop noticing.
  const ageDays = daysBetween(last.date, first.date);
  if (
    c.category === "subscription" &&
    last.amount <= 600 &&
    (c.isAutoPay || ageDays >= 60 || txns.length >= 3)
  ) {
    flags.push("forgotten");
  }

  // Trial-converted: a single recent charge from a known OTT/SaaS merchant.
  if (txns.length === 1 && c.category === "subscription" && merchantRule(c.merchant)) {
    flags.push("trial-converted");
  }

  // Annual arbitrage: monthly streaming/SaaS that usually has a cheaper yearly plan.
  if (cadence === "monthly" && c.category === "subscription" && last.amount >= 99) {
    flags.push("annual-arbitrage");
  }

  const nextRenewalOn =
    cadence !== "irregular" ? addDays(last.date, cadenceGapDays(cadence)) : undefined;

  // Foreign-currency charge: carry the original currency/amount for display.
  const fx = [...txns].reverse().find((t) => t.fx)?.fx;

  // Sunk cost (total observed) + tax-saving (80C) detection.
  const observedTotal = txns.reduce((s, t) => s + t.amount, 0);
  const is80C =
    (c.category === "investment" || c.category === "insurance") &&
    txns.some((t) => is80CNarration(t.narration));

  // "Waste" = a subscription we have a concrete reason to suspect is cuttable.
  // (Duplicates are tagged later, so isWaste is finalised in buildAudit.)
  const isWaste = c.category === "subscription" && flags.some((f) => SUSPECT_FLAGS.has(f));

  return {
    id: `${c.merchant}-${Math.round(last.amount)}`.toLowerCase().replace(/\s+/g, "-"),
    merchant: c.merchant,
    rawNarration: last.narration,
    category: c.category,
    cadence,
    monthlyAmount,
    lastAmount: last.amount,
    firstAmount: first.amount,
    occurrences: txns.length,
    firstChargedOn: first.date,
    lastChargedOn: last.date,
    observedTotal: Math.round(observedTotal),
    is80C,
    nextRenewalOn,
    isAutoPay: c.isAutoPay,
    flags,
    fx,
    isWaste,
    annualSavings: 0, // finalised in buildAudit once duplicates are tagged
  };
}

/** Concrete, conservative ₹/year recoverable from one item. */
function annualSavingsFor(i: RecurringItem, dupeExtras: Set<string>): number {
  // Forgotten → you'd cancel it: full annual cost recovered.
  if (i.flags.includes("forgotten")) return Math.round(i.monthlyAmount * 12);
  // A duplicate you'd drop (not the one you keep): full annual cost.
  if (i.flags.includes("duplicate") && dupeExtras.has(i.id)) {
    return Math.round(i.monthlyAmount * 12);
  }
  // Kept subscription billing monthly that has a cheaper yearly plan:
  // annual plans are typically ~2 months cheaper.
  if (i.category === "subscription" && i.flags.includes("annual-arbitrage")) {
    return Math.round(i.monthlyAmount * 2);
  }
  return 0;
}

function cadenceGapDays(c: Cadence): number {
  return c === "annual" ? 365 : c === "quarterly" ? 91 : 30;
}

function inferCadenceFromAmount(c: Cluster): Cadence {
  const rule = merchantRule(c.merchant);
  if (rule?.typical && c.txns[0].amount > rule.typical * 6) return "annual";
  return "monthly";
}

/** Detect duplicates: overlapping streaming/music services. */
function tagDuplicates(items: RecurringItem[]): void {
  for (const members of Object.values(DUPLICATE_GROUPS)) {
    const present = items.filter((i) => members.includes(i.merchant));
    if (present.length >= 2) {
      for (const i of present) {
        if (!i.flags.includes("duplicate")) i.flags.push("duplicate");
      }
    }
  }
}

/**
 * The "extra" duplicates you'd actually cancel — every overlapping service
 * except the most expensive one in each group (you keep the best, drop the
 * rest). Returns the set of item ids. This keeps savings honest: two video
 * apps means you save ONE of them, not both.
 */
function duplicateExtraIds(items: RecurringItem[]): Set<string> {
  const extras = new Set<string>();
  for (const members of Object.values(DUPLICATE_GROUPS)) {
    const present = items
      .filter((i) => members.includes(i.merchant))
      .sort((a, b) => b.monthlyAmount - a.monthlyAmount);
    for (const i of present.slice(1)) extras.add(i.id); // keep the first (priciest)
  }
  return extras;
}

/**
 * Subscription Health Score (0–100). Starts at 100; waste and bad habits
 * chip away. A single gamified number to bring users back.
 */
function healthScore(
  monthlyBurn: number,
  wasteMonthly: number,
  forgottenMonthly: number,
  items: RecurringItem[],
): number {
  if (monthlyBurn <= 0) return 100;
  let score = 100;
  const wasteRatio = wasteMonthly / monthlyBurn;
  score -= Math.min(45, wasteRatio * 70);
  score -= Math.min(25, (forgottenMonthly / monthlyBurn) * 60);
  const dupes = items.filter((i) => i.flags.includes("duplicate")).length;
  score -= Math.min(15, dupes * 5);
  const creep = items.filter((i) => i.flags.includes("price-creep")).length;
  score -= Math.min(10, creep * 5);
  const blindAutopay = items.filter(
    (i) => i.isAutoPay && i.isWaste && i.flags.includes("forgotten"),
  ).length;
  score -= Math.min(10, blindAutopay * 4);
  return Math.max(0, Math.round(score));
}

const SALARY_RE = /\bsalary\b|payroll|\bsal\s*cr\b|\bwages\b|stipend|neft.*salary|salary.*cred/i;

/** Days from now (IST) to an ISO date. */
function daysFromNow(iso: string): number {
  const target = new Date(iso + "T00:00:00+05:30").getTime();
  return Math.round((target - Date.now()) / DAY);
}

/** Small at-a-glance stats derived from the transactions + recurring items. */
function computeQuickStats(txns: Transaction[], items: RecurringItem[]): QuickStats {
  const debits = txns.filter((t) => t.type === "debit");
  const months = new Set(debits.map((t) => t.date.slice(0, 7)));
  const monthCount = Math.max(1, months.size);
  const totalDebit = debits.reduce((s, t) => s + t.amount, 0);
  const avgMonthlySpend = Math.round(totalDebit / monthCount);
  const latestMonth = [...months].sort().pop() ?? "";
  const currentMonthSpend = Math.round(
    debits.filter((t) => t.date.slice(0, 7) === latestMonth).reduce((s, t) => s + t.amount, 0),
  );

  // Salary: detect credits that look like pay, predict the next on the same
  // day-of-month after today.
  const salaryTxns = txns
    .filter((t) => t.type === "credit" && SALARY_RE.test(t.narration))
    .sort((a, b) => a.date.localeCompare(b.date));
  let salary: QuickStats["salary"] = null;
  if (salaryTxns.length) {
    const last = salaryTxns[salaryTxns.length - 1];
    const dom = Number(last.date.slice(8, 10));
    const now = new Date();
    let next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), dom));
    if (daysFromNow(next.toISOString().slice(0, 10)) < 0) {
      next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, dom));
    }
    const onDate = next.toISOString().slice(0, 10);
    salary = { inDays: Math.max(0, daysFromNow(onDate)), amount: last.amount, onDate };
  }

  // Nearest upcoming auto-debit — prefer a cancellable subscription (the
  // actionable one); fall back to the soonest auto-debit of any kind.
  const todayIso = new Date().toISOString().slice(0, 10);
  const autopayUpcoming = items
    .filter((i) => i.isAutoPay && i.nextRenewalOn && i.nextRenewalOn >= todayIso)
    .sort((a, b) => (a.nextRenewalOn ?? "").localeCompare(b.nextRenewalOn ?? ""));
  const upcoming =
    autopayUpcoming.find((i) => i.category === "subscription") ?? autopayUpcoming[0];
  const nextAutopay = upcoming?.nextRenewalOn
    ? {
        merchant: upcoming.merchant,
        amount: upcoming.lastAmount,
        onDate: upcoming.nextRenewalOn,
        inDays: Math.max(0, daysFromNow(upcoming.nextRenewalOn)),
        category: upcoming.category,
      }
    : null;

  return {
    salary,
    avgMonthlySpend,
    currentMonthSpend,
    spendDelta: currentMonthSpend - avgMonthlySpend,
    nextAutopay,
  };
}

export function buildAudit(
  txns: Transaction[],
  resolve: (n: string) => NarrationResolution,
  meta: {
    bank?: string;
    statementKind?: "bank" | "card";
    usedAI: boolean;
    notes?: string[];
    fxRates?: Record<string, number>;
    fxAsOf?: string;
    fxLive?: boolean;
  },
): AuditResult {
  // Normalise foreign-currency detection across every input path (upload, CSV,
  // sample, Account Aggregator) so multi-currency works everywhere.
  txns = txns.map((t) => (t.fx ? t : { ...t, fx: detectFx(t.narration) ?? undefined }));

  const dates = txns.map((t) => t.date).sort();
  const windowDays =
    dates.length >= 2 ? Math.max(1, daysBetween(dates[dates.length - 1], dates[0])) : 30;

  const clusters = cluster(txns, resolve).filter(isRecurring);
  const items = clusters
    .map((c) => buildItem(c, windowDays))
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  tagDuplicates(items);

  // Attach live FX conversion to foreign-currency items.
  if (meta.fxRates) {
    for (const i of items) {
      if (!i.fx) continue;
      const rate = meta.fxRates[i.fx.currency];
      if (rate) {
        i.fx.rate = rate;
        i.fx.inrToday = Math.round(i.fx.amount * rate);
      }
    }
  }

  // Finalise isWaste + per-item savings now that duplicates are tagged.
  const dupeExtras = duplicateExtraIds(items);
  for (const i of items) {
    i.isWaste = i.category === "subscription" && i.flags.some((f) => SUSPECT_FLAGS.has(f));
    i.annualSavings = annualSavingsFor(i, dupeExtras);
  }
  const potentialAnnualSavings = items.reduce((s, i) => s + i.annualSavings, 0);

  // The hero number is the SUBSCRIPTION burn only. SIPs, EMIs, insurance and
  // utilities are recurring but are never "subscriptions you're leaking on" —
  // bundling them in would destroy trust on a money app.
  let monthlyBurn = 0;
  let recurringTotal = 0;
  let wasteMonthly = 0;
  let forgottenMonthly = 0;
  let investmentMonthly = 0;
  let emiMonthly = 0;
  let internationalMonthly = 0;
  let eightyCMonthly = 0;

  for (const i of items) {
    recurringTotal += i.monthlyAmount;
    if (i.category === "subscription") monthlyBurn += i.monthlyAmount;
    if (i.category === "investment") investmentMonthly += i.monthlyAmount;
    if (i.category === "emi") emiMonthly += i.monthlyAmount;
    if (i.fx) internationalMonthly += i.monthlyAmount;
    if (i.is80C) eightyCMonthly += i.monthlyAmount;
    if (i.isWaste) wasteMonthly += i.monthlyAmount;
    if (i.flags.includes("forgotten")) forgottenMonthly += i.monthlyAmount;
  }

  const notes = meta.notes ?? [];
  if (investmentMonthly > 0)
    notes.push("Your SIPs and investments are protected — never counted as waste.");

  return {
    currency: "INR",
    bank: meta.bank,
    statementKind: meta.statementKind ?? "bank",
    txnCount: txns.length,
    windowDays: Math.round(windowDays),
    monthlyBurn: Math.round(monthlyBurn),
    recurringTotalMonthly: Math.round(recurringTotal),
    annualBurn: Math.round(monthlyBurn * 12),
    forgottenMonthly: Math.round(forgottenMonthly),
    wasteMonthly: Math.round(wasteMonthly),
    investmentMonthly: Math.round(investmentMonthly),
    emiMonthly: Math.round(emiMonthly),
    internationalMonthly: Math.round(internationalMonthly),
    eightyCAnnual: Math.round(eightyCMonthly * 12),
    fxAsOf: meta.fxAsOf,
    fxLive: meta.fxLive,
    potentialAnnualSavings: Math.round(potentialAnnualSavings),
    quickStats: computeQuickStats(txns, items),
    healthScore: healthScore(monthlyBurn, wasteMonthly, forgottenMonthly, items),
    items,
    notes,
    usedAI: meta.usedAI,
  };
}
