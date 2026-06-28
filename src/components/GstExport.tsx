"use client";

import { FileSpreadsheet, Lock } from "lucide-react";
import type { AuditResult, RecurringItem } from "@/lib/types";
import { buildExpenseCSV, downloadCSV } from "@/lib/csv";
import { useAuth } from "./auth/AuthProvider";

/** CA-ready expense export. Free to see the audit; export is a premium action. */
export function GstExport({ audit }: { audit: AuditResult }) {
  const { premium, gate } = useAuth();

  function onClick() {
    if (premium) {
      downloadCSV(buildExpenseCSV(audit.items));
      return;
    }
    // Route non-premium users through the standard sign-in → pay flow.
    gate({ merchant: "GST / expense export", lastAmount: 0 } as RecurringItem, {
      wasteMonthly: audit.wasteMonthly,
      annualSavings: audit.potentialAnnualSavings,
    });
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#ece9e1]/12 px-3 py-2 text-xs font-600 text-[#cfccc3] transition hover:bg-white/[0.04]"
    >
      <FileSpreadsheet className="h-3.5 w-3.5 text-ivy" strokeWidth={2} />
      Export for CA (CSV)
      {!premium && <Lock className="h-3 w-3 opacity-60" strokeWidth={2} />}
    </button>
  );
}
