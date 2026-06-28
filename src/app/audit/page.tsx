"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { AuditResult } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { UploadCard, type UploadSubmit } from "@/components/UploadCard";
import { LoadingStatus } from "@/components/LoadingStatus";
import { Reveal } from "@/components/Reveal";
import { AuditDashboard } from "@/components/AuditDashboard";
import { AccountChip } from "@/components/auth/AccountChip";

type Stage = "upload" | "loading" | "reveal" | "dashboard";

export default function AuditPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  // Owned here (not in UploadCard) so the selection + password survive the
  // unmount that happens while the loading stage is shown.
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");

  const run = useCallback(async (s: UploadSubmit) => {
    setErrorCode(undefined);
    setErrorMessage(undefined);
    setStage("loading");

    const form = new FormData();
    if (s.sample) form.set("mode", "sample");
    if (s.files) for (const f of s.files) form.append("file", f);
    if (s.password) form.set("password", s.password);

    const startedAt = Date.now();
    try {
      const res = await fetch("/api/audit", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setErrorCode(data.code);
        setErrorMessage(data.error || "Something went wrong. Try again.");
        setStage("upload");
        return;
      }
      // Let the anticipation loader breathe for a beat — the reveal hits harder.
      const elapsed = Date.now() - startedAt;
      if (elapsed < 2600) await new Promise((r) => setTimeout(r, 2600 - elapsed));
      setAudit(data as AuditResult);
      setStage("reveal");
    } catch {
      setErrorMessage("We couldn't reach the server. Check your connection and try again.");
      setStage("upload");
    }
  }, []);

  const restart = useCallback(() => {
    setAudit(null);
    setFiles([]);
    setPassword("");
    setErrorCode(undefined);
    setErrorMessage(undefined);
    setStage("upload");
  }, []);

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <AccountChip />
          {stage !== "upload" && stage !== "loading" && (
            <button onClick={restart} className="text-sm text-[#9a978f] hover:text-[#ece9e1]">
              Start over
            </button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.section
          key={stage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="pt-4"
        >
          {stage === "upload" && (
            <UploadCard
              files={files}
              setFiles={setFiles}
              password={password}
              setPassword={setPassword}
              onSubmit={run}
              errorCode={errorCode}
              errorMessage={errorMessage}
            />
          )}
          {stage === "loading" && <LoadingStatus />}
          {stage === "reveal" && audit && (
            <Reveal audit={audit} onContinue={() => setStage("dashboard")} />
          )}
          {stage === "dashboard" && audit && (
            <AuditDashboard audit={audit} onRestart={restart} />
          )}
        </motion.section>
      </AnimatePresence>
    </main>
  );
}
