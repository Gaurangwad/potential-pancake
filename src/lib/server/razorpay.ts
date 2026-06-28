import crypto from "crypto";

// Razorpay integration via REST (no SDK dependency).
//  - With test keys set, we create a real Order and verify the payment
//    signature server-side (never trust the client).
//  - Without keys, we run in MOCK mode so the paid flow is still testable:
//    a clearly-marked "simulate payment" path grants premium in dev only.
//
// Production note: for true recurring billing, swap createOrder for the
// Subscriptions API (it handles the RBI e-mandate / UPI AutoPay flow). The
// webhook + signature verification below already generalise to subscriptions.

export function razorpayConfigured(): boolean {
  return !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;
}

export function publicKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID ?? null;
}

export interface RazorpayOrder {
  id: string;
  amount: number; // paise
  currency: string;
}

export async function createOrder(amountInr: number, receipt: string): Promise<RazorpayOrder> {
  const keyId = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amountInr * 100,
      currency: "INR",
      receipt,
      notes: { product: "ooze-premium" },
    }),
  });
  if (!res.ok) {
    throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/** Verify the checkout callback signature: HMAC(order_id|payment_id). */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return timingSafeEqualHex(expected, signature);
}

/** Verify a webhook payload against the X-Razorpay-Signature header. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqualHex(expected, signature);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
