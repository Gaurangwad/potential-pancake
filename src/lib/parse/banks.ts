import type { Transaction, TxnType } from "../types";
import { detectFx } from "../currency";

// Per-bank parsing lives behind a common interface: adding a bank = adding
// one adapter. We ship a strong generic adapter that handles the common
// "date … narration … amount … balance" row shape used (with variations) by
// HDFC, ICICI, SBI, Axis and Kotak, plus light bank detection for labelling.

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Parse the many Indian date formats into ISO yyyy-mm-dd. */
function toIso(raw: string): string | null {
  let m = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    const d = +m[1], mo = +m[2];
    let y = +m[3];
    if (y < 100) y += 2000;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return `${y}-${pad(mo)}-${pad(d)}`;
  }
  // 05-Jan-2024 / 05 Jan 24 / 05-JAN-24
  m = raw.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[\s\-](\d{2,4})$/);
  if (m) {
    const mo = MONTHS[m[2].toLowerCase()];
    if (!mo) return null;
    let y = +m[3];
    if (y < 100) y += 2000;
    return `${y}-${pad(mo)}-${pad(+m[1])}`;
  }
  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const DATE_RE = /\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{1,2}[\s\-][A-Za-z]{3}[\s\-]\d{2,4})\b/;
// Money with paise: 1,20,000.00 or plain 90701.00. We require 2 decimals so
// reference numbers / UPI ids inside a narration aren't mistaken for amounts.
const MONEY_DECIMAL_RE = /\d{1,3}(?:,\d{2,3})*\.\d{2}(?!\d)|\d+\.\d{2}(?!\d)/g;
// Fallback: comma-grouped integers (the commas signal a money figure).
const MONEY_GROUPED_RE = /\d{1,3}(?:,\d{2,3})+(?!\d)/g;

function parseAmount(s: string): number {
  return parseFloat(s.replace(/,/g, ""));
}

interface MoneyHit {
  value: number;
  index: number;
  end: number;
  /** "dr" / "cr" marker immediately following the figure, if any. */
  suffix?: "dr" | "cr";
}

/** Money figures in a string, in order, with their positions + Dr/Cr suffix. */
function moneyHits(s: string): MoneyHit[] {
  let matches = [...s.matchAll(MONEY_DECIMAL_RE)];
  if (matches.length === 0) matches = [...s.matchAll(MONEY_GROUPED_RE)];
  return matches.map((m) => {
    const index = m.index ?? 0;
    const end = index + m[0].length;
    const trailing = s.slice(end, end + 4).toLowerCase();
    const sx = /^\s*(dr|cr)\b/.exec(trailing);
    return {
      value: parseAmount(m[0]),
      index,
      end,
      suffix: sx ? (sx[1] as "dr" | "cr") : undefined,
    };
  });
}

interface ParseOpts {
  /** Credit-card statements list spends (debits) with no running balance. */
  card?: boolean;
}

/**
 * Generic row parser. For a savings/current statement the trailing figure is
 * the running balance (when 2+ present) and the one before it is the amount;
 * debit/credit is inferred from the balance delta, then Dr/Cr suffix, then
 * keywords. For a credit-card statement there is no balance column — the figure
 * is the spend (a debit) unless marked Cr / a payment / refund.
 */
function genericParse(lines: string[], opts: ParseOpts = {}): Transaction[] {
  const txns: Transaction[] = [];
  let prevBalance: number | null = null;

  for (const line of lines) {
    const dateMatch = line.match(DATE_RE);
    if (!dateMatch) continue;
    const iso = toIso(dateMatch[1].replace(/\s+/g, dateMatch[1].includes("-") ? "-" : " "));
    if (!iso) continue;

    // Only look for amounts AFTER the date so the date's digits never count.
    const afterDate = line.slice((dateMatch.index ?? 0) + dateMatch[0].length);
    const hits = moneyHits(afterDate);
    if (hits.length === 0) continue;

    const narration = afterDate.slice(0, hits[0].index).replace(/\s+/g, " ").trim();
    if (!narration || narration.length < 2) continue;

    const lower = line.toLowerCase();
    let amount: number;
    let balance: number | undefined;
    let amountHit: MoneyHit;

    if (opts.card) {
      // The spend is the amount figure (the last money on the row). Card rows
      // may carry a foreign-currency figure too; the INR amount is last.
      amountHit = hits[hits.length - 1];
      amount = amountHit.value;
    } else if (hits.length >= 2) {
      balance = hits[hits.length - 1].value;
      amountHit = hits[hits.length - 2];
      amount = amountHit.value;
    } else {
      amountHit = hits[0];
      amount = amountHit.value;
    }
    if (!(amount >= 1)) continue;

    const explicitDr = amountHit.suffix === "dr" || /\bwithdrawal\b|\bdebit\b/.test(lower);
    const explicitCr =
      amountHit.suffix === "cr" ||
      /\bdeposit\b|\bcredit\b|salary|refund|reversal|cashback|received|interest/.test(lower);

    let type: TxnType;
    if (opts.card) {
      type = explicitCr && !explicitDr ? "credit" : "debit";
    } else if (balance != null && prevBalance != null) {
      const delta = balance - prevBalance;
      if (Math.abs(delta + amount) < 1) type = "debit";
      else if (Math.abs(delta - amount) < 1) type = "credit";
      else type = explicitCr && !explicitDr ? "credit" : "debit";
    } else {
      type = explicitCr && !explicitDr ? "credit" : "debit";
    }
    if (balance != null) prevBalance = balance;

    const fx = detectFx(narration) ?? undefined;
    txns.push({ date: iso, narration, amount, type, balance, fx });
  }

  return txns;
}

