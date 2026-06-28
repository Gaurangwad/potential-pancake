"use client";

import { useMemo } from "react";
import type { RecurringItem, Category } from "@/lib/types";
import { inr } from "@/lib/format";

const COLORS: Record<Category, string> = {
  subscription: "#9DB380",
  utility: "#6f8159",
  emi: "#d9b36a",
  investment: "#7fa7c9",
  insurance: "#b08ed0",
  rent: "#c97f9c",
  unknown: "#8a877f",
};

const LABEL: Record<Category, string> = {
  subscription: "Subscriptions",
  utility: "Utilities",
  emi: "EMIs",
  investment: "Investments",
  insurance: "Insurance",
  rent: "Rent",
  unknown: "Unaccounted",
};

export function CategoryDonut({ items }: { items: RecurringItem[] }) {
  const { slices, total } = useMemo(() => {
    const map = new Map<Category, number>();
    for (const i of items) map.set(i.category, (map.get(i.category) ?? 0) + i.monthlyAmount);
    const entries = [...map.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    return { slices: entries, total };
  }, [items]);

  if (total <= 0) return null;

  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <section className="mt-8">
      <h3 className="mb-3 text-sm font-600 uppercase tracking-wide text-[#cfccc3]">Where it goes</h3>
      <div className="card flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-center">
        <div className="relative grid shrink-0 place-items-center" style={{ width: 132, height: 132 }}>
          <svg width="132" height="132" className="-rotate-90">
            {slices.map(([cat, val]) => {
              const frac = val / total;
              const dash = frac * C;
              const el = (
                <circle
                  key={cat}
                  cx="66"
                  cy="66"
                  r={R}
                  fill="none"
                  stroke={COLORS[cat]}
                  strokeWidth="14"
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-lg font-600 text-[#f4f1e9] tnum">{inr(total)}</span>
            <span className="text-[10px] uppercase tracking-wide text-[#8a877f]">/mo total</span>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {slices.map(([cat, val]) => (
            <div key={cat} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-[#cfccc3]">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[cat] }} />
                {LABEL[cat]}
              </span>
              <span className="tnum text-[#9a978f]">
                {inr(val)} · {Math.round((val / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
