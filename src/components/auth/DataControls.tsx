"use client";

import { useState } from "react";
import { Trash2, Check, Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";

/** DPDP data controls — delete everything we hold for this account. */
export function DataControls() {
  const { authenticated, phone, refresh } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!authenticated) {
    return (
      <p className="text-sm text-[#9a978f]">
        Sign in to manage or delete your data. We only ever hold your mobile number and derived
        audit figures — never your statements.
      </p>
    );
  }

  async function del() {
    setBusy(true);
    try {
      await fetch("/api/account/delete", { method: "POST" });
      await refresh();
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm text-ivy">
        <Check className="h-4 w-4" strokeWidth={2} /> Done — every record tied to +91 {phone} has been deleted.
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm text-[#9a978f]">
        Signed in as <span className="text-[#cfccc3]">+91 {phone}</span>. You can erase everything we
        hold — your number, premium status and saved audit figures — at any time.
      </p>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-leak/40 bg-leak/[0.08] px-3 py-2 text-xs font-600 text-leak transition hover:bg-leak/[0.12]"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} /> Delete my data
        </button>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-[#cfccc3]">This can&apos;t be undone.</span>
          <button
            onClick={del}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-leak/40 bg-leak/15 px-3 py-2 text-xs font-600 text-leak disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />}
            Confirm delete
          </button>
          <button onClick={() => setConfirming(false)} className="text-xs text-[#8a877f] hover:text-[#ece9e1]">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
