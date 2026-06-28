import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { sendReminderOptIn } from "@/lib/server/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { count } = (await req.json().catch(() => ({}))) as { count?: number };
  const result = await sendReminderOptIn(user.phone, count ?? 0);
  return NextResponse.json(result);
}
