"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Smartphone, ShieldCheck, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { DEMO_PHONE } from "@/lib/constants";

type Step = "phone" | "otp";

export function AuthModal({
  open,
  onClose,
  onAuthed,
}: {
  open: boolean;
  onClose: () => void;
  onAuthed: () => void;
}) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  function reset() {
    setStep("phone");
    setOtp("");
    setError(null);
    setDevCode(null);
    setBusy(false);
  }

  async function requestOtp() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Couldn't send the code.");
        return;
      }
      setDevCode(d.devCode ?? null);
      setDemo(!!d.demo);
      setStep("otp");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Verification failed.");
        return;
      }
      reset();
      onAuthed();
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
            className="card relative z-10 w-full max-w-sm p-6 sm:rounded-2xl"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <button onClick={onClose} className="absolute right-4 top-4 text-[#8a877f] hover:text-[#ece9e1]">
              <X className="h-5 w-5" strokeWidth={2} />
            </button>

            <div className="grid h-11 w-11 place-items-center rounded-xl border border-ivy/25 bg-ivy/10">
              {step === "phone" ? (
                <Smartphone className="h-5 w-5 text-ivy" strokeWidth={2} />
              ) : (
                <KeyRound className="h-5 w-5 text-ivy" strokeWidth={2} />
              )}
            </div>

            <h3 className="mt-4 font-display text-2xl text-[#f4f1e9]">
              {step === "phone" ? "Save your audit" : "Enter the code"}
            </h3>
            <p className="mt-1.5 text-sm text-[#b4b0a6]">
              {step === "phone"
                ? "Sign in with your mobile to keep this audit and turn on tracking."
                : `We sent a 6-digit code to +91 ${phone}.`}
            </p>

            {step === "phone" ? (
              <>
                <div className="mt-5 flex items-center gap-2 rounded-lg border border-[#ece9e1]/12 bg-black/30 px-3 py-2.5 focus-within:border-ivy/40">
                  <span className="text-sm text-[#8a877f]">+91</span>
                  <input
                    autoFocus
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={(e) => e.key === "Enter" && phone.length === 10 && requestOtp()}
                    placeholder="98XXXXXXXX"
                    className="w-full bg-transparent text-base text-[#ece9e1] outline-none placeholder:text-[#5a584f]"
                  />
                </div>
                <button
                  disabled={phone.length !== 10 || busy}
                  onClick={requestOtp}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ivy px-5 py-3 text-sm font-600 text-[#10130c] transition hover:bg-ivy-soft disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send code <ArrowRight className="h-4 w-4" strokeWidth={2.2} /></>}
                </button>
                <p className="mt-3 rounded-lg border border-ivy/20 bg-ivy/[0.05] px-3 py-2 text-[11px] text-[#9a978f]">
                  Testing? Use the free demo number{" "}
                  <button
                    onClick={() => setPhone(DEMO_PHONE)}
                    className="font-600 text-ivy underline-offset-2 hover:underline"
                  >
                    {DEMO_PHONE}
                  </button>{" "}
                  — full premium, no payment.
                </p>
              </>
            ) : (
              <>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && otp.length >= 4 && verify()}
                  placeholder="••••••"
                  className="mt-5 w-full rounded-lg border border-[#ece9e1]/12 bg-black/30 px-3 py-2.5 text-center text-2xl tracking-[0.4em] text-[#ece9e1] outline-none placeholder:text-[#3a3933] focus:border-ivy/40 tnum"
                />
                {devCode && (
                  <p className="mt-2.5 rounded-lg border border-leak-warn/30 bg-leak-warn/[0.08] px-3 py-2 text-[11px] text-leak-warn">
                    Test mode (no SMS provider set): your code is{" "}
                    <button onClick={() => setOtp(devCode)} className="font-mono font-600 underline-offset-2 hover:underline">
                      {devCode}
                    </button>
                    {demo && " — this is the free demo number."}
                  </p>
                )}
                <button
                  disabled={otp.length < 4 || busy}
                  onClick={verify}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ivy px-5 py-3 text-sm font-600 text-[#10130c] transition hover:bg-ivy-soft disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & continue"}
                </button>
                <button onClick={reset} className="mt-2 w-full text-xs text-[#8a877f] hover:text-[#ece9e1]">
                  Use a different number
                </button>
              </>
            )}

            {error && <p className="mt-3 text-sm text-leak">{error}</p>}

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#75736c]">
              <ShieldCheck className="h-3.5 w-3.5 text-ivy" strokeWidth={2} />
              We store only your number and derived audit figures — never your statement.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
