import { NextRequest, NextResponse } from "next/server";
import { currentUser, isPremium } from "@/lib/server/auth";
import { PRICING, type PlanId } from "@/lib/constants";
import { razorpayConfigured, verifyPaymentSignature } from "@/lib/server/razorpay";
import { setPremium } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (isPremium(user)) return NextResponse.json({ ok: true, premium: true });

  const body = (await req.json().catch(() => ({}))) as {
    mock?: boolean;
    plan?: PlanId;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  const plan = body.plan && PRICING[body.plan] ? body.plan : "monthly";

  // Mock path — only valid when Razorpay isn't configured (the test build).
  // Once real keys are set, this is rejected and a real payment is required.
  if (body.mock) {
    if (razorpayConfigured()) {
      return NextResponse.json({ error: "Mock payment is disabled — real payment required." }, { status: 400 });
    }
    await setPremium(user.phone, {
      active: true,
      plan,
      source: "razorpay",
      since: new Date().toISOString(),
      paymentId: "mock_payment",
    });
    return NextResponse.json({ ok: true, premium: true, mock: true });
  }

  // Real path — verify the signature server-side; never trust the client.
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }
  const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!valid) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  await setPremium(user.phone, {
    active: true,
    plan,
    source: "razorpay",
    since: new Date().toISOString(),
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  });
  return NextResponse.json({ ok: true, premium: true });
}
