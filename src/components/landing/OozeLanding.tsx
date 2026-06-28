"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

/**
 * Ooze landing — "fog" design ported from the Claude Design handoff
 * (index.html + styles.css + script.js). Styling lives in src/app/landing.css,
 * scoped under .ooze-landing. CTAs are wired to the real app routes.
 */
export function OozeLanding() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // --- reveal-on-scroll ---
    function reveal(el: HTMLElement) {
      const d = parseFloat(el.getAttribute("data-delay") || "0");
      el.style.transition =
        `opacity 1s cubic-bezier(.16,.8,.3,1) ${d}s, transform 1s cubic-bezier(.16,.8,.3,1) ${d}s`;
      el.classList.add("is-visible");
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    const vh = window.innerHeight || 800;
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92) reveal(el);
      else io.observe(el);
    });

    // --- parallax ---
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]")).map((el) => ({
      el,
      s: parseFloat(el.getAttribute("data-speed") || "0.1"),
    }));
    const hero = root.querySelector<HTMLElement>("[data-hero]");
    let raf = 0;
    function update() {
      const y = window.scrollY || window.pageYOffset || 0;
      layers.forEach((l) => {
        l.el.style.transform = `translate3d(0,${y * l.s}px,0)`;
      });
      if (hero) {
        hero.style.opacity = String(Math.max(0, 1 - y / 560));
        hero.style.transform = `translateY(${y * 0.16}px)`;
      }
    }
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    // --- particles ---
    const host = root.querySelector<HTMLElement>("[data-particles]");
    if (host && host.childElementCount === 0) {
      for (let i = 0; i < 28; i++) {
        const d = document.createElement("div");
        d.className = "particle";
        d.style.left = `${Math.random() * 100}%`;
        const size = 2 + Math.random() * 5;
        d.style.width = `${size}px`;
        d.style.height = `${size}px`;
        d.style.animationDuration = `${11 + Math.random() * 16}s`;
        d.style.animationDelay = `${Math.random() * 18}s`;
        host.appendChild(d);
      }
    }

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="ooze-landing" ref={rootRef}>
      {/* Fixed fog background */}
      <div className="fog" aria-hidden="true">
        <div className="fog__layer" data-parallax data-speed="0.04">
          <div className="fog__cloud-a" />
          <div className="fog__cloud-b" />
        </div>
        <div className="fog__layer" data-parallax data-speed="0.12">
          <div className="fog__blob-1" />
          <div className="fog__blob-2" />
        </div>
        <div className="fog__layer" data-parallax data-speed="0.2">
          <div className="fog__blob-3" />
          <div className="fog__column" />
        </div>
        <div className="fog__bloom" />
        <div className="fog__particles" data-particles />
        <div className="fog__vignette-radial" />
        <div className="fog__vignette-linear" />
      </div>

      <div className="content">
        <nav className="nav">
          <div className="nav__brand">
            <span className="nav__wordmark">ooze</span>
            <span className="dot" />
          </div>
          <span className="nav__badge">EST. 2026 · INDIA</span>
          <Link href="/audit" className="nav__cta">Audit →</Link>
        </nav>

        <main>
          {/* Hero */}
          <header className="hero" data-hero>
            <div className="hero__grid">
              <div>
                <div className="eyebrow" data-reveal data-delay="0.05">001 / AUDIT</div>
                <h1 className="hero__title" data-reveal data-delay="0.14">
                  Find the money <span className="text-gradient">oozing out</span> of your accounts.
                </h1>
                <p className="hero__lede" data-reveal data-delay="0.24">
                  Connect through India&apos;s Account Aggregator — or just drop a statement. In
                  seconds, see your true monthly subscription burn, the slice you&apos;ve forgotten,
                  and what&apos;s quietly draining away.
                </p>
                <div className="hero__actions" id="audit" data-reveal data-delay="0.34">
                  <Link href="/audit" className="btn btn--primary">Run my audit — free</Link>
                  <Link href="/privacy" className="btn btn--ghost">How your data is handled</Link>
                </div>
                <div className="hero__note" data-reveal data-delay="0.42">
                  <span className="dot" />
                  No signup to see your number · processed in-session
                </div>
              </div>

              <div className="hero__visual" data-reveal data-delay="0.2">
                <div className="hero__amount">
                  <div className="hero__amount-label">AVG MONTHLY BURN FOUND</div>
                  <div className="hero__amount-value">₹4,237</div>
                </div>
                <div className="statement-card">
                  <div className="statement-card__head">
                    <span>STATEMENT · MAR 2026</span>
                    <span>HDFC ••42</span>
                  </div>
                  <div className="statement-card__rows">
                    <div className="statement-card__row">
                      <span className="statement-card__item">Netflix Premium</span>
                      <span className="statement-card__price">₹649</span>
                    </div>
                    <div className="statement-card__row">
                      <span className="statement-card__item statement-card__item--flagged">
                        <span className="dot" />Hotstar <span className="statement-card__tag">TRIAL CONVERTED</span>
                      </span>
                      <span className="statement-card__price statement-card__price--flagged">₹299</span>
                    </div>
                    <div className="statement-card__row">
                      <span className="statement-card__item statement-card__item--flagged">
                        <span className="dot" />Cloud Drive <span className="statement-card__tag">×2 DUPLICATE</span>
                      </span>
                      <span className="statement-card__price statement-card__price--flagged">₹229</span>
                    </div>
                    <div className="statement-card__row">
                      <span className="statement-card__item">Spotify</span>
                      <span className="statement-card__price">₹119</span>
                    </div>
                  </div>
                  <div className="statement-card__total">
                    <span className="statement-card__total-label">FORGOTTEN LEAK / MO</span>
                    <span className="statement-card__total-value">₹890</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* The leak */}
          <section className="leak section">
            <div className="leak__inner">
              <div className="eyebrow" data-reveal>002 / THE LEAK</div>
              <h2 className="section__heading leak__heading" data-reveal data-delay="0.08">
                It rarely feels like spending. A ₹149 here, a trial you forgot to cancel there — and
                it quietly adds up to <span className="accent-soft-text">thousands a year</span>.
              </h2>
              <div className="stat-grid">
                <div data-reveal data-delay="0.0">
                  <div className="stat-grid__value">₹4,237</div>
                  <div className="stat-grid__desc">Average monthly burn we surface per audit.</div>
                </div>
                <div data-reveal data-delay="0.1">
                  <div className="stat-grid__value">₹890</div>
                  <div className="stat-grid__desc">Of that, forgotten — paying for things you no longer use.</div>
                </div>
                <div data-reveal data-delay="0.2">
                  <div className="stat-grid__value">~9</div>
                  <div className="stat-grid__desc">Recurring charges the average person can&apos;t recall signing up for.</div>
                </div>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="how-it-works section">
            <div className="how-it-works__inner">
              <div className="eyebrow" data-reveal>003 / HOW IT WORKS</div>
              <h2 className="section__heading how-it-works__heading" data-reveal data-delay="0.06">
                Three steps. Your number before you finish your coffee.
              </h2>
              <div className="step-grid">
                <div className="step-card" data-reveal data-delay="0.0">
                  <div className="step-card__num">01</div>
                  <h3 className="step-card__title">Connect or drop</h3>
                  <p className="step-card__desc">Link your accounts via the Account Aggregator, or upload a bank or card statement. Nothing leaves your session.</p>
                </div>
                <div className="step-card" data-reveal data-delay="0.1">
                  <div className="step-card__num">02</div>
                  <h3 className="step-card__title">We trace the leaks</h3>
                  <p className="step-card__desc">Ooze reads every recurring charge — subscriptions, trials that quietly converted, duplicates, and slow price creep.</p>
                </div>
                <div className="step-card" data-reveal data-delay="0.2">
                  <div className="step-card__num">03</div>
                  <h3 className="step-card__title">See your number</h3>
                  <p className="step-card__desc">Your true monthly burn, the forgotten slice, and upcoming dues — laid out clearly before they ooze out.</p>
                </div>
              </div>
            </div>
          </section>

          {/* What we surface */}
          <section className="surface section">
            <div className="surface__inner">
              <div className="eyebrow" data-reveal>004 / WHAT WE SURFACE</div>
              <h2 className="section__heading surface__heading" data-reveal data-delay="0.06">Every quiet drain, named.</h2>
              <div className="surface-grid">
                {[
                  ["Forgotten subscriptions", "Services you still pay for but stopped opening months ago.", "0.0"],
                  ["Silent trial conversions", "Free trials that quietly became paid plans without a heads-up.", "0.07"],
                  ["Duplicate services", "Two plans doing the same job — cloud storage, music, VPNs.", "0.14"],
                  ["Price creep", "The slow increases that slipped past you, charge after charge.", "0.0"],
                  ["Upcoming dues", "Renewals and EMIs landing soon, so nothing catches you off guard.", "0.07"],
                  ["Annual projection", "What today's leaks total over a year if nothing changes.", "0.14"],
                ].map(([title, desc, delay]) => (
                  <div className="surface-card" key={title} data-reveal data-delay={delay}>
                    <span className="surface-card__mark" />
                    <h3 className="surface-card__title">{title}</h3>
                    <p className="surface-card__desc">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section className="privacy section" id="privacy">
            <div className="privacy__card" data-reveal>
              <div className="eyebrow">005 / YOUR DATA</div>
              <h2 className="section__heading privacy__heading">Your statements never touch our servers.</h2>
              <p className="privacy__desc">
                Everything runs in your browser, in your session. We don&apos;t store statements, we
                don&apos;t sell data, and you don&apos;t need an account just to see your number.
              </p>
              <div className="pill-row">
                <span className="pill">PROCESSED IN-SESSION</span>
                <span className="pill">NEVER STORED</span>
                <span className="pill">NO SIGNUP REQUIRED</span>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="cta section">
            <div className="cta__inner" data-reveal>
              <h2 className="cta__heading">Find your <span className="text-gradient">leak</span>.</h2>
              <p className="cta__desc">It&apos;s free to see your number. Most people are surprised by how much was quietly oozing out.</p>
              <Link href="/audit" className="btn btn--primary">Run my audit — free</Link>
              <div className="cta__note">PROCESSED IN-SESSION · NEVER STORED</div>
            </div>
          </section>
        </main>

        <footer className="footer">
          <div className="footer__brand">
            <span className="footer__wordmark">ooze</span>
            <span className="dot" />
          </div>
          <div className="footer__links">
            <Link href="/privacy">Privacy</Link>
            <a href="#">Terms</a>
            <span>EST. 2026 · INDIA</span>
            <span>V1.0.0</span>
            <a
              href="https://www.linkedin.com/company/ooze-money/"
              target="_blank"
              rel="noopener"
              aria-label="Ooze on LinkedIn"
              className="footer__social"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
              </svg>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
