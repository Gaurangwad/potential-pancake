// Indian-style currency + date formatting. Money is the design — keep it exact.

/** Group with the Indian lakh/crore system: 1,20,000 not 120,000. */
export function inrGroup(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  const s = String(abs);
  if (s.length <= 3) return sign + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${sign}${grouped},${last3}`;
}

/** ₹4,237 — no decimals for headline figures. */
export function inr(n: number): string {
  return `₹${inrGroup(n)}`;
}

/** ₹4,237.50 — for line items where paise matter. */
export function inrPrecise(n: number): string {
  const whole = Math.floor(Math.abs(n));
  const paise = Math.round((Math.abs(n) - whole) * 100);
  const base = `₹${inrGroup(whole)}`;
  return paise ? `${base}.${String(paise).padStart(2, "0")}` : base;
}

const IST_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
};

export function fmtDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00+05:30" : ""));
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", IST_OPTS).format(d);
}

export function fmtDateShort(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00+05:30" : ""));
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
  }).format(d);
}

/** "in 6 days" / "today" / "in 3 weeks" — relative to now in IST. */
export function untilLabel(iso?: string): string | null {
  if (!iso) return null;
  const target = new Date(iso + "T00:00:00+05:30").getTime();
  const now = Date.now();
  const days = Math.round((target - now) / 86_400_000);
  if (days < 0) return null;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 14) return `in ${days} days`;
  if (days < 60) return `in ${Math.round(days / 7)} weeks`;
  return `in ${Math.round(days / 30)} months`;
}
