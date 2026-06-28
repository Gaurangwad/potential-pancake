"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Repeat, TrendingUp, Calculator } from "lucide-react";

// Loading that builds anticipation rather than just spinning.
const STEPS = [
  { icon: FileText, label: "Reading your statement…" },
  { icon: Repeat, label: "Spotting recurring charges…" },
  { icon: TrendingUp, label: "Checking for price hikes & duplicates…" },
  { icon: Calculator, label: "Adding up your monthly burn…" },
];

export function LoadingStatus() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1300);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-20 text-center">
      <div className="relative h-12 w-12">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-ivy/20 border-t-ivy" />
      </div>
      <div className="w-full space-y-2.5">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: done ? 0.5 : active ? 1 : 0.3 }}
              className="flex items-center gap-3 text-sm"
            >
              <Icon
                className={
                  active ? "h-4 w-4 text-ivy" : done ? "h-4 w-4 text-ivy/50" : "h-4 w-4 text-[#5a584f]"
                }
                strokeWidth={2}
              />
              <span className={active ? "text-[#ece9e1]" : "text-[#7d7b73]"}>{s.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
