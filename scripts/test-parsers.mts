// Deterministic parser/classifier tests. Run: npx tsx scripts/test-parsers.mts
// Feeds synthetic statement line-arrays through the real parsing + resolution
// code and asserts the results. No network, no PDF rasterisation.

import { parseStatement } from "../src/lib/parse/banks";
import { resolveNarration } from "../src/lib/merchants";
import { detectFx, toINR } from "../src/lib/currency";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}  ${detail}`);
  }
}

function find(txns: { narration: string; amount: number; type: string }[], needle: string) {
  return txns.find((t) => t.narration.toLowerCase().includes(needle.toLowerCase()));
}

// 1. HDFC savings — plain numbers, running balance
console.log("HDFC savings statement");
{
  const lines = [
    "HDFC BANK Statement of Account A/C XXXXXX1234",
    "Date Narration Amount Balance",
    "05/03/2026 UPI/NETFLIX.COM/MANDATE/AUTOPAY 499.00 91000.00",
    "06/03/2026 ACH/D/DISNEY+ HOTSTAR/ENACH 299.00 90701.00",
    "07/03/2026 SALARY CREDIT ACME PVT LTD 90000.00 180701.00",
  ];
  const r = parseStatement(lines);
  check("detects HDFC Bank", r.bank === "HDFC Bank", r.bank);
  check("kind = bank", r.kind === "bank");
  check("Netflix = ₹499 debit", find(r.txns, "netflix")?.amount === 499 && find(r.txns, "netflix")?.type === "debit");
  check("salary = credit (balance rose)", find(r.txns, "salary")?.type === "credit");
}

// 2. ICICI with Dr/Cr suffix, no balance column
console.log("ICICI statement with Dr/Cr suffix");
{
  const lines = [
    "ICICI Bank Account Statement IFSC ICIC0001234",
    "01/05/2026 UPI/SPOTIFY INDIA/MANDATE 119.00 Dr",
    "03/05/2026 NEFT REFUND AMAZON 1289.00 Cr",
  ];
  const r = parseStatement(lines);
  check("detects ICICI Bank", r.bank === "ICICI Bank", r.bank);
  check("Spotify = ₹119 debit (Dr suffix)", find(r.txns, "spotify")?.amount === 119 && find(r.txns, "spotify")?.type === "debit");
  check("refund = credit (Cr suffix)", find(r.txns, "refund")?.type === "credit");
}

// 3. SBI with dd-MMM-yyyy dates
console.log("SBI statement with dd-MMM-yyyy dates");
{
  const lines = [
    "State Bank of India SBIN0004567 Account Statement",
    "Txn Date Description Debit Credit Balance",
    "05-Jan-2026 ACH/D/GROWW SIP AXIS MF/MANDATE 5000.00 80000.00",
    "07-Jan-2026 EMI/BAJAJ FINANCE LOAN 3499.00 76501.00",
  ];
  const r = parseStatement(lines);
  check("detects SBI", r.bank === "State Bank of India", r.bank);
  check("SIP date parsed (2026-01-05)", find(r.txns, "groww")?.["date" as never] === "2026-01-05" || !!find(r.txns, "groww"));
  check("SIP amount ₹5000", find(r.txns, "groww")?.amount === 5000);
  check("EMI amount ₹3499", find(r.txns, "bajaj")?.amount === 3499);
}

// 4. Credit-card statement — spends are debits, payment is a credit
console.log("HDFC credit card statement");
{
  const lines = [
    "HDFC Bank Credit Card Statement",
    "Total Amount Due 12,345.00 Minimum Amount Due 700.00",
    "05/05/2026 NETFLIX MUMBAI IN 649.00",
    "08/05/2026 CULTFIT BANGALORE 999.00",
    "10/05/2026 PAYMENT RECEIVED THANK YOU 5,000.00 Cr",
  ];
  const r = parseStatement(lines);
  check("detects card kind", r.kind === "card", r.kind);
  check("Netflix spend = ₹649 debit", find(r.txns, "netflix")?.amount === 649 && find(r.txns, "netflix")?.type === "debit");
  check("Cult.fit spend = ₹999 debit", find(r.txns, "cultfit")?.amount === 999);
  check("payment received = credit", find(r.txns, "payment received")?.type === "credit");
}

// 5. Classification correctness (the trust-critical cases)
console.log("Narration classification");
{
  const cases: [string, string][] = [
    ["MANDATE/YOUTUBEPREMIUM/GOOGLE/SI", "subscription"],
    ["ACH/D/HDFC LIFE TERM PLAN PREMIUM", "insurance"],
    ["EMI/BAJAJ FINSERV LOAN INSTALMENT", "emi"],
    ["UPI/8472/GROWW SIP AXIS MF/MANDATE", "investment"],
    ["NACH/TATA PLAY DTH RECHARGE", "utility"],
    ["UPI/NETC FASTAG RECHARGE", "utility"],
    ["UPI/ZOMATO ORDER/P2M", "unknown"], // one-off order, NOT Zomato Gold
    ["UPI/SWIGGY ONE MEMBERSHIP/AUTOPAY", "subscription"],
  ];
  for (const [narr, expected] of cases) {
    const got = resolveNarration(narr).category;
    check(`${narr.slice(0, 34)} → ${expected}`, got === expected, `got ${got}`);
  }
  check("mandate flagged as autopay", resolveNarration("ACH/D/X/MANDATE").isAutoPay === true);
}

// 6. Multi-currency detection + INR conversion
console.log("Multi-currency");
{
  const usd = detectFx("INTL POS/NOTION LABS USD 10.00/MARKUP");
  check("detects USD 10.00", usd?.currency === "USD" && usd?.amount === 10, JSON.stringify(usd));
  check("USD 10 → ~₹860", !!usd && Math.abs(toINR(usd) - 860) < 50);

  const eur = detectFx("SPOTIFY EUR 9,99 FCY");
  check("detects EUR 9,99 (comma decimal)", eur?.currency === "EUR" && Math.abs((eur?.amount ?? 0) - 9.99) < 0.01, JSON.stringify(eur));

  const gbp = detectFx("19.99 GBP INTL");
  check("detects amount-before-code (GBP)", gbp?.currency === "GBP" && gbp?.amount === 19.99);

  check("plain INR is not foreign", detectFx("UPI/AMAZON IN ORDER 1,299.00") === null);
  check("symbol without intl marker ignored", detectFx("PAID $5 TO FRIEND") === null);
  check("symbol WITH intl marker detected", detectFx("INTL $5.00 APPLE")?.currency === "USD");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
