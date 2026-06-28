"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ShieldCheck, Bell, CalendarClock, FileSpreadsheet, Lock, Loader2 } from "lucide-react";
import type { RecurringItem } from "@/lib/types";
import { inr } from "@/lib/format";
import { PRICING, type PlanId } from "@/lib/constants";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * The wall sits on ACTING, not seeing. Price anchored against the user's own
 * detected waste. Runs real Razorpay test checkout when keys are set, else a
 * clearly-marked simulated payment so the flow stays testable. No dark
 * patterns: real numbers, real value only.
 */
export function Paywall({
  open,
  trigger,
  wasteMonthly,
  annualSavings,
  onClose,
  onPaid,
}: {
  open: boolean;
  trigger: RecurringItem | null;
  wasteMonthly: number;
  annualSavings: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [plan, setPlan] = useState<PlanId>("yearly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState<boolean | null>(null);
  const anchor = Math.max(wasteMonthly, 1);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/razorpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const d = await res.json();
      if (d.alreadyPremium) return onPaid();
      if (!res.ok) {
        setError(d.error || "Couldn't start checkout.");
        return;
      }

      if (d.mock) {
        // Test build: no Razorpay keys — simulate a verified payment.
        setMockMode(true);
        const vr = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mock: true, plan: d.plan }),
        });
        if (vr.ok) return onPaid();
        setError("Simulated payment failed.");
        return;
      }

      // Real Razorpay test checkout.
      setMockMode(false);
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        setError("Couldn't load the payment window. Check your connection.");
        return;
      }
      const rzp = new window.Razorpay({
        key: d.keyId,
        order_id: d.orderId,
        amount: d.amount,
        currency: d.currency,
        name: "Ooze",
        description: `Premium · ${PRICING[plan].label}`,
        theme: { color: "#9DB380" },
        handler: async (resp: Record<string, string>) => {
          const vr = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              plan: d.plan,
            }),
          });
          if (vr.ok) onPaid();
          else setError("Payment verification failed.");
        },
      });
      rzp.open();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-end sm:place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
          <motion.div
            className="card relative z-10 w-full max-w-md p-6 sm:rounded-2xl"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <button onClick={onClose} className="absolute right-4 top-4 text-[#8a877f] hover:text-[#ece9e1]">
              <X className="h-5 w-5" strokeWidth={2} />
            </button>

            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-leak-warn/30 bg-leak-warn/10 px-2 py-0.5 text-[11px] text-leak-warn">
              <Lock className="h-3 w-3" strokeWidth={2} /> Test mode — no real charge
            </div>

            <h3 className="mt-3 font-display text-2xl text-[#f4f1e9]">Stop the bleeding.</h3>

            <p className="mt-2 text-sm text-[#b4b0a6]">
              Premium is <span className="font-600 text-[#ece9e1]">₹{PRICING.monthly.amount}/mo</span>. You&apos;re losing{" "}
              <span className="font-600 text-leak tnum">{inr(anchor)}/mo</span> right now
              {trigger ? <> — starting with {trigger.merchant}.</> : "."}
            </p>
            {annualSavings > 0 && (
              <p className="mt-1.5 text-sm text-[#b4b0a6]">
                We&apos;ve spotted{" "}
                <span className="font-600 text-ivy tnum">{inr(annualSavings)}</span> you could recover this year.
              </p>
            )}

            <ul className="mt-5 space-y-2.5 text-sm text-[#cfccc3]">
              <Benefit icon={<Bell className="h-4 w-4 text-ivy" />}>Renewal reminders + WhatsApp alerts before every charge</Benefit>
              <Benefit icon={<CalendarClock className="h-4 w-4 text-ivy" />}>Ongoing monthly tracking — watch your Health Score climb</Benefit>
              <Benefit icon={<Check className="h-4 w-4 text-ivy" />}>Cancel-assist guides + price-creep alerts</Benefit>
              <Benefit icon={<FileSpreadsheet className="h-4 w-4 text-ivy" />}>GST / business-expense tagging &amp; CA-ready export</Benefit>
            </ul>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <PlanButton
                title={PRICING.yearly.label}
                price={`₹${PRICING.yearly.amount}`}
                sub={PRICING.yearly.sub}
                selected={plan === "yearly"}
                onClick={() => setPlan("yearly")}
              />
              <PlanButton
                title={PRICING.monthly.label}
                price={`₹${PRICING.monthly.amount}`}
                sub={PRICING.monthly.sub}
                selected={plan === "monthly"}
                onClick={() => setPlan("monthly")}
              />
            </div>

            <button
              onClick={pay}
              disabled={busy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ivy px-5 py-3 text-sm font-600 text-[#10130c] transition hover:bg-ivy-soft disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Continue · ₹{PRICING[plan].amount}</>
              )}
            </button>

            <button
              onClick={() => setPlan("oneTime")}
              className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs transition ${
                plan === "oneTime" ? "border-ivy/40 text-ivy" : "border-[#ece9e1]/10 text-[#8a877f] hover:text-[#cfccc3]"
              }`}
            >
              Or unlock a one-time deep audit · ₹{PRICING.oneTime.amount}
            </button>

            {error && <p className="mt-3 text-sm text-leak">{error}</p>}
            {mockMode && (
              <p className="mt-2 text-[11px] text-[#75736c]">
                Simulated payment (no Razorpay keys set). Add test keys to use the real checkout.
              </p>
            )}

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#75736c]">
              <ShieldCheck className="h-3.5 w-3.5 text-ivy" strokeWidth={2} />
              Razorpay-secured. Recurring runs on RBI-compliant UPI AutoPay.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Benefit({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function PlanButton({
  title,
  price,
  sub,
  selected,
  onClick,
}: {
  title: string;
  price: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        selected
          ? "rounded-xl border-2 border-ivy bg-ivy/10 px-4 py-3 text-left text-[#ece9e1]"
          : "rounded-xl border border-[#ece9e1]/15 bg-white/[0.03] px-4 py-3 text-left text-[#ece9e1] hover:border-[#ece9e1]/25"
      }
    >
      <div className="text-xs opacity-70">{title}</div>
      <div className="font-display text-xl font-600 tnum">{price}</div>
      <div className="text-[11px] opacity-70">{sub}</div>
    </button>
  );
}