export type StatementKind = "bank" | "card";

interface AdapterDef {
  name: string;
  kind: StatementKind;
  detect: string[];
}

// Credit-card statements first — they often also mention a bank name, so the
// stronger card signals must win the detection race.
const CARD_ADAPTERS: AdapterDef[] = [
  { name: "HDFC Credit Card", kind: "card", detect: ["hdfc bank credit card", "hdfc card"] },
  { name: "ICICI Credit Card", kind: "card", detect: ["icici bank credit card", "icici card"] },
  { name: "Axis Credit Card", kind: "card", detect: ["axis bank credit card", "axis card", "flipkart axis"] },
  { name: "SBI Card", kind: "card", detect: ["sbi card", "sbi cards"] },
  { name: "American Express", kind: "card", detect: ["american express", "amex"] },
  { name: "Credit Card", kind: "card", detect: ["credit card statement", "card member", "minimum amount due", "total amount due", "available credit limit"] },
];

const BANK_ADAPTERS: AdapterDef[] = [
  { name: "HDFC Bank", kind: "bank", detect: ["hdfc bank", "hdfc0"] },
  { name: "ICICI Bank", kind: "bank", detect: ["icici bank", "icic0"] },
  { name: "State Bank of India", kind: "bank", detect: ["state bank of india", "sbin0"] },
  { name: "Axis Bank", kind: "bank", detect: ["axis bank", "utib0"] },
  { name: "Kotak Mahindra Bank", kind: "bank", detect: ["kotak", "kkbk0"] },
  { name: "Yes Bank", kind: "bank", detect: ["yes bank", "yesb0"] },
  { name: "IDFC FIRST Bank", kind: "bank", detect: ["idfc first", "idfb0"] },
  { name: "IndusInd Bank", kind: "bank", detect: ["indusind", "indb0"] },
  { name: "Punjab National Bank", kind: "bank", detect: ["punjab national", "punb0"] },
  { name: "Bank of Baroda", kind: "bank", detect: ["bank of baroda", "barb0"] },
  { name: "Canara Bank", kind: "bank", detect: ["canara bank", "cnrb0"] },
  { name: "Union Bank of India", kind: "bank", detect: ["union bank", "ubin0"] },
  { name: "RBL Bank", kind: "bank", detect: ["rbl bank", "ratn0"] },
  { name: "AU Small Finance Bank", kind: "bank", detect: ["au small finance", "aubl0"] },
];

function headText(lines: string[]): string {
  return lines.slice(0, 40).join(" ").toLowerCase();
}

function findAdapter(lines: string[]): AdapterDef | undefined {
  const head = headText(lines);
  return (
    CARD_ADAPTERS.find((a) => a.detect.some((n) => head.includes(n))) ??
    BANK_ADAPTERS.find((a) => a.detect.some((n) => head.includes(n)))
  );
}

export interface ParseOutcome {
  bank?: string;
  kind: StatementKind;
  txns: Transaction[];
  recognised: boolean;
}

export function parseStatement(lines: string[]): ParseOutcome {
  const adapter = findAdapter(lines);
  const kind = adapter?.kind ?? "bank";
  const txns = genericParse(lines, { card: kind === "card" });
  return { bank: adapter?.name, kind, txns, recognised: txns.length >= 3 };
}

/** CSV fallback: date,narration,amount,type[,balance]. Loud + simple. */
export function parseCsv(text: string): Transaction[] {
  const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
  const out: Transaction[] = [];
  for (const row of rows) {
    const cols = splitCsv(row);
    if (cols.length < 3) continue;
    const iso = toIso(cols[0].trim());
    if (!iso) continue; // skips header
    const amount = parseAmount(cols[2]);
    if (isNaN(amount)) continue;
    const t = (cols[3] || "").toLowerCase();
    const type: TxnType = t.startsWith("c") || t === "credit" ? "credit" : "debit";
    out.push({
      date: iso,
      narration: cols[1].trim(),
      amount: Math.abs(amount),
      type,
      balance: cols[4] ? parseAmount(cols[4]) : undefined,
      fx: detectFx(cols[1]) ?? undefined,
    });
  }
  return out;
}

function splitCsv(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) {
      result.push(cur);
      cur = "";
    } else cur += ch;
  }
  result.push(cur);
  return result;
}
