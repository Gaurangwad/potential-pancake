"use client";

import { motion } from "framer-motion";

// Subscription Health Score — one gamified number that improves as waste is cut.
function tone(score: number): { ring: string; text: string; label: string } {
  if (score >= 75) return { ring: "#9DB380", text: "text-ivy", label: "Healthy" };
  if (score >= 50) return { ring: "#d9b36a", text: "text-leak-warn", label: "Leaky" };
  return { ring: "#d98a6a", text: "text-leak", label: "Bleeding" };
}

export function HealthScore({ score, size = 132 }: { score: number; size?: number }) {
  const t = tone(score);
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(236,233,225,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-display text-3xl font-600 tnum ${t.text}`}>{score}</span>
        <span className="text-[11px] uppercase tracking-wider text-[#8a877f]">{t.label}</span>
      </div>
    </div>
  );
}
