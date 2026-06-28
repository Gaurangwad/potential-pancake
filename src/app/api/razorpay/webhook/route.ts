import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/server/razorpay";
import { setPremium, getUser } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Razorpay webhook — the SOURCE OF TRUTH for premium status, not the client.
// Verify the signature, then reconcile the user's subscription state.
//
// We set the order `receipt` to the user's phone when creating it, so we can
// map a captured payment back to the account here.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const type = event.event ?? "";

  // Map the webhook to a phone via the order receipt.
  const phone = extractPhone(event);
  if (phone && (await getUser(phone))) {
    if (type === "payment.captured" || type === "subscription.charged" || type === "subscription.activated") {
      await setPremium(phone, {
        active: true,
        source: "razorpay",
        since: new Date().toISOString(),
        plan: "razorpay",
      });
    } else if (
      type === "subscription.halted" ||
      type === "subscription.cancelled" ||
      type === "subscription.completed"
    ) {
      const user = await getUser(phone);
      await setPremium(phone, { ...(user?.premium ?? { source: "razorpay" }), active: false });
    }
  }

  return NextResponse.json({ ok: true });
}

function extractPhone(event: { payload?: Record<string, unknown> }): string | null {
  try {
    const payload = event.payload as Record<string, { entity?: Record<string, unknown> }>;
    const order = payload?.order?.entity as { receipt?: string } | undefined;
    if (order?.receipt && /^\d{10}$/.test(order.receipt)) return order.receipt;
    const payment = payload?.payment?.entity as
      | { notes?: Record<string, string>; receipt?: string }
      | undefined;
    const notesPhone = payment?.notes?.phone;
    if (notesPhone && /^\d{10}$/.test(notesPhone)) return notesPhone;
    return null;
  } catch {
    return null;
  }
}
