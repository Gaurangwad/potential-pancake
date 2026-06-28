"use client";

import { useState } from "react";
import { Bell, ChevronRight, ShieldCheck, Lock, Globe, LogOut, Check, X, History } from "lucide-react";
import type { RecurringItem } from "@/lib/types";
import { inr, fmtDate, fmtDateShort, untilLabel } from "@/lib/format";
import { merchantRule, cancelUrlFor } from "@/lib/merchants";
import { fxLabel } from "@/lib/currency";
import { iconForItem, FLAG_META } from "./icons";
import { cn } from "@/lib/cn";

const TONE = {
  leak: "border-leak/30 bg-leak/10 text-leak",
  warn: "border-leak-warn/30 bg-leak-warn/10 text-leak-warn",
  ivy: "border-ivy/30 bg-ivy/10 text-ivy",
} as const;

const CADENCE_LABEL: Record<string, string> = {
  monthly: "/mo",
  quarterly: "/qtr",
  annual: "/yr",
  irregular: "",
};

export function LeakCard({
  item,
  onAction,
  onExit,
  exited,
}: {
  item: RecurringItem;
  onAction: (item: RecurringItem) => void;
  onExit?: (item: RecurringItem, cost: number) => void;
  exited?: boolean;
}) {
  const Icon = iconForItem(item.merchant, item.category);
  // Subscriptions are actionable; everything else is protected (shown calmly).
  const protectedItem = item.category !== "subscription";
  const isInvestment = item.category === "investment";
  const rule = merchantRule(item.merchant);
  const cancelUrl = cancelUrlFor(item.merchant);
  const next = untilLabel(item.nextRenewalOn);

  // Investment-exit inline form. Default to a typical ~1% exit load.
  const [exiting, setExiting] = useState(false);
  const [cost, setCost] = useState(Math.max(0, Math.round(item.lastAmount * 0.01)));

  return (
    <div className={cn("card p-4", exited && "opacity-60")}>
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg border",
            protectedItem ? "border-ivy/25 bg-ivy/10" : "border-[#ece9e1]/10 bg-white/[0.03]",
          )}
        >
          <Icon className={cn("h-5 w-5", protectedItem ? "text-ivy" : "text-[#cfccc3]")} strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="flex items-center gap-1.5 truncate font-600 text-[#f0ede5]">
              {item.merchant}
              {item.fx && <Globe className="h-3.5 w-3.5 shrink-0 text-ivy" strokeWidth={2} />}
            </h4>
            <div className="shrink-0 text-right">
              <span className="font-display text-lg text-[#f4f1e9] tnum">{inr(item.lastAmount)}</span>
              <span className="text-xs text-[#8a877f]">{CADENCE_LABEL[item.cadence]}</span>
            </div>
          </div>

          <p className="mt-0.5 truncate font-mono text-[11px] text-[#75736c]">{item.rawNarration}</p>

          {/* Sunk cost — what you've actually paid this merchant so far */}
          {item.occurrences >= 2 && (
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#9a978f]">
              <History className="h-3 w-3 shrink-0 text-[#8a877f]" strokeWidth={2} />
              <span className="text-[#cfccc3] tnum">{inr(item.observedTotal)}</span> paid since{" "}
              {fmtDateShort(item.firstChargedOn)} · {item.occurrences} charges
            </p>
          )}

          {/* Multi-currency: original foreign amount → INR (charged + live rate) */}
          {item.fx && (
            <p className="mt-1 text-[11px] text-ivy">
              {fxLabel(item.fx)} → {inr(item.lastAmount)} charged
              {item.fx.inrToday ? <> · {inr(item.fx.inrToday)} at today&apos;s rate</> : null}
            </p>
          )}

          {/* Flags */}
          {item.flags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {item.flags.map((f) => {
                const meta = FLAG_META[f];
                const FIcon = meta.icon;
                return (
                  <span
                    key={f}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]",
                      TONE[meta.tone],
                    )}
                  >
                    <FIcon className="h-3 w-3" strokeWidth={2} />
                    {f === "price-creep" && item.firstAmount !== item.lastAmount
                      ? `${inr(item.firstAmount)} → ${inr(item.lastAmount)}`
                      : meta.label}
                  </span>
                );
              })}
            </div>
          )}

          {protectedItem ? (
            <div className="mt-3">
              <div className="flex items-center gap-1.5 text-xs text-ivy">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                {isInvestment
                  ? "Investment — we left this alone."
                  : item.category === "emi"
                    ? "EMI — recurring, but not a cancellable leak."
                    : item.category === "insurance"
                      ? "Insurance — protected, not waste."
                      : "Utility — essential recurring spend."}
              </div>

              {/* Investment exit — log the exit cost (load / tax) against you */}
              {isInvestment && onExit && !exited && (
                <div className="mt-2.5">
                  {!exiting ? (
                    <button
                      onClick={() => setExiting(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#ece9e1]/12 px-2.5 py-1.5 text-xs text-[#b4b0a6] transition hover:bg-white/[0.04]"
                    >
                      <LogOut className="h-3.5 w-3.5" strokeWidth={2} /> Mark as exited
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8a877f]">Exit cost ₹</span>
                      <input
                        type="number"
                        value={cost}
                        min={0}
                        onChange={(e) => setCost(Math.max(0, Number(e.target.value)))}
                        className="w-24 rounded border border-[#ece9e1]/12 bg-black/30 px-2 py-1 text-sm text-[#ece9e1] outline-none focus:border-ivy/40 tnum"
                      />
                      <button
                        onClick={() => {
                          onExit(item, cost);
                          setExiting(false);
                        }}
                        className="grid h-7 w-7 place-items-center rounded border border-ivy/30 bg-ivy/10 text-ivy"
                        aria-label="Confirm exit"
                      >
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setExiting(false)}
                        className="grid h-7 w-7 place-items-center rounded border border-[#ece9e1]/12 text-[#8a877f]"
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  )}
                  <p className="mt-1.5 text-[11px] text-[#75736c]">
                    Exiting stops the SIP and logs the exit load / tax as a real cost to you.
                  </p>
                </div>
              )}
              {isInvestment && exited && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-leak-warn/30 bg-leak-warn/10 px-2 py-1 text-[11px] text-leak-warn">
                  <LogOut className="h-3 w-3" strokeWidth={2} /> Exited — cost added to you
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onAction(item)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ivy/30 bg-ivy/10 px-2.5 py-1.5 text-xs font-600 text-ivy transition hover:bg-ivy/15"
              >
                <Bell className="h-3.5 w-3.5" strokeWidth={2} />
                Remind me before this renews
                <Lock className="h-3 w-3 opacity-60" strokeWidth={2} />
              </button>
              {cancelUrl ? (
                <a
                  href={cancelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-[#ece9e1]/10 px-2.5 py-1.5 text-xs text-[#b4b0a6] transition hover:bg-white/[0.04]"
                >
                  Cancel now
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                </a>
              ) : (
                rule?.cancelHint && (
                  <button
                    onClick={() => onAction(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#ece9e1]/10 px-2.5 py-1.5 text-xs text-[#b4b0a6] transition hover:bg-white/[0.04]"
                  >
                    How to cancel
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )
              )}
              {next && (
                <span className="text-xs text-[#8a877f]">
                  next charge {next}
                  {item.nextRenewalOn ? ` · ${fmtDate(item.nextRenewalOn)}` : ""}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
