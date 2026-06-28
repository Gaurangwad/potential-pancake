import { cookies } from "next/headers";
import { SESSION_COOKIE, isDemoPhone } from "../constants";
import { verifyToken } from "./session";
import { getUser, type User } from "./store";

// Resolve the current request's authenticated user (or null) from the cookie.

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await getUser(payload.phone);
  return user ?? null;
}

/** Premium = the demo number, OR a user with an active (paid) subscription. */
export function isPremium(user: User | null): boolean {
  if (!user) return false;
  if (isDemoPhone(user.phone)) return true;
  return user.premium.active;
}
