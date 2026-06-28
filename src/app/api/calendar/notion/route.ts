import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { createReminderPages, type ReminderEvent } from "@/lib/server/notion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { events } = (await req.json().catch(() => ({}))) as { events?: ReminderEvent[] };
  if (!events?.length) return NextResponse.json({ error: "No reminders to add." }, { status: 400 });

  const result = await createReminderPages(events.slice(0, 50));
  return NextResponse.json(result);
}
