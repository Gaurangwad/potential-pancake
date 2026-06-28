"use client";

import { inr } from "@/lib/format";

/**
 * A small, dependency-free SVG area+line chart of monthly saving over re-audits.
 * Plots the REAL saving at each snapshot (baseline waste − that month's waste),
 * which is what grows as the user cuts subscriptions. Responsive (viewBox).
 */
export function SavingsChart({
  points,
}: {
  points: { label: string; saving: number }[];
}) {
  const W = 320;
  const H = 120;
  const padX = 8;
  const padY = 12;
  const max = Math.max(1, ...points.map((p) => p.saving));
  const n = points.length;

  const x = (i: number) => padX + (i * (W - 2 * padX)) / Math.max(1, n - 1);
  const y = (v: number) => H - padY - (v / max) * (H - 2 * padY);

  const line = points.map((p, i) => `${x(i)},${y(p.saving)}`).join(" ");
  const area = `${padX},${H - padY} ${line} ${x(n - 1)},${H - padY}`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="oozeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9DB380" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#9DB380" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#oozeFill)" />
        <polyline points={line} fill="none" stroke="#9DB380" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.saving)} r="2.5" fill="#9DB380" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1 font-mono text-[10px] text-[#75736c]">
        {points.map((p, i) => (
          <span key={i} className="tnum">
            {p.label}
          </span>
        ))}
      </div>
      <div className="mt-1 flex justify-between px-1 text-[10px] text-[#8a877f]">
        <span>start</span>
        <span className="text-ivy tnum">saving {inr(points[points.length - 1]?.saving ?? 0)}/mo</span>
      </div>
    </div>
  );
}
