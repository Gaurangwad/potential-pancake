import Link from "next/link";
import { Upload, Eye, LineChart, Check, ArrowRight } from "lucide-react";
import { PRICING } from "@/lib/constants";
import { Logo } from "@/components/Logo";
import { inr } from "@/lib/format";

/** Below-the-fold landing content: how it works, pricing, footer. */
export function LandingSections() {
  return (
    <div className="bg-[#08090a] text-white">
      {/* How it works */}
      <section className="mx-auto max-w-6xl px-[clamp(1.25rem,5vw,4rem)] py-[clamp(3rem,8vw,6rem)]">
        <SectionLabel n="002">How it works</SectionLabel>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <Step
            icon={<Upload className="h-5 w-5 text-ivy" strokeWidth={2} />}
            n={1}
            title="Drop a statement"
            body="Upload a bank or card PDF/CSV — password-protected is fine. Account-Aggregator autofetch is coming soon."
          />
          <Step
            icon={<Eye className="h-5 w-5 text-ivy" strokeWidth={2} />}
            n={2}
            title="See what's oozing"
            body="Your exact monthly burn, the forgotten slice, duplicates, price creep, dues and international spend — in seconds."
          />
          <Step
            icon={<LineChart className="h-5 w-5 text-ivy" strokeWidth={2} />}
            n={3}
            title="Stop the bleed"
            body="Set renewal reminders, cancel with guides, and watch your savings climb month over month."
          />
        </div>
      </section>

      {/* Testimonials — PLACEHOLDER copy for the preview build. Replace with
          real, consented testimonials before public launch (see footnote). */}
      <section className="mx-auto max-w-6xl px-[clamp(1.25rem,5vw,4rem)] pb-[clamp(2rem,6vw,4rem)]">
        <SectionLabel n="003">What people find</SectionLabel>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <Quote
            text="Found ₹740 a month going to two streaming apps I'd completely forgotten. Cancelled both in five minutes."
            name="Ananya R."
            city="Bengaluru"
          />
          <Quote
            text="It left my SIPs and insurance alone and only flagged the junk. That's the moment I actually trusted it."
            name="Karthik M."
            city="Pune"
          />
          <Quote
            text="The renewal reminder caught an auto-debit I'd have missed. Paid for itself the first week."
            name="Sneha T."
            city="Hyderabad"
          />
        </div>
        <p className="mt-4 text-[11px] text-white/35">Illustrative feedback for this preview build.</p>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-[clamp(1.25rem,5vw,4rem)] pb-[clamp(3rem,8vw,6rem)]">
        <SectionLabel n="004">Pricing</SectionLabel>
        <p className="mt-3 max-w-md text-sm text-white/55">
          The audit is free — see your number with no signup. Pay only to track and act.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <PriceCard
            title="Free audit"
            price="₹0"
            sub="no signup to see your number"
            features={["Full subscription burn", "Forgotten & duplicate leaks", "Loans, dues & overhead", "International spend in ₹"]}
            cta="Run my audit"
          />
          <PriceCard
            highlight
            title="Premium"
            price={inr(PRICING.monthly.amount)}
            suffix="/mo"
            sub={`or ${inr(PRICING.yearly.amount)}/yr · ${PRICING.yearly.sub}`}
            features={["Everything in Free", "Renewal + WhatsApp reminders", "Monthly tracking & savings graph", "Cancel-assist + price-creep alerts", "GST / business-expense export"]}
            cta="Start tracking"
          />
          <PriceCard
            title="Deep audit"
            price={inr(PRICING.oneTime.amount)}
            sub="one-time, no subscription"
            features={["Everything in Free", "One full deep-dive report", "Keep your audit saved"]}
            cta="Unlock once"
          />
        </div>
        <p className="mt-4 text-[11px] text-white/40">
          Test build — payments run in Razorpay test mode. Prices in INR.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-[clamp(1.25rem,5vw,4rem)] py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-2 text-xs text-white/45">Every rupee shows up here before it oozes out.</p>
          </div>
          <div className="flex items-center gap-5 text-sm text-white/60">
            <Link href="/audit" className="hover:text-white">Run audit</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <span className="font-mono text-[11px] text-white/35">India · v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] tracking-widest text-ivy">{n}</span>
      <span className="h-px w-8 bg-white/20" />
      <h2 className="font-display text-[clamp(1.5rem,4vw,2.25rem)] font-600">{children}</h2>
    </div>
  );
}

function Quote({ text, name, city }: { text: string; name: string; city: string }) {
  return (
    <figure className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <blockquote className="text-sm leading-relaxed text-white/75">&ldquo;{text}&rdquo;</blockquote>
      <figcaption className="mt-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ivy/15 font-display text-sm font-600 text-ivy">
          {name.charAt(0)}
        </span>
        <span className="text-xs text-white/55">
          <span className="text-white/80">{name}</span> · {city}
        </span>
      </figcaption>
    </figure>
  );
}

function Step({ icon, n, title, body }: { icon: React.ReactNode; n: number; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        {icon}
        <span className="font-mono text-xs text-white/30">0{n}</span>
      </div>
      <h3 className="mt-4 font-600 text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/55">{body}</p>
    </div>
  );
}

function PriceCard({
  title,
  price,
  suffix,
  sub,
  features,
  cta,
  highlight,
}: {
  title: string;
  price: string;
  suffix?: string;
  sub: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl border-2 border-ivy/50 bg-ivy/[0.06] p-6"
          : "rounded-2xl border border-white/10 bg-white/[0.02] p-6"
      }
    >
      <div className="flex items-center justify-between">
        <h3 className="font-600 text-white">{title}</h3>
        {highlight && (
          <span className="rounded-full bg-ivy/15 px-2 py-0.5 font-mono text-[10px] uppercase text-ivy">
            Popular
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-3xl font-700 tnum text-white">{price}</span>
        {suffix && <span className="text-sm text-white/50">{suffix}</span>}
      </div>
      <p className="mt-1 text-xs text-white/50">{sub}</p>
      <ul className="mt-5 space-y-2.5 text-sm text-white/70">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ivy" strokeWidth={2} />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/audit"
        className={
          highlight
            ? "group mt-6 flex items-center justify-center gap-2 rounded-lg bg-ivy px-5 py-3 text-sm font-600 text-[#10130c] transition hover:bg-ivy-soft"
            : "group mt-6 flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-600 text-white transition hover:border-white/40"
        }
      >
        {cta}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={2.2} />
      </Link>
    </div>
  );
}
