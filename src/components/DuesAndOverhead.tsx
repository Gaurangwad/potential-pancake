"use client";

import { useState } from "react";
import { Landmark, Receipt, Mail, Bell, CalendarClock, Loader2, Lock } from "lucide-react";
import type { AuditResult, RecurringItem } from "@/lib/types";
import { inr, fmtDate, untilLabel } from "@/lib/format";
import { useAuth } from "./auth/AuthProvider";

interface Due {
  merchant: string;
  amount: number;
  dueOn?: string;
  source: "statement" | "email";
}
interface Overhead {
  merchant: string;
  amount: number;
  note: string;
  source: "statement" | "email";
}

export function DuesAndOverhead({ audit }: { audit: AuditResult }) {
  const { gate } = useAuth();
  const [emailDues, setEmailDues] = useState<Due[]>([]);
  const [emailOverhead, setEmailOverhead] = useState<Overhead[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sandbox, setSandbox] = useState(false);

  // Dues from the statement: EMIs + loans (recurring, must-pay, not waste).
  const statementDues: Due[] = audit.items
    .filter((i) => i.category === "emi")
    .map((i) => ({ merchant: i.merchant, amount: i.lastAmount, dueOn: i.nextRenewalOn, source: "statement" }));

  // Overhead: recurring debits we couldn't attribute to a known merchant.
  const statementOverhead: Overhead[] = audit.items
    .filter((i) => i.category === "unknown")
    .map((i) => ({ merchant: i.merchant, amount: i.lastAmount, note: "Unrecognised recurring debit", source: "statement" }));

  const dues = [...statementDues, ...emailDues].sort((a, b) => (a.dueOn ?? "9").localeCompare(b.dueOn ?? "9"));
  const overhead = [...statementOverhead, ...emailOverhead];

  const reminder = (merchant: string, amount: number) =>
    gate(
      { merchant, lastAmount: amount } as RecurringItem,
      { wasteMonthly: audit.wasteMonthly, annualSavings: audit.potentialAnnualSavings },
    );

  async function scanEmail() {
    setScanning(true);
    try {
      const res = await fetch("/api/email/scan", { method: "POST" });
      if (res.status === 401) {
        // Not signed in — route the user through sign-in via the gate.
        reminder("Email scan", 0);
        return;
      }
      const d = await res.json();
      setEmailDues((d.dues ?? []).map((x: Due) => ({ ...x, source: "email" })));
      setEmailOverhead((d.overhead ?? []).map((x: Overhead) => ({ ...x, source: "email" })));
      setConnected(true);
      setSandbox(!!d.sandbox);
    } finally {
      setScanning(false);
    }
  }

  if (dues.length === 0 && overhead.length === 0 && !connected) {
    return (
      <section className="mt-8">
        <div className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#9a978f]">
            Find loan dues &amp; overhead expenses that never hit this statement — scan your billing
            emails.
          </p>
          <ScanButton onClick={scanEmail} scanning={scanning} />
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Loans & dues */}
      <section className="mt-8">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-600 uppercase tracking-wide text-leak-warn">
          <Landmark className="h-4 w-4" strokeWidth={2} /> Loans &amp; dues to pay ({dues.length})
        </h3>
        <div className="space-y-3">
          {dues.map((d, i) => {
            const until = untilLabel(d.dueOn);
            return (
              <div key={i} className="card flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-600 text-[#f0ede5]">{d.merchant}</p>
                    <SourceTag source={d.source} />
                  </div>
                  {d.dueOn && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-leak-warn">
                      <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />
                      due {until ?? "soon"} · {fmtDate(d.dueOn)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-display text-lg text-[#f4f1e9] tnum">{inr(d.amount)}</span>
                  <button
                    onClick={() => reminder(d.merchant, d.amount)}
                    className="inline-flex items-center gap-1 rounded-lg border border-ivy/30 bg-ivy/10 px-2 py-1.5 text-xs font-600 text-ivy"
                  >
                    <Bell className="h-3.5 w-3.5" strokeWidth={2} />
                    <Lock className="h-3 w-3 opacity-60" strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
          {dues.length === 0 && <p className="card p-4 text-sm text-[#9a978f]">No loan dues detected.</p>}
        </div>
      </section>

      {/* Overhead / unaccounted */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-600 uppercase tracking-wide text-[#cfccc3]">
            <Receipt className="h-4 w-4" strokeWidth={2} /> Overhead &amp; unaccounted ({overhead.length})
          </h3>
          {!connected && <ScanButton onClick={scanEmail} scanning={scanning} small />}
        </div>
        <div className="space-y-3">
          {overhead.map((o, i) => (
            <div key={i} className="card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-600 text-[#f0ede5]">{o.merchant}</p>
                  <SourceTag source={o.source} />
                </div>
                <p className="mt-0.5 text-xs text-[#8a877f]">{o.note}</p>
              </div>
              <span className="shrink-0 font-display text-lg text-[#f4f1e9] tnum">{inr(o.amount)}</span>
            </div>
          ))}
          {overhead.length === 0 && (
            <p className="card p-4 text-sm text-[#9a978f]">Nothing unaccounted found.</p>
          )}
        </div>
        {connected && sandbox && (
          <p className="mt-2 text-[11px] text-[#75736c]">
            Sandbox email data shown. Connect Google OAuth (Gmail) to scan your real billing inbox.
          </p>
        )}
      </section>
    </>
  );
}

function ScanButton({ onClick, scanning, small }: { onClick: () => void; scanning: boolean; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={scanning}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-ivy/30 bg-ivy/10 font-600 text-ivy disabled:opacity-50 ${
        small ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs"
      }`}
    >
      {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" strokeWidth={2} />}
      Scan billing emails
    </button>
  );
}

function SourceTag({ source }: { source: "statement" | "email" }) {
  return (
    <span className="rounded border border-[#ece9e1]/12 px-1.5 py-0.5 font-mono text-[9px] uppercase text-[#8a877f]">
      {source}
    </span>
  );
}
