"use client";

import { useState } from "react";
import Link from "next/link";
import { User, LogOut, BadgeCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";

/** Compact header account state: signed-out, signed-in, or premium. */
export function AccountChip() {
  const { loading, authenticated, phone, premium, demo, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);

  if (loading || !authenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpenMenu((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-[#ece9e1]/12 bg-white/[0.03] px-3 py-1.5 text-xs text-[#cfccc3] hover:border-[#ece9e1]/25"
      >
        {premium ? (
          <BadgeCheck className="h-3.5 w-3.5 text-ivy" strokeWidth={2} />
        ) : (
          <User className="h-3.5 w-3.5 text-[#8a877f]" strokeWidth={2} />
        )}
        <span className="tnum">+91 {phone}</span>
        {premium && (
          <span className="rounded-full bg-ivy/15 px-1.5 py-0.5 text-[10px] font-600 text-ivy">
            {demo ? "DEMO" : "PREMIUM"}
          </span>
        )}
      </button>
      {openMenu && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border border-[#ece9e1]/10 bg-ink-soft py-1 shadow-xl">
          <Link
            href="/privacy"
            onClick={() => setOpenMenu(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#cfccc3] hover:bg-white/[0.04]"
          >
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} /> Privacy &amp; data
          </Link>
          <button
            onClick={() => {
              setOpenMenu(false);
              void logout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#cfccc3] hover:bg-white/[0.04]"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
