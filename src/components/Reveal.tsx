"use client";

import { motion } from "framer-motion";
import { ArrowDown, Info, ChevronDown } from "lucide-react";
import type { AuditResult } from "@/lib/types";
import { inr } from "@/lib/format";
import { CountUp } from "./CountUp";
import { TrustBadge } from "./TrustBadge";

/**
 * THE REVEAL — one hero number, one screen. The dopamine / loss-aversion
 * moment the whole product is built around. Everything before is setup.
 */
export function Reveal({ audit, onContinue }: { audit: AuditResult; onContinue: () => void }) {
  const forgotten = audit.forgottenMonthly;
  const subsCount = audit.items.filter((i) => i.category === "subscription").length;
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 py-16 text-center">
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-sm uppercase tracking-[0.2em] text-[#8a877f]"
      >
        You&apos;re spending
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="my-3"
      >
        <CountUp
          value={audit.monthlyBurn}
          className="font-display text-6xl font-700 tracking-tight text-ivy tnum sm:text-7xl"
        />
        <span className="mt-1 block text-base text-[#9a978f]">on subscriptions every month</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="mt-6 rounded-2xl border border-leak/25 bg-leak/[0.07] px-6 py-5"
      >
        <p className="text-lg text-[#e7e3da]">
          <span className="font-display text-2xl font-600 text-leak tnum">{inr(forgotten)}</span> of that
          you&apos;ve probably <span className="text-leak">forgotten about</span>.
        </p>
        <p className="mt-1.5 text-sm text-[#9a978f]">
          That&apos;s {inr(forgotten * 12)} a year, leaking quietly.
        </p>
      </motion.div>

      <motion.details
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="group mt-5 w-full max-w-md text-left"
      >
        <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 text-xs text-[#8a877f] transition hover:text-[#cfccc3]">
          <Info className="h-3.5 w-3.5" strokeWidth={2} />
          How we calculated this
          <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" strokeWidth={2} />
        </summary>
        <div className="mt-3 rounded-xl border border-[#ece9e1]/10 bg-white/[0.02] p-4 text-xs leading-relaxed text-[#9a978f]">
          We read <span className="text-[#cfccc3] tnum">{audit.txnCount}</span> transactions and found{" "}
          <span className="text-[#cfccc3] tnum">{subsCount}</span> recurring subscriptions. Each is
          normalised to a per-month figure and summed — that&apos;s your{" "}
          <span className="text-ivy">{inr(audit.monthlyBurn)}/mo</span>. SIPs, EMIs, insurance and
          utilities are recognised and <span className="text-[#cfccc3]">excluded</span> — we&apos;d
          never call your investments waste. &quot;Forgotten&quot; is the slice on auto-debit you
          likely don&apos;t actively use.
        </div>
      </motion.details>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-8 flex flex-col items-center gap-4"
      >
        <button
          onClick={onContinue}
          className="group inline-flex items-center gap-2 rounded-xl border border-[#ece9e1]/15 bg-white/[0.04] px-5 py-3 text-sm font-600 text-[#ece9e1] transition hover:bg-white/[0.07]"
        >
          See every leak, line by line
          <ArrowDown className="h-4 w-4 transition group-hover:translate-y-0.5" strokeWidth={2} />
        </button>
        <TrustBadge withLink={false} />
      </motion.div>
    </div>
  );
}
