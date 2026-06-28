import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { isDemoPhone } from "@/lib/constants";
import { addAuditSnapshot, seedDemoHistory, type AuditSnapshot } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Persist a derived snapshot (no raw transactions) so we can show savings
// growth over re-audits. Signed-in only — this is the "track over time" value.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });

  const b = (await req.json().catch(() => ({}))) as Partial<AuditSnapshot>;
  const snap: AuditSnapshot = {
    at: new Date().toISOString(),
    monthlyBurn: Math.max(0, Math.round(b.monthlyBurn ?? 0)),
    wasteMonthly: Math.max(0, Math.round(b.wasteMonthly ?? 0)),
    potentialAnnualSavings: Math.max(0, Math.round(b.potentialAnnualSavings ?? 0)),
    healthScore: Math.max(0, Math.min(100, Math.round(b.healthScore ?? 0))),
  };

  // Demo account gets a seeded back-history so the trend graph is meaningful.
  if (isDemoPhone(user.phone)) await seedDemoHistory(user.phone, snap);

  const history = await addAuditSnapshot(user.phone, snap);
  return NextResponse.json({ authenticated: true, history });
}
