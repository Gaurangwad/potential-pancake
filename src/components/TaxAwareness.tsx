"use client";

import { Landmark } from "lucide-react";
import type { AuditResult } from "@/lib/types";
import { inr } from "@/lib/format";

const LIMIT_80C = 150_000;

/** Surfaces 80C utilisation from detected ELSS/PPF/NPS/insurance auto-debits. */
export function TaxAwareness({ audit }: { audit: AuditResult }) {
  if (audit.eightyCAnnual <= 0) return null;
  const used = Math.min(audit.eightyCAnnual, LIMIT_80C);
  const headroom = Math.max(0, LIMIT_80C - audit.eightyCAnnual);
  const pct = Math.round((used / LIMIT_80C) * 100);

  return (
    <section className="mt-8">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-600 uppercase tracking-wide text-ivy">
        <Landmark className="h-4 w-4" strokeWidth={2} /> Tax-saving (80C)
      </h3>
      <div className="card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-[#e7e3da]">
            From your detected ELSS / PPF / insurance auto-debits, you&apos;ve put{" "}
            <span className="font-display text-base font-600 text-ivy tnum">{inr(audit.eightyCAnnual)}</span>{" "}
            toward 80C this year.
          </p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-ivy" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-[#9a978f]">{inr(used)} of {inr(LIMIT_80C)} used</span>
          {headroom > 0 ? (
            <span className="text-ivy">
              {inr(headroom)} headroom — could save up to {inr(Math.round(headroom * 0.3))} in tax
            </span>
          ) : (
            <span className="text-ivy">80C maxed out — nice.</span>
          )}
        </div>
        <p className="mt-2 text-[11px] text-[#75736c]">
          Estimate from recurring debits only; one-off ELSS/PPF top-ups aren&apos;t counted. Not tax advice.
        </p>
      </div>
    </section>
  );
}
