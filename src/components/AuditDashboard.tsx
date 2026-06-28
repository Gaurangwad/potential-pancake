"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, Info, Sparkles, RotateCcw, PiggyBank, LogOut, Globe } from "lucide-react";
import type { AuditResult, RecurringItem } from "@/lib/types";
import { inr } from "@/lib/format";
import { HealthScore } from "./HealthScore";
import { LeakCard } from "./LeakCard";
import { TrustBadge } from "./TrustBadge";
import { SavingsAnalysis } from "./SavingsAnalysis";
import { DuesAndOverhead } from "./DuesAndOverhead";
import { QuickStats } from "./QuickStats";
import { CategoryDonut } from "./CategoryDonut";
import { PeerBenchmark } from "./PeerBenchmark";
import { TaxAwareness } from "./TaxAwareness";
import { RemindersExport } from "./RemindersExport";
import { ShareCard } from "./ShareCard";
import { GstExport } from "./GstExport";
import { Logo } from "./Logo";
import { useAuth } from "./auth/AuthProvider";

export function AuditDashboard({ audit, onRestart }: { audit: AuditResult; onRestart: () => void }) {
  const { gate } = useAuth();
  const [fixed, setFixed] = useState<Set<string>>(new Set());
  const [exits, setExits] = useState<Record<string, number>>({});
  const totalExitCost = Object.values(exits).reduce((a, b) => a + b, 0);
  const onExit = (item: RecurringItem, cost: number) =>
    setExits((s) => ({ ...s, [item.id]: cost }));

  // A tracking/reminder action is the paywall trigger — gate runs the full
  // sign-in → premium-check → pay flow, anchored to this audit's own numbers.
  const onAction = (item: RecurringItem) => {
    setFixed((s) => new Set(s).add(item.id));
    gate(item, { wasteMonthly: audit.wasteMonthly, annualSavings: audit.potentialAnnualSavings });
  };

  // Subscriptions are the cancellable, actionable spend. Everything else
  // (SIP / EMI / insurance / utility / rent) is protected and shown as such.
  const leaks = useMemo(
    () => audit.items.filter((i) => i.category === "subscription"),
    [audit.items],
  );
  const protectedItems = useMemo(
    () => audit.items.filter((i) => i.category !== "subscription"),
    [audit.items],
  );

  return (
    <div className="mx-auto max-w-2xl px-5 pb-24">
      {/* Summary header */}
      <div className="card overflow-hidden">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8a877f]">Monthly subscription burn</p>
            <p className="font-display text-4xl font-700 text-[#f4f1e9] tnum">{inr(audit.monthlyBurn)}</p>
            <p className="mt-1 text-sm text-[#9a978f]">
              {inr(audit.annualBurn)} a year · across {leaks.length} subscription
              {leaks.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <HealthScore score={audit.healthScore} />
            <span className="mt-1 text-[11px] text-[#8a877f]">Subscription Health</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-[#ece9e1]/[0.06] sm:grid-cols-4">
          <Stat label="Forgotten" value={inr(audit.forgottenMonthly)} tone="leak" sub="/mo" />
          <Stat label="Cancellable waste" value={inr(audit.wasteMonthly)} tone="leak" sub="/mo" />
          <Stat label="Investments (SIP)" value={inr(audit.investmentMonthly)} tone="ivy" sub="protected" />
          <Stat label="EMIs" value={inr(audit.emiMonthly)} tone="muted" sub="/mo" />
        </div>
      </div>

      {/* Multi-currency: international spend auto-converted to INR (live rates) */}
      {audit.internationalMonthly > 0 && (
        <div className="mt-4 rounded-xl border border-ivy/20 bg-ivy/[0.05] px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-[#e7e3da]">
            <Globe className="h-4 w-4 shrink-0 text-ivy" strokeWidth={2} />
            <span>
              <span className="font-display text-base font-600 text-ivy tnum">
                {inr(audit.internationalMonthly)}/mo
              </span>{" "}
              of this is international spend — auto-detected and converted to ₹.
            </span>
          </p>
          <p className="mt-1 pl-6 text-[11px] text-[#75736c]">
            {audit.fxLive ? "Live FX rates" : "Reference FX rates"}
            {audit.fxAsOf ? ` · as of ${audit.fxAsOf}` : ""}
          </p>
        </div>
      )}

      {/* Concrete, specific savings — the number that justifies the price */}
      {audit.potentialAnnualSavings > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-leak/25 bg-leak/[0.07] px-4 py-3.5">
          <PiggyBank className="h-5 w-5 shrink-0 text-leak" strokeWidth={2} />
          <p className="text-sm text-[#e7e3da]">
            You could recover{" "}
            <span className="font-display text-lg font-600 text-leak tnum">
              {inr(audit.potentialAnnualSavings)}
            </span>{" "}
            this year by cutting waste and switching monthly plans to annual.
          </p>
        </div>
      )}

      {/* Endowed progress — started, not finished, pulls them to act */}
      {leaks.length > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-ivy/20 bg-ivy/[0.06] px-4 py-3">
          <Sparkles className="h-4 w-4 shrink-0 text-ivy" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-sm text-[#e7e3da]">
              Your cleanup: <span className="font-600">{fixed.size} of {leaks.length}</span> leaks handled
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-ivy transition-all"
                style={{ width: `${Math.max(6, (fixed.size / leaks.length) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {audit.usedAI && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-[#8a877f]">
          <Sparkles className="h-3 w-3 text-ivy" strokeWidth={2} /> Merchant names refined with on-server AI from narrations only.
        </p>
      )}

      {/* Quick actions: share the result, export for CA */}
      <div className="mt-4 flex flex-wrap gap-2">
        <ShareCard
          forgottenMonthly={audit.forgottenMonthly}
          annualSavings={audit.potentialAnnualSavings}
        />
        <GstExport audit={audit} />
      </div>

      {/* Leaks first — the value, fully visible, no wall on seeing */}
      <section className="mt-7">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-600 uppercase tracking-wide text-leak">
          <AlertTriangle className="h-4 w-4" strokeWidth={2} /> Leaks &amp; subscriptions ({leaks.length})
        </h3>
        <div className="space-y-3">
          {leaks.map((item) => (
            <LeakCard key={item.id} item={item} onAction={onAction} />
          ))}
          {leaks.length === 0 && (
            <p className="card p-5 text-sm text-[#9a978f]">
              No cancellable subscription waste detected in this window. Clean sheet.
            </p>
          )}
        </div>
      </section>

      {/* Protected — visibly NOT waste. This is the trust moat. */}
      {protectedItems.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-600 uppercase tracking-wide text-ivy">
            <ShieldCheck className="h-4 w-4" strokeWidth={2} /> Protected — we left these alone ({protectedItems.length})
          </h3>
          <div className="space-y-3">
            {protectedItems.map((item) => (
              <LeakCard
                key={item.id}
                item={item}
                onAction={onAction}
                onExit={onExit}
                exited={!!exits[item.id]}
              />
            ))}
          </div>
          {totalExitCost > 0 && (
            <p className="mt-3 flex items-center gap-2 rounded-lg border border-leak-warn/25 bg-leak-warn/[0.06] px-3 py-2 text-xs text-leak-warn">
              <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Investment exits logged · <span className="font-600 tnum">{inr(totalExitCost)}</span> added as a real cost to you.
            </p>
          )}
        </section>
      )}

      {/* Spend-by-category donut */}
      <CategoryDonut items={audit.items} />

      {/* How you compare (reference benchmark) */}
      <PeerBenchmark audit={audit} />

      {/* 80C tax-saving utilisation */}
      <TaxAwareness audit={audit} />

      {/* Loans & dues + overhead/unaccounted (statement + optional email scan) */}
      <DuesAndOverhead audit={audit} />

      {/* Calendar / Notion / WhatsApp reminders for renewals + dues */}
      <RemindersExport audit={audit} />

      {/* Average saving + increase-over-time analysis with a real graph */}
      <SavingsAnalysis audit={audit} />

      {/* At-a-glance: next salary, spend vs average, nearest auto-debit */}
      <QuickStats stats={audit.quickStats} />

      {audit.notes.length > 0 && (
        <div className="mt-6 space-y-2">
          {audit.notes.map((n, i) => (
            <p key={i} className="flex items-start gap-2 text-xs text-[#8a877f]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8a877f]" strokeWidth={2} />
              {n}
            </p>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-4">
        <TrustBadge />
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 text-sm text-[#9a978f] underline-offset-4 hover:text-[#ece9e1] hover:underline"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} /> Audit another statement
        </button>
      </div>

      <OozeFooter />
    </div>
  );
}

/** Footer one-liner — quiet, on-brand. */
export function OozeFooter() {
  return (
    <footer className="mt-12 border-t hairline pt-6 text-center">
      <p className="flex items-center justify-center gap-2 font-display text-sm text-[#8a877f]">
        <Logo className="scale-90" />
      </p>
      <p className="mt-3 text-xs text-[#75736c]">
        Every rupee shows up here before it oozes out.
      </p>
    </footer>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "leak" | "ivy" | "muted";
}) {
  const color = tone === "leak" ? "text-leak" : tone === "ivy" ? "text-ivy" : "text-[#cfccc3]";
  return (
    <div className="bg-paper px-4 py-3.5">
      <p className="text-[11px] uppercase tracking-wide text-[#8a877f]">{label}</p>
      <p className={`mt-0.5 font-display text-xl font-600 tnum ${color}`}>{value}</p>
      <p className="text-[11px] text-[#75736c]">{sub}</p>
    </div>
  );
}
