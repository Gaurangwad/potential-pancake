import type { AuditSnapshot } from "./server/store";

export interface SavingsAnalysis {
  hasTrend: boolean;
  baselineWaste: number; // monthly waste at the first audit
  currentWaste: number; // monthly waste now
  savingNowMonthly: number; // ₹/mo cut since the first audit
  savingNowAnnual: number;
  avgMonthlySaving: number; // mean monthly saving across the journey
  increaseMonthly: number; // how much the monthly saving has grown
  points: { label: string; saving: number; health: number }[];
}

/**
 * Compute the savings story from re-audit snapshots. "Saving" at each point is
 * how much lower this month's waste is than the very first audit — a number
 * that genuinely grows as the user cuts subscriptions. This is what the graph
 * plots (real increase amount), not a fabricated curve.
 */
export function analyseSavings(history: AuditSnapshot[]): SavingsAnalysis {
  if (history.length === 0) {
    return {
      hasTrend: false,
      baselineWaste: 0,
      currentWaste: 0,
      savingNowMonthly: 0,
      savingNowAnnual: 0,
      avgMonthlySaving: 0,
      increaseMonthly: 0,
      points: [],
    };
  }

  const baseline = history[0].wasteMonthly;
  const points = history.map((s) => ({
    label: new Date(s.at).toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" }),
    saving: Math.max(0, baseline - s.wasteMonthly),
    health: s.healthScore,
  }));

  const current = history[history.length - 1].wasteMonthly;
  const savingNow = Math.max(0, baseline - current);
  const avg = Math.round(points.reduce((a, p) => a + p.saving, 0) / points.length);
  // Growth in saving = latest saving minus the earliest non-zero saving step.
  const firstStep = points.length > 1 ? points[1].saving : 0;
  const increase = Math.max(0, points[points.length - 1].saving - firstStep);

  return {
    hasTrend: history.length >= 2,
    baselineWaste: baseline,
    currentWaste: current,
    savingNowMonthly: savingNow,
    savingNowAnnual: savingNow * 12,
    avgMonthlySaving: avg,
    increaseMonthly: increase,
    points,
  };
}
