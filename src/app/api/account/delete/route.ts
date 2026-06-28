import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { deleteUser } from "@/lib/server/store";
import { SESSION_COOKIE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DPDP "right to erasure" — wipes the user's account, audit snapshots and OTPs,
// then ends the session.
export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  await deleteUser(user.phone);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
