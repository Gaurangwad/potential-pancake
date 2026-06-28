import { NextRequest, NextResponse } from "next/server";
import { normalisePhone, isDemoPhone, SESSION_COOKIE, SESSION_TTL_DAYS } from "@/lib/constants";
import { verifyOtp } from "@/lib/server/otp";
import { upsertUser, getUser } from "@/lib/server/store";
import { createToken } from "@/lib/server/session";
import { isPremium } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASONS: Record<string, string> = {
  none: "Request a code first.",
  expired: "That code expired. Request a new one.",
  invalid: "Incorrect code. Try again.",
  locked: "Too many attempts. Request a new code.",
};

export async function POST(req: NextRequest) {
  const { phone, otp } = await req.json().catch(() => ({}));
  const norm = normalisePhone(phone);
  if (!norm) {
    return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
  }

  const result = await verifyOtp(norm, String(otp ?? ""));
  if (!result.ok) {
    return NextResponse.json({ error: REASONS[result.reason], code: result.reason }, { status: 401 });
  }

  // First verification creates the account; later ones just log in.
  const isNew = !(await getUser(norm));
  await upsertUser(norm);
  const user = await getUser(norm);

  const res = NextResponse.json({
    ok: true,
    isNew,
    phone: norm,
    premium: isPremium(user!),
    demo: isDemoPhone(norm),
  });
  res.cookies.set(SESSION_COOKIE, createToken(norm), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86_400,
  });
  return res;
}
