"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, CalendarClock, Loader2, ExternalLink } from "lucide-react";
import type { AuditResult } from "@/lib/types";
import { inrGroup } from "@/lib/format";
import { type CalEvent, downloadICS, googleCalendarUrl } from "@/lib/ics";
import { useAuth } from "./auth/AuthProvider";

const NotionGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
    <path
      fill="currentColor"
      d="M4 4.5 14.5 3.7c1-.1 1.3.0 1.9.5l2.4 1.7c.4.3.5.5.5 1v12.2c0 .7-.2 1.1-1.1 1.2l-11 .7c-.6 0-1-.1-1.4-.6L4.3 19c-.3-.4-.4-.7-.4-1.2V5.6c0-.6.3-1 1.1-1.1Zm10.8 2.3-9.3.6v.2l.9 1.1c.2.3.4.3.9.3l8.5-.5c.2 0 .3-.2.2-.4l-1-1c-.3-.3-.5-.3-1.1-.3Zm.5 2.9-9 .5v9.3l9-.5V9.7Z"
    />
  </svg>
);

const WhatsAppGlyph = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
    <path
      fill="currentColor"
      d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3-1-2.6-1.4-4.2-4.2-4.3-4.4-.1-.2-1-1.3-1-2.4s.6-1.7.8-1.9c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4 0 .5l-.4.5c-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2 .9.7 1.4 1 1.7 1.1.2 0 .4 0 .6-.2l.6-.7c.2-.3.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.3.1.7-.1 1.3Z"
    />
  </svg>
);

export function RemindersExport({ audit }: { audit: AuditResult }) {
  const { authenticated, openSignIn } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const events: CalEvent[] = useMemo(() => {
    const out: CalEvent[] = [];
    for (const i of audit.items) {
      if (!i.nextRenewalOn) continue;
      if (i.category === "subscription") {
        out.push({
          title: `Ooze: ${i.merchant} renews (₹${inrGroup(i.lastAmount)})`,
          date: i.nextRenewalOn,
          notes: `Recurring ${i.cadence} charge. Cancel if you no longer use it.`,
        });
      } else if (i.category === "emi") {
        out.push({
          title: `Ooze: ${i.merchant} EMI due (₹${inrGroup(i.lastAmount)})`,
          date: i.nextRenewalOn,
          notes: "Loan instalment due.",
        });
      }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [audit.items]);

  if (events.length === 0) return null;

  async function toNotion() {
    if (!authenticated) return openSignIn();
    setBusy("notion");
    setMsg(null);
    try {
      const res = await fetch("/api/calendar/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      const d = await res.json();
      setMsg(
        d.configured
          ? `Added ${d.created} reminder${d.created === 1 ? "" : "s"} to your Notion database.`
          : "Notion isn't connected yet — set NOTION_TOKEN + NOTION_DATABASE_ID to enable.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function toWhatsApp() {
    if (!authenticated) return openSignIn();
    setBusy("wa");
    setMsg(null);
    try {
      const res = await fetch("/api/reminders/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: events.length }),
      });
      const d = await res.json();
      setMsg(
        d.configured
          ? "Done — you'll get WhatsApp alerts before each charge."
          : "WhatsApp reminders are coming soon (provider not connected yet).",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-8">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-600 uppercase tracking-wide text-ivy">
        <CalendarClock className="h-4 w-4" strokeWidth={2} /> Reminders ({events.length})
      </h3>
      <div className="card p-5">
        <p className="text-sm text-[#9a978f]">
          Never get surprised by a renewal or EMI again. Add the next {events.length} to your
          calendar.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => downloadICS(events)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ivy/30 bg-ivy/10 px-3 py-2 text-xs font-600 text-ivy transition hover:bg-ivy/15"
          >
            <CalendarPlus className="h-3.5 w-3.5" strokeWidth={2} /> Download .ics (all calendars)
          </button>
          <a
            href={googleCalendarUrl(events[0])}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#ece9e1]/12 px-3 py-2 text-xs text-[#cfccc3] transition hover:bg-white/[0.04]"
          >
            Google Calendar (next) <ExternalLink className="h-3 w-3 opacity-60" strokeWidth={2} />
          </a>
          <button
            onClick={toNotion}
            disabled={busy === "notion"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#ece9e1]/12 px-3 py-2 text-xs text-[#cfccc3] transition hover:bg-white/[0.04] disabled:opacity-50"
          >
            {busy === "notion" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <NotionGlyph />} Add to Notion
          </button>
          <button
            onClick={toWhatsApp}
            disabled={busy === "wa"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#ece9e1]/12 px-3 py-2 text-xs text-[#cfccc3] transition hover:bg-white/[0.04] disabled:opacity-50"
          >
            {busy === "wa" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <WhatsAppGlyph />} WhatsApp alerts
          </button>
        </div>
        {msg && <p className="mt-3 text-xs text-ivy">{msg}</p>}
      </div>
    </section>
  );
}
