import { NextRequest, NextResponse } from "next/server";
import { currentUser, isPremium } from "@/lib/server/auth";
import { PRICING, type PlanId } from "@/lib/constants";
import { createOrder, razorpayConfigured, publicKeyId } from "@/lib/server/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (isPremium(user)) return NextResponse.json({ alreadyPremium: true });

  const { plan } = (await req.json().catch(() => ({}))) as { plan?: PlanId };
  const chosen = plan && PRICING[plan] ? PRICING[plan] : PRICING.monthly;

  // No keys → mock mode so the paid flow stays testable in dev.
  if (!razorpayConfigured()) {
    return NextResponse.json({
      mock: true,
      plan: chosen.id,
      amount: chosen.amount,
      note: "Test build: Razorpay keys not set — simulate a payment to continue.",
    });
  }

  try {
    const order = await createOrder(chosen.amount, user.phone);
    return NextResponse.json({
      mock: false,
      keyId: publicKeyId(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: chosen.id,
    });
  } catch (err) {
    console.error("checkout failed:", err);
    return NextResponse.json({ error: "Couldn't start checkout. Try again." }, { status: 502 });
  }
}
