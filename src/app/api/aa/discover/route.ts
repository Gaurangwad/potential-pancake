import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { discoverAccounts } from "@/lib/server/aa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Discover bank/card accounts linked to the signed-in user's phone via the
// Account Aggregator. Consent to actually fetch is given on the next step.
export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to auto-fetch." }, { status: 401 });
  const { accounts, sandbox } = await discoverAccounts(user.phone);
  return NextResponse.json({ accounts, sandbox });
}
