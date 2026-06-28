import type { Transaction } from "./types";

// A realistic, synthetic Indian statement used for the "Try a sample"
// demo path. It deliberately contains: forgotten low-value subs on autopay,
// a video-streaming duplicate, price creep, a just-converted trial, a
// protected SIP, an EMI, telecom + utility — so the audit shows its full
// intelligence. No real person's data.

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface Recur {
  narration: string;
  amount: number | number[]; // array => price creep across months
  day: number;
  months: number[]; // which months (1..) of the window
}

// 4-month window ending "now-ish" (months 3..6 of 2026 for the demo).
const Y = 2026;
const WINDOW = [3, 4, 5, 6];

const RECURRING: Recur[] = [
  { narration: "UPI/NETFLIX.COM/MANDATE/AUTOPAY/HDFC", amount: [499, 499, 649, 649], day: 4, months: [0, 1, 2, 3] },
  { narration: "ACH/D/DISNEY+ HOTSTAR/ENACH", amount: 299, day: 6, months: [0, 1, 2, 3] },
  { narration: "UPI/SPOTIFY INDIA/AUTOPAY/MANDATE", amount: 119, day: 9, months: [0, 1, 2, 3] },
  { narration: "MANDATE/YOUTUBEPREMIUM/GOOGLE/SI", amount: 149, day: 9, months: [0, 1, 2, 3] },
  { narration: "UPI/CULTFIT MEMBERSHIP/AUTOPAY", amount: 999, day: 2, months: [0, 1, 2, 3] },
  { narration: "ENACH/SWIGGY ONE/AUTOPAY", amount: 149, day: 12, months: [0, 1, 2, 3] },
  { narration: "UPI/8472615/ICLOUD APPLE.COM/SI", amount: 75, day: 15, months: [0, 1, 2, 3] },
  { narration: "ACH/D/TIMES OF INDIA TOI+/ENACH", amount: 99, day: 18, months: [0, 1, 2, 3] },
  // International charge — billed in USD, posted in INR with FX markup.
  { narration: "INTL POS/NOTION LABS USD 10.00/MARKUP", amount: 864, day: 16, months: [0, 1, 2, 3] },
  // A just-converted free trial — only one charge, recent month.
  { narration: "UPI/OPENAI CHATGPT/PLUS/MANDATE", amount: 1999, day: 20, months: [3] },
  // Telecom (utility, not waste)
  { narration: "UPI/AIRTEL PREPAID RECHARGE", amount: 359, day: 22, months: [0, 1, 2, 3] },
  // Broadband (utility)
  { narration: "ACH/D/ACT FIBERNET BROADBAND", amount: 799, day: 5, months: [0, 1, 2, 3] },
  // SIP — protected investment, must NOT be flagged as waste
  { narration: "ACH/D/GROWW ELSS TAX SAVER SIP/MANDATE", amount: 5000, day: 1, months: [0, 1, 2, 3] },
  { narration: "NACH/HDFC MF SIP FOLIO 9921/SI", amount: 2500, day: 1, months: [0, 1, 2, 3] },
  // EMI — recurring but not cancellable waste
  { narration: "EMI/BAJAJ FINANCE LOAN INSTALMENT", amount: 3499, day: 7, months: [0, 1, 2, 3] },
  // Insurance — protected
  { narration: "ACH/D/HDFC LIFE TERM PLAN PREMIUM", amount: 1200, day: 10, months: [0, 1, 2, 3] },
];

// Some non-recurring noise so the parser/cluster logic has to do real work.
const NOISE: Transaction[] = [
  { date: iso(Y, 4, 14), narration: "UPI/ZOMATO ORDER/P2M", amount: 437, type: "debit" },
  { date: iso(Y, 5, 3), narration: "UPI/AMAZON SHOPPING/P2M", amount: 1289, type: "debit" },
  { date: iso(Y, 3, 28), narration: "ATM CASH WITHDRAWAL", amount: 4000, type: "debit" },
  { date: iso(Y, 4, 1), narration: "SALARY CREDIT ACME PVT LTD", amount: 92000, type: "credit" },
  { date: iso(Y, 5, 1), narration: "SALARY CREDIT ACME PVT LTD", amount: 92000, type: "credit" },
];

export function sampleTransactions(): Transaction[] {
  const txns: Transaction[] = [];
  for (const r of RECURRING) {
    r.months.forEach((mIdx, occurrence) => {
      const month = WINDOW[mIdx];
      const amount = Array.isArray(r.amount)
        ? r.amount[mIdx] ?? r.amount[r.amount.length - 1]
        : r.amount;
      txns.push({
        date: iso(Y, month, r.day),
        narration: r.narration,
        amount,
        type: "debit",
      });
      void occurrence;
    });
  }
  txns.push(...NOISE);
  return txns.sort((a, b) => a.date.localeCompare(b.date));
}
