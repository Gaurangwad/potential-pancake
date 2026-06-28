import type { RecurringItem } from "./types";

// CA-ready expense export. For each recurring charge we estimate the GST
// component assuming the amount is GST-inclusive at 18% (the common SaaS/OTT
// rate) — amount × 18/118. Freelancers/SMBs can hand this to their CA.

function cell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildExpenseCSV(items: RecurringItem[]): string {
  const header = [
    "Merchant",
    "Category",
    "Cadence",
    "Last amount (INR)",
    "Monthly (INR)",
    "Annualised (INR)",
    "Est. GST @18% incl (INR)",
    "Currency",
    "Last charged",
  ];
  const rows = items.map((i) => {
    const annual = Math.round(i.monthlyAmount * 12);
    const gst = Math.round((i.lastAmount * 18) / 118);
    return [
      cell(i.merchant),
      cell(i.category),
      cell(i.cadence),
      i.lastAmount,
      Math.round(i.monthlyAmount),
      annual,
      gst,
      cell(i.fx?.currency ?? "INR"),
      cell(i.lastChargedOn),
    ].join(",");
  });
  return [header.map(cell).join(","), ...rows].join("\n");
}

export function downloadCSV(csv: string, filename = "ooze-expenses.csv"): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
