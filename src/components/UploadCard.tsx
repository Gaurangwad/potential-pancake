"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { UploadCloud, FileText, Lock, ArrowRight, Sparkles, KeyRound, X, FileWarning } from "lucide-react";
import { TrustBadge } from "./TrustBadge";
import { AAConnect } from "./AAConnect";
import { cn } from "@/lib/cn";

export interface UploadSubmit {
  files?: File[];
  password?: string;
  sample?: boolean;
}

export function UploadCard({
  files,
  setFiles,
  password,
  setPassword,
  onSubmit,
  errorCode,
  errorMessage,
}: {
  // Controlled by the page so the selection survives the loading round-trip
  // (e.g. when the server asks for a PDF password and we return to this screen).
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  onSubmit: (s: UploadSubmit) => void;
  errorCode?: string;
  errorMessage?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const needsPassword = errorCode === "password_required" || errorCode === "wrong_password";
  const hasPdf = files.some((f) => f.name.toLowerCase().endsWith(".pdf"));

  function add(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).filter((f) => /\.(pdf|csv)$/i.test(f.name));
    setFiles((cur) => {
      const seen = new Set(cur.map((f) => f.name + f.size));
      return [...cur, ...next.filter((f) => !seen.has(f.name + f.size))];
    });
  }

  return (
    <div className="mx-auto max-w-lg px-5">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-600 text-[#f4f1e9]">Audit your subscriptions</h1>
        <p className="mt-2 text-sm text-[#b4b0a6]">
          Upload bank or credit-card statements (PDF or CSV). Add several to merge
          accounts. Your number in seconds — no signup.
        </p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          "card flex cursor-pointer flex-col items-center gap-3 border-dashed px-6 py-10 text-center transition",
          dragOver ? "border-ivy/50 bg-ivy/[0.04]" : "hover:border-[#ece9e1]/20",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.csv"
          multiple
          className="hidden"
          onChange={(e) => add(e.target.files)}
        />
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-ivy/25 bg-ivy/10">
          {files.length ? <FileText className="h-6 w-6 text-ivy" strokeWidth={2} /> : <UploadCloud className="h-6 w-6 text-ivy" strokeWidth={2} />}
        </div>
        <div>
          <p className="font-600 text-[#ece9e1]">
            {files.length ? "Add another, or tap Reveal" : "Drop your statements here"}
          </p>
          <p className="text-xs text-[#8a877f]">PDF or CSV · multiple allowed · max 12 MB each</p>
        </div>
      </label>

      {/* Selected files */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, i) => (
            <div key={f.name + f.size} className="flex items-center gap-2 rounded-lg border border-[#ece9e1]/10 bg-white/[0.02] px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-ivy" strokeWidth={2} />
              <span className="flex-1 truncate text-sm text-[#ece9e1]">{f.name}</span>
              <span className="text-xs text-[#75736c]">{(f.size / 1024).toFixed(0)} KB</span>
              <button
                onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                className="text-[#8a877f] hover:text-[#ece9e1]"
                aria-label="Remove"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Password field — calm, explained. Bank PDFs are locked by default. */}
      {(hasPdf || needsPassword) && (
        <div className={cn("mt-3 rounded-xl border px-4 py-3", needsPassword ? "border-leak/40 bg-leak/[0.06]" : "hairline")}>
          <div className="flex items-center gap-2 text-sm text-[#cfccc3]">
            <KeyRound className="h-4 w-4 text-ivy" strokeWidth={2} />
            <span>{needsPassword ? "This PDF is locked — enter its password" : "PDF password (if locked)"}</span>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Often your PAN or date of birth — check the bank's email"
            className="mt-2 w-full rounded-lg border border-[#ece9e1]/10 bg-black/30 px-3 py-2 text-sm text-[#ece9e1] outline-none placeholder:text-[#5a584f] focus:border-ivy/40"
          />
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#75736c]">
            <Lock className="h-3 w-3" strokeWidth={2} /> The password is used once to unlock the file, then discarded.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-leak/40 bg-leak/[0.06] px-4 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-leak/30 bg-leak/10">
            <FileWarning className="h-4.5 w-4.5 text-leak" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm text-leak">{errorMessage}</p>
            {(errorCode === "unrecognised_format" ||
              errorCode === "scanned_pdf" ||
              errorCode === "invalid_pdf") && (
              <p className="mt-1 text-xs text-[#9a978f]">
                Tip: export a CSV from your bank app (date, narration, amount, type) and drop it
                here — we&apos;ll never show a guessed number.
              </p>
            )}
          </div>
        </div>
      )}

      <button
        disabled={files.length === 0}
        onClick={() => onSubmit({ files, password: password || undefined })}
        className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ivy px-6 py-3.5 text-base font-600 text-[#10130c] transition hover:bg-ivy-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        Reveal my monthly burn
        <ArrowRight className="h-4.5 w-4.5 transition group-hover:translate-x-0.5" strokeWidth={2.2} />
      </button>

      {/* The planned fast path — not live yet */}
      <div className="mt-5">
        <AAConnect />
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-[#5a584f]">
        <span className="h-px flex-1 bg-[#ece9e1]/[0.08]" />
        no statement handy?
        <span className="h-px flex-1 bg-[#ece9e1]/[0.08]" />
      </div>

      <button
        onClick={() => onSubmit({ sample: true })}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ece9e1]/12 bg-white/[0.03] px-6 py-3 text-sm font-600 text-[#ece9e1] transition hover:bg-white/[0.06]"
      >
        <Sparkles className="h-4 w-4 text-ivy" strokeWidth={2} />
        Try it with a sample statement
      </button>

      <div className="mt-6 flex justify-center">
        <TrustBadge />
      </div>
    </div>
  );
}
