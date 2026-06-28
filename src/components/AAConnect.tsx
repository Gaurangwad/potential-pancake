"use client";

import { Zap, Landmark } from "lucide-react";

/**
 * Account Aggregator autofetch — the planned fast path (no files). The backend
 * adapter + sandbox exist, but it isn't live for real accounts yet (it needs a
 * regulated TSP/FIU partnership), so it's shown here as "Coming soon" rather
 * than presented as working.
 */
export function AAConnect() {
  return (
    <div className="card relative overflow-hidden p-5 opacity-90">
      <span className="absolute right-3 top-3 rounded-full border border-leak-warn/30 bg-leak-warn/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-leak-warn">
        Coming soon
      </span>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-ivy/25 bg-ivy/10">
          <Zap className="h-5 w-5 text-ivy" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="font-600 text-[#f0ede5]">Auto-fetch via Account Aggregator</h3>
          <p className="mt-1 text-sm text-[#9a978f]">
            The fast, RBI-regulated way — no files. Discover your accounts and pull data with one
            consent. Landing soon.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#75736c]">
            <Landmark className="h-3.5 w-3.5" strokeWidth={2} />
            For now, upload a statement below — it&apos;s just as accurate.
          </div>
        </div>
      </div>
    </div>
  );
}
