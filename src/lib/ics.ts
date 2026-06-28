// Calendar export — universal .ics (Apple/Google/Outlook) plus per-event
// "Add to Google Calendar" template links (no auth needed). Pure + client-safe.

export interface CalEvent {
  title: string;
  date: string; // ISO yyyy-mm-dd
  notes?: string;
}

function ymd(iso: string): string {
  return iso.replaceAll("-", "");
}

function addDay(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function esc(s: string): string {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/** A full VCALENDAR with a 1-day-before alarm on each all-day event. */
function icsStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

export function buildICS(events: CalEvent[]): string {
  const stamp = icsStamp();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ooze//Reminders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  events.forEach((e, i) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:ooze-${ymd(e.date)}-${i}@ooze.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.date)}`,
      `DTEND;VALUE=DATE:${ymd(addDay(e.date))}`,
      `SUMMARY:${esc(e.title)}`,
      e.notes ? `DESCRIPTION:${esc(e.notes)}` : "DESCRIPTION:Ooze reminder",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder",
      "END:VALARM",
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** A Google Calendar "create event" template URL for a single event. */
export function googleCalendarUrl(e: CalEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${ymd(e.date)}/${ymd(addDay(e.date))}`,
    details: e.notes ?? "Ooze reminder",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Trigger a client-side download of the .ics file. */
export function downloadICS(events: CalEvent[], filename = "ooze-reminders.ics"): void {
  const blob = new Blob([buildICS(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
