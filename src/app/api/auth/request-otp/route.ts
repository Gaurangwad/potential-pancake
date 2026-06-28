import { NextRequest, NextResponse } from "next/server";
import { normalisePhone } from "@/lib/constants";
import { requestOtp, smsConfigured } from "@/lib/server/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { phone } = await req.json().catch(() => ({}));
  const norm = normalisePhone(phone);
  if (!norm) {
    return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
  }

  const result = await requestOtp(norm);
  return NextResponse.json({
    ok: true,
    phone: norm,
    demo: result.demo,
    smsSent: smsConfigured() && !result.demo,
    // devCode is present only when no SMS provider is configured (test mode).
    devCode: result.devCode,
  });
}
