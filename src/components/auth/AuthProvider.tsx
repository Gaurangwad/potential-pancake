"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { RecurringItem } from "@/lib/types";
import { AuthModal } from "./AuthModal";
import { Paywall } from "../Paywall";
import { SuccessToast } from "./SuccessToast";

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  phone: string | null;
  premium: boolean;
  demo: boolean;
}

interface Anchor {
  wasteMonthly: number;
  annualSavings: number;
}

interface AuthCtx extends AuthState {
  refresh: () => Promise<AuthState>;
  logout: () => Promise<void>;
  /** Run a premium-gated action: sign in if needed, then pay if needed. */
  gate: (trigger: RecurringItem, anchor: Anchor) => void;
  /** Just open the sign-in modal (no paywall follow-up). */
  openSignIn: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const INITIAL: AuthState = { loading: true, authenticated: false, phone: null, premium: false, demo: false };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL);
  const [authOpen, setAuthOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [trigger, setTrigger] = useState<RecurringItem | null>(null);
  const [anchor, setAnchor] = useState<Anchor>({ wasteMonthly: 0, annualSavings: 0 });
  const [intent, setIntent] = useState<"gate" | "signin">("gate");
  const [toast, setToast] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const refresh = useCallback(async (): Promise<AuthState> => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const d = await res.json();
      const next: AuthState = {
        loading: false,
        authenticated: !!d.authenticated,
        phone: d.phone ?? null,
        premium: !!d.premium,
        demo: !!d.demo,
      };
      setState(next);
      return next;
    } catch {
      const next = { ...INITIAL, loading: false };
      setState(next);
      return next;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
  }, [refresh]);

  const grant = useCallback((t: RecurringItem | null) => {
    setToast(
      t ? `Reminder set for ${t.merchant} — we'll alert you before it renews.` : "You're all set.",
    );
  }, []);

  const gate = useCallback(
    (t: RecurringItem, a: Anchor) => {
      setIntent("gate");
      setTrigger(t);
      setAnchor(a);
      const s = stateRef.current;
      if (s.premium) {
        grant(t);
      } else if (!s.authenticated) {
        setAuthOpen(true);
      } else {
        setPayOpen(true);
      }
    },
    [grant],
  );

  const openSignIn = useCallback(() => {
    setIntent("signin");
    if (!stateRef.current.authenticated) setAuthOpen(true);
  }, []);

  // After sign-in: a plain sign-in just refreshes; a gated action continues to
  // premium (demo) → grant, otherwise the paywall.
  const onAuthed = useCallback(async () => {
    setAuthOpen(false);
    const s = await refresh();
    if (intent === "signin") return;
    if (s.premium) grant(trigger);
    else setPayOpen(true);
  }, [refresh, grant, trigger, intent]);

  const onPaid = useCallback(async () => {
    setPayOpen(false);
    await refresh();
    grant(trigger);
  }, [refresh, grant, trigger]);

  return (
    <Ctx.Provider value={{ ...state, refresh, logout, gate, openSignIn }}>
      {children}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthed={onAuthed} />
      <Paywall
        open={payOpen}
        trigger={trigger}
        wasteMonthly={anchor.wasteMonthly}
        annualSavings={anchor.annualSavings}
        onClose={() => setPayOpen(false)}
        onPaid={onPaid}
      />
      <SuccessToast message={toast} onDone={() => setToast(null)} />
    </Ctx.Provider>
  );
}
