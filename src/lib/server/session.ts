import crypto from "crypto";
import { SESSION_TTL_DAYS } from "../constants";

// A small, dependency-free signed session token (HS256-style HMAC).
// Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256). The payload
// is signed, not encrypted — it only carries the phone + expiry, no secrets.

let warnedNoSecret = false;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production" && !warnedNoSecret) {
    warnedNoSecret = true;
    console.warn(
      "[ooze] AUTH_SECRET is not set (or too short) in production — using an INSECURE dev fallback. " +
        "Set AUTH_SECRET to a long random string in your environment.",
    );
  }
  // Dev fallback so the app runs without setup. NOT for production.
  return "ooze-dev-insecure-secret-change-me";
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export interface SessionPayload {
  phone: string;
  exp: number; // epoch ms
}

export function createToken(phone: string): string {
  const payload: SessionPayload = {
    phone,
    exp: Date.now() + SESSION_TTL_DAYS * 86_400_000,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

export function verifyToken(token?: string | null): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = hmac(body);
  // Timing-safe comparison.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload.phone || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
