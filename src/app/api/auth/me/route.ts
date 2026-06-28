import { NextResponse } from "next/server";
import { currentUser, isPremium } from "@/lib/server/auth";
import { isDemoPhone } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ authenticated: false });
  return NextResponse.json({
    authenticated: true,
    phone: user.phone,
    premium: isPremium(user),
    demo: isDemoPhone(user.phone),
    plan: user.premium.plan ?? null,
  });
}
