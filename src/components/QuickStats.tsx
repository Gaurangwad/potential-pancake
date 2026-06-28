"use client";

import { Wallet, TrendingDown, TrendingUp, CalendarClock } from "lucide-react";
import type { QuickStats as QuickStatsType } from "@/lib/types";
import { inr, fmtDateShort, untilLabel } from "@/lib/format";

/** Compact at-a-glance tiles shown at the end of the audit. */
export function QuickStats({ stats }: { stats: QuickStatsType }) {
  const below = stats.spendDelta <= 0;
  return (
    <section className="mt-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Salary in X days */}
        <Tile
          icon={<Wallet className="h-4 w-4 text-ivy" strokeWidth={2} />}
          label="Next salary"
          value={
            stats.salary
              ? stats.salary.inDays === 0
                ? "Today"
                : `in ${stats.salary.inDays} day${stats.salary.inDays === 1 ? "" : "s"}`
              : "—"
          }
          sub={
            stats.salary
              ? `${inr(stats.salary.amount)} · ${fmtDateShort(stats.salary.onDate)}`
              : "No salary credit detected"
          }
        />

        {/* Average spend with +/- */}
        <Tile
          icon={
            below ? (
              <TrendingDown className="h-4 w-4 text-ivy" strokeWidth={2} />
            ) : (
              <TrendingUp className="h-4 w-4 text-leak" strokeWidth={2} />
            )
          }
          label="This month vs avg"
          value={inr(stats.currentMonthSpend)}
          sub={
            <span className={below ? "text-ivy" : "text-leak"}>
              {inr(Math.abs(stats.spendDelta))} {below ? "below" : "above"} avg ({inr(stats.avgMonthlySpend)})
            </span>
          }
        />

        {/* Nearest upcoming autopay */}
        <Tile
          icon={<CalendarClock className="h-4 w-4 text-leak-warn" strokeWidth={2} />}
          label="Next auto-debit"
          value={
            stats.nextAutopay
              ? `${untilLabel(stats.nextAutopay.onDate) ?? "soon"}`
              : "—"
          }
          sub={
            stats.nextAutopay
              ? `${stats.nextAutopay.merchant} · ${inr(stats.nextAutopay.amount)}${
                  stats.nextAutopay.category !== "subscription"
                    ? ` · ${stats.nextAutopay.category} (protected)`
                    : ""
                }`
              : "No auto-debits upcoming"
          }
        />
      </div>
    </section>
  );
}

function Tile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[11px] uppercase tracking-wide text-[#8a877f]">{label}</span>
      </div>
      <p className="mt-2 font-display text-xl font-600 text-[#f4f1e9] tnum">{value}</p>
      <p className="mt-0.5 truncate text-xs text-[#9a978f]">{sub}</p>
    </div>
  );
}
