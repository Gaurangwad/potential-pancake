"use client";

import { useEffect, useState } from "react";
import { TrendingUp, LineChart, Lock } from "lucide-react";
import type { AuditResult } from "@/lib/types";
import type { AuditSnapshot } from "@/lib/server/store";
import { analyseSavings } from "@/lib/savings";
import { inr } from "@/lib/format";
import { useAuth } from "./auth/AuthProvider";
import { SavingsChart } from "./SavingsChart";

/**
 * Average saving + increase-in-saving analysis with a real graph. The chart is
 * driven by stored re-audit snapshots, so it reflects actual change, not a
 * mock curve. Signed-in only (it's the "track over time" value).
 */
export function SavingsAnalysis({ audit }: { audit: AuditResult }) {
  const { authenticated, loading, openSignIn } = useAuth();
  const [history, setHistory] = useState<AuditSnapshot[] | null>(null);

  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/audit/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyBurn: audit.monthlyBurn,
          wasteMonthly: audit.wasteMonthly,
          potentialAnnualSavings: audit.potentialAnnualSavings,
          healthScore: audit.healthScore,
        }),
      });
      if (!res.ok || cancelled) return;
      const d = await res.json();
      setHistory(d.history as AuditSnapshot[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [authenticated, audit]);

  if (loading) return null;

  if (!authenticated) {
    return (
      <section className="mt-8">
        <SectionTitle />
        <div className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#9a978f]">
            Sign in to track your savings month over month and watch the number grow.
          </p>
          <button
            onClick={openSignIn}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ivy/30 bg-ivy/10 px-3 py-2 text-xs font-600 text-ivy"
          >
            <Lock className="h-3.5 w-3.5" strokeWidth={2} /> Sign in to track
          </button>
        </div>
      </section>
    );
  }

  // Loading skeleton while the snapshot history is fetched.
  if (history === null) {
    return (
      <section className="mt-8">
        <SectionTitle />
        <div className="card p-5">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-lg skeleton animate-shimmer" />
            ))}
          </div>
          <div className="mt-5 h-28 rounded-lg skeleton animate-shimmer" />
        </div>
      </section>
    );
  }

  const a = analyseSavings(history);

  return (
    <section className="mt-8">
      <SectionTitle />
      <div className="card p-5">
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Saving now" value={inr(a?.savingNowMonthly ?? 0)} sub="/mo" big />
          <Metric label="Avg monthly saving" value={inr(a?.avgMonthlySaving ?? 0)} sub="/mo" />
          <Metric label="Saving growth" value={`+${inr(a?.increaseMonthly ?? 0)}`} sub="/mo" tone="ivy" />
        </div>

        {a?.hasTrend ? (
          <div className="mt-5">
            <SavingsChart points={a.points} />
            <p className="mt-3 text-xs text-[#8a877f]">
              You&apos;re saving <span className="text-ivy">{inr(a.savingNowAnnual)}/year</span> vs your
              first audit — up <span className="text-ivy">{inr(a.increaseMonthly)}/mo</span> over the period.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#9a978f]">
            This is your baseline. Re-audit next month (upload or auto-fetch) and this graph will
            show your savings climbing.
          </p>
        )}
      </div>
    </section>
  );
}

function SectionTitle() {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-600 uppercase tracking-wide text-ivy">
      <LineChart className="h-4 w-4" strokeWidth={2} /> Savings analysis
    </h3>
  );
}

function Metric({
  label,
  value,
  sub,
  big,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  big?: boolean;
  tone?: "ivy";
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-[#8a877f]">{label}</p>
      <p
        className={`mt-0.5 font-display font-600 tnum ${big ? "text-2xl" : "text-xl"} ${
          tone === "ivy" ? "text-ivy" : "text-[#f4f1e9]"
        }`}
      >
        {value}
        <span className="ml-0.5 text-xs text-[#75736c]">{sub}</span>
      </p>
    </div>
  );
}
