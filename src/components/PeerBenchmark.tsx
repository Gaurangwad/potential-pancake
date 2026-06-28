"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import type { AuditResult } from "@/lib/types";
import { subscriptionPercentile, streamingPercentile } from "@/lib/benchmark";

const STREAMING = new Set([
  "Netflix", "JioHotstar", "Amazon Prime", "SonyLIV", "ZEE5",
  "Spotify", "YouTube Premium", "Sun NXT", "aha", "Discovery+", "Crunchyroll",
]);

export function PeerBenchmark({ audit }: { audit: AuditResult }) {
  const streamingMonthly = useMemo(
    () =>
      audit.items
        .filter((i) => STREAMING.has(i.merchant))
        .reduce((s, i) => s + i.monthlyAmount, 0),
    [audit.items],
  );

  if (audit.monthlyBurn <= 0) return null;
  const subPct = subscriptionPercentile(audit.monthlyBurn);
  const streamPct = streamingMonthly > 0 ? streamingPercentile(streamingMonthly) : null;

  return (
    <section className="mt-8">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-600 uppercase tracking-wide text-[#cfccc3]">
        <Users className="h-4 w-4" strokeWidth={2} /> How you compare
      </h3>
      <div className="card space-y-4 p-5">
        <Bar
          label="On subscriptions overall, you spend more than"
          pct={subPct}
        />
        {streamPct !== null && (
          <Bar label="On streaming specifically, more than" pct={streamPct} />
        )}
        <p className="text-[11px] text-[#75736c]">
          Based on a reference model of typical Indian subscription spending — directional, not a
          live community average.
        </p>
      </div>
    </section>
  );
}

function Bar({ label, pct }: { label: string; pct: number }) {
  const high = pct >= 70;
  return (
    <div>
      <p className="text-sm text-[#e7e3da]">
        {label}{" "}
        <span className={`font-display text-base font-600 tnum ${high ? "text-leak" : "text-ivy"}`}>
          {pct}%
        </span>{" "}
        of people.
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${high ? "bg-leak" : "bg-ivy"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
