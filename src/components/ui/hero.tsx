"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, ChevronDown } from "lucide-react";
import { Logo } from "@/components/Logo";

/**
 * Ooze landing hero — dark, technical, editorial. Reproduces the requested
 * aesthetic (mono labels, corner frames, stats rail, big light heading) with a
 * self-contained animated background — no third-party embed scripts on a
 * money-trust surface. Fully fluid: sizes scale with the viewport so it fits
 * any screen from a 360px phone to an ultrawide.
 */
export function Hero() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#08090a] text-white">
      {/* Background: drifting glow + fine grid (CSS only) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 ooze-grid opacity-[0.18]" />
        <div className="absolute -top-1/3 left-1/2 h-[80vmax] w-[80vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(157,179,128,0.16),transparent_60%)] blur-2xl ooze-drift" />
      </div>

      {/* Corner frame accents */}
      <Corner className="left-0 top-0 border-l-2 border-t-2" />
      <Corner className="right-0 top-0 border-r-2 border-t-2" />
      <Corner className="bottom-0 left-0 border-b-2 border-l-2" />
      <Corner className="bottom-0 right-0 border-b-2 border-r-2" />

      {/* Top header */}
      <header className="absolute inset-x-0 top-0 z-20 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-[clamp(1rem,4vw,3rem)] py-3 lg:py-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden h-4 w-px bg-white/20 sm:block" />
            <span className="hidden font-mono text-[10px] tracking-widest text-white/40 sm:block">
              EST. 2026 · INDIA
            </span>
          </div>
          <div className="hidden items-center gap-3 font-mono text-[10px] text-white/40 lg:flex">
            <span>AUTO-FETCH: AA</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>STATEMENTS NEVER STORED</span>
          </div>
          <Link
            href="/audit"
            className="font-mono text-[11px] uppercase tracking-wider text-white/60 underline-offset-4 transition hover:text-white hover:underline lg:hidden"
          >
            Audit
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-[clamp(1.25rem,5vw,4rem)] pb-28 pt-28 lg:flex-row lg:items-end lg:justify-between lg:pb-32">
        <div className="max-w-xl">
          <div className="mb-4 flex items-center gap-2 opacity-70">
            <span className="h-px w-8 bg-white" />
            <span className="font-mono text-[10px] tracking-widest text-white">001 / AUDIT</span>
          </div>

          <h1 className="font-display text-[clamp(2.4rem,7vw,5rem)] font-600 leading-[1.04] tracking-tight">
            Find the money
            <span className="block text-ivy">oozing out</span>
            of your accounts.
          </h1>

          <p className="mt-5 max-w-md text-[clamp(0.95rem,2.4vw,1.125rem)] leading-relaxed text-white/60">
            Connect your accounts via India&apos;s Account Aggregator — or drop a
            statement — and see your exact monthly subscription burn, the slice
            you&apos;ve forgotten, and your dues, in seconds.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/audit"
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-ivy px-6 py-3.5 text-sm font-600 text-[#10130c] transition hover:bg-ivy-soft"
            >
              Run my audit — free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={2.2} />
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center justify-center rounded-md border border-white/20 px-6 py-3.5 text-sm font-500 text-white/80 transition hover:border-white/40 hover:text-white"
            >
              How your data is handled
            </Link>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] text-white/40">
            <ShieldCheck className="h-3.5 w-3.5 text-ivy" strokeWidth={2} />
            No signup to see your number · processed in-session
          </div>
        </div>

        {/* Stats rail */}
        <div className="mt-12 flex gap-[clamp(2rem,6vw,5rem)] lg:mt-0 lg:flex-col lg:items-end lg:gap-8">
          <Stat value="₹4,237" label="Avg monthly burn found" />
          <Stat value="₹890" label="Avg forgotten leak / mo" />
        </div>
      </section>

      {/* Scroll cue — there's pricing + how-it-works below */}
      <div className="pointer-events-none absolute bottom-14 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/35 sm:flex">
        <span className="font-mono text-[9px] tracking-[0.25em]">PRICING</span>
        <ChevronDown className="h-4 w-4 animate-bounce" strokeWidth={2} />
      </div>

      {/* Bottom footer */}
      <footer className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-[clamp(1rem,4vw,3rem)] py-2.5 font-mono text-[9px] text-white/40">
          <span className="truncate normal-case tracking-normal text-white/55">
            Every rupee shows up here before it oozes out.
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ivy" />
            <span>V1.0.0</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      className={`pointer-events-none absolute z-20 h-8 w-8 border-white/25 lg:h-12 lg:w-12 ${className}`}
    />
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="lg:text-right">
      <div className="font-display text-[clamp(2rem,5vw,3.5rem)] font-600 leading-none tnum text-white">
        {value}
      </div>
      <div className="mt-2 max-w-[8rem] text-xs text-white/50 lg:ml-auto">{label}</div>
    </div>
  );
}
