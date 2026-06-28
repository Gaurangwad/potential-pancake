import crypto from "crypto";
import { DEMO_OTP, isDemoPhone } from "../constants";
import { saveOtp, readOtp, clearOtp, bumpOtpAttempts } from "./store";

// OTP generation + delivery. Delivery is pluggable:
//  - If an SMS provider is configured (e.g. MSG91_AUTH_KEY), send a real SMS.
//  - Otherwise run in DEV mode: the code is returned to the client and shown
//    on screen, clearly marked as test mode, so the flow is testable with no
//    paid SMS provider. The demo number always uses a fixed code.

const OTP_TTL_MS = 5 * 60_000; // 5 minutes
const MAX_ATTEMPTS = 5;

function genCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function smsConfigured(): boolean {
  return !!process.env.MSG91_AUTH_KEY || !!process.env.TWILIO_ACCOUNT_SID;
}

export interface RequestResult {
  ok: true;
  /** Present only in DEV mode (no SMS provider) so the tester can read it. */
  devCode?: string;
  demo: boolean;
}

export async function requestOtp(phone: string): Promise<RequestResult> {
  const demo = isDemoPhone(phone);
  const code = demo ? DEMO_OTP : genCode();
  await saveOtp(phone, code, OTP_TTL_MS);

  if (smsConfigured() && !demo) {
    await sendSms(phone, code);
    return { ok: true, demo: false };
  }
  // Dev/test mode — surface the code so it can be entered. The demo number is
  // always free, so its fixed code is fine to reveal.
  return { ok: true, devCode: code, demo };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "invalid" | "locked" | "none" };

export async function verifyOtp(phone: string, input: string): Promise<VerifyResult> {
  const rec = await readOtp(phone);
  if (!rec) return { ok: false, reason: "none" };
  if (rec.attempts >= MAX_ATTEMPTS) {
    await clearOtp(phone);
    return { ok: false, reason: "locked" };
  }
  if (Date.now() > rec.expiresAt) {
    await clearOtp(phone);
    return { ok: false, reason: "expired" };
  }
  if ((input || "").trim() !== rec.code) {
    await bumpOtpAttempts(phone);
    return { ok: false, reason: "invalid" };
  }
  await clearOtp(phone);
  return { ok: true };
}

/** Real SMS delivery via MSG91 (popular in India). No-op friendly. */
async function sendSms(phone: string, code: string): Promise<void> {
  const key = process.env.MSG91_AUTH_KEY;
  if (!key) return;
  try {
    await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { authkey: key, "Content-Type": "application/json" },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        recipients: [{ mobiles: `91${phone}`, otp: code }],
      }),
    });
  } catch (err) {
    console.error("SMS send failed:", err);
  }
}
