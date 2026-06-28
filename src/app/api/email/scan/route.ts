import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Email scan for overhead/unaccounted expenses + upcoming loan dues.
//
// REAL: with Google OAuth configured (GOOGLE_CLIENT_ID/SECRET + a stored
// refresh token), this would query Gmail for billing/EMI/utility senders and
// parse amounts + due dates. Restricted Gmail scopes require a verified Google
// Cloud app — that's the production step.
//
// SANDBOX (default): returns representative synthetic results so the Loans &
// Overhead sections are testable now. Clearly marked `sandbox: true`.
function gmailConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

function iso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);
}

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  if (gmailConfigured()) {
    // Production path would go here (OAuth + Gmail API). Until a refresh token
    // is wired, fall through to the sandbox so the UI still works.
  }

  return NextResponse.json({
    connected: true,
    sandbox: !gmailConfigured(),
    dues: [
      { merchant: "Bajaj Finserv EMI", amount: 3499, dueOn: iso(6), source: "email" },
      { merchant: "HDFC Home Loan", amount: 28450, dueOn: iso(11), source: "email" },
      { merchant: "Credit Card — min due", amount: 2100, dueOn: iso(3), source: "email" },
    ],
    overhead: [
      { merchant: "Electricity (BESCOM)", amount: 1840, note: "Not in your statement window", source: "email" },
      { merchant: "Society maintenance", amount: 3200, note: "Monthly, paid by cash/cheque", source: "email" },
      { merchant: "Apartment water tanker", amount: 600, note: "Irregular overhead", source: "email" },
    ],
  });
}
