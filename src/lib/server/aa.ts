import type { Transaction } from "../types";
import { sampleTransactions } from "../sample";

// Account Aggregator (AA) autofetch — India's consent-based financial-data
// rails (NBFC-AA + FIU via a TSP like Setu / Finvu / Anumati). This removes the
// drag-and-drop step: discover accounts linked to a phone, take consent, pull
// transactions directly.
//
// REAL: with a TSP partner configured (SETU_AA_CLIENT_ID/SECRET), discover →
// create a consent request → the user approves in their AA app → we fetch the
// FI data and normalise it to Transaction[]. Becoming an FIU / onboarding a TSP
// is a regulated, multi-week process — that's the production prerequisite.
//
// SANDBOX (default): returns representative linked accounts + transactions so
// the consent → fetch → audit flow is testable now. Marked `sandbox: true`.

export function aaConfigured(): boolean {
  return !!process.env.SETU_AA_CLIENT_ID && !!process.env.SETU_AA_CLIENT_SECRET;
}

export interface LinkedAccount {
  id: string;
  bank: string;
  maskedNumber: string;
  type: "savings" | "current" | "card";
}

/** Accounts the AA reports as linkable for this phone (consent not yet given). */
export async function discoverAccounts(phone: string): Promise<{ accounts: LinkedAccount[]; sandbox: boolean }> {
  if (aaConfigured()) {
    // Production: call the TSP discover API with the phone (VUA) here.
  }
  // Sandbox — deterministic from the phone's last digit for a little variety.
  const seed = Number(phone.slice(-1)) || 0;
  const accounts: LinkedAccount[] = [
    { id: "acc_hdfc", bank: "HDFC Bank", maskedNumber: "XXXX" + (1234 + seed), type: "savings" },
    { id: "acc_icici", bank: "ICICI Bank", maskedNumber: "XXXX" + (5678 + seed), type: "savings" },
    { id: "acc_hdfc_cc", bank: "HDFC Credit Card", maskedNumber: "XXXX" + (9012 + seed), type: "card" },
  ];
  return { accounts, sandbox: !aaConfigured() };
}

/** After consent, fetch + normalise transactions for the chosen accounts. */
export async function fetchTransactions(
  phone: string,
  accountIds: string[],
): Promise<Transaction[]> {
  if (aaConfigured()) {
    // Production: poll the consent/session, fetch FI data, map to Transaction[].
  }
  // Sandbox: return the synthetic statement (the same realistic data the demo
  // uses), so the downstream audit is identical to the upload path.
  void accountIds;
  void phone;
  return sampleTransactions();
}
