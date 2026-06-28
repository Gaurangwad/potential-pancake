import Link from "next/link";
import { ShieldCheck, Trash2, Scissors, EyeOff, ArrowLeft, FileClock, UserCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { DataControls } from "@/components/auth/DataControls";

export const metadata = {
  title: "Privacy — Ooze",
  description: "We never store your bank statement. Here's exactly how Ooze handles your data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 pb-20">
      <header className="flex items-center justify-between py-5">
        <Link href="/">
          <Logo />
        </Link>
        <Link href="/audit" className="text-sm text-[#9a978f] hover:text-[#ece9e1]">
          Run an audit
        </Link>
      </header>

      <h1 className="mt-6 font-display text-4xl font-600 text-[#f4f1e9]">
        We never store your bank statement.
      </h1>
      <p className="mt-3 text-[#b4b0a6]">
        This is a money app. Trust is the whole product. Here is exactly what happens to
        your data — in plain language, no fine print.
      </p>

      <div className="mt-8 space-y-4">
        <Point icon={<Trash2 className="h-5 w-5 text-ivy" />} title="The statement is never saved">
          Your PDF or CSV is parsed in memory for a single request and discarded the moment
          your audit is computed. It is never written to a database, a disk, or a log.
        </Point>
        <Point icon={<Scissors className="h-5 w-5 text-ivy" />} title="We send the minimum to AI">
          To clean up messy bank narrations, we send only the short narration strings (e.g.
          <span className="font-mono text-xs text-[#cfccc3]"> &quot;UPI/NETFLIX/MANDATE&quot;</span>) to
          our AI categoriser. Never your name, account number, balance, or full statement.
        </Point>
        <Point icon={<EyeOff className="h-5 w-5 text-ivy" />} title="Passwords are used once">
          If your bank PDF is locked, the password unlocks the file for that one request and
          is then dropped. We never store it.
        </Point>
        <Point icon={<ShieldCheck className="h-5 w-5 text-ivy" />} title="We keep only your number and derived figures">
          If you sign in to track your subscriptions, we persist only your mobile number and
          non-sensitive derived data: merchant name, category, amount, cadence, and next renewal
          date. No raw transactions, no statement files.
        </Point>
      </div>

      <div className="mt-10">
        <Link
          href="/audit"
          className="inline-flex items-center gap-2 rounded-xl bg-ivy px-5 py-3 text-sm font-600 text-[#10130c] transition hover:bg-ivy-soft"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to my audit
        </Link>
      </div>

      {/* DPDP — your rights + delete */}
      <section className="mt-12 border-t hairline pt-8">
        <h2 className="font-display text-2xl font-600 text-[#f4f1e9]">Your rights &amp; data controls</h2>
        <p className="mt-2 text-sm text-[#b4b0a6]">
          Ooze handles personal data in line with India&apos;s Digital Personal Data Protection Act
          (DPDP), 2023. You consent to processing when you sign in; you can withdraw it any time.
        </p>

        <div className="mt-5 grid gap-4">
          <Point icon={<FileClock className="h-5 w-5 text-ivy" />} title="What we retain, and for how long">
            Statement files: <span className="text-[#cfccc3]">never stored</span> (processed in-session,
            discarded immediately). For signed-in users we keep only your mobile number and derived
            audit figures, retained until you delete them. Delete your account and it&apos;s all
            erased at once.
          </Point>
          <Point icon={<UserCheck className="h-5 w-5 text-ivy" />} title="Consent & purpose">
            We use your data only to compute and track your audit. We don&apos;t sell it, and we
            don&apos;t share it with advertisers. The minimum needed (narration strings only) goes to
            our AI categoriser — never your name, account number or balances.
          </Point>
          <div className="card p-5">
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-leak/30 bg-leak/10">
                <Trash2 className="h-5 w-5 text-leak" />
              </div>
              <div className="flex-1">
                <h3 className="font-600 text-[#f0ede5]">Right to erasure</h3>
                <div className="mt-2">
                  <DataControls />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Point({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-ivy/25 bg-ivy/10">
          {icon}
        </div>
        <div>
          <h3 className="font-600 text-[#f0ede5]">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[#9a978f]">{children}</p>
        </div>
      </div>
    </div>
  );
}
