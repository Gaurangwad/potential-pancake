import { NextRequest, NextResponse } from "next/server";
import { extractPdfLines, PasswordRequiredError, WrongPasswordError, ScannedPdfError, InvalidPdfError } from "@/lib/parse/pdf";
import { parseStatement, parseCsv } from "@/lib/parse/banks";
import { resolveBatch } from "@/lib/categorise";
import { buildAudit } from "@/lib/recurring";
import { sampleTransactions } from "@/lib/sample";
import { fetchTransactions as aaFetch } from "@/lib/server/aa";
import { getRatesToINR } from "@/lib/server/fx";
import { currentUser } from "@/lib/server/auth";
import type { Transaction } from "@/lib/types";

// Node runtime — pdfjs needs Node APIs, not the Edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Privacy: nothing here is persisted. The buffer lives only for this request.
export const fetchCache = "force-no-store";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const mode = String(form.get("mode") || "");

    let txns: Transaction[];
    let bank: string | undefined;
    let statementKind: "bank" | "card" = "bank";
    const notes: string[] = [];

    if (mode === "sample") {
      txns = sampleTransactions();
      bank = "Sample statement";
    } else if (mode === "aa") {
      // Account Aggregator autofetch — requires a signed-in user (the phone is
      // the AA identifier). Consent is captured client-side before this call.
      const user = await currentUser();
      if (!user) return coded("auth_required", "Sign in to auto-fetch via Account Aggregator.", 401);
      const accounts = String(form.get("accounts") || "").split(",").filter(Boolean);
      txns = await aaFetch(user.phone, accounts);
      bank = "Account Aggregator";
    } else {
      // One or more statements — parsed and MERGED into a single audit.
      const files = form.getAll("file").filter((f): f is File => f instanceof File);
      if (files.length === 0) {
        return bad("Please choose at least one statement to audit.", 400);
      }
      const password = (form.get("password") as string) || undefined;
      const banks = new Set<string>();
      let parsedGeneric = false;
      txns = [];

      for (const file of files) {
        if (file.size > MAX_BYTES) {
          return bad(`"${file.name}" is larger than 12 MB. Upload statements one window at a time.`, 400);
        }
        const buf = new Uint8Array(await file.arrayBuffer());
        if (file.name.toLowerCase().endsWith(".csv")) {
          txns.push(...parseCsv(new TextDecoder().decode(buf)));
          banks.add("CSV upload");
          continue;
        }
        let lines: string[];
        try {
          ({ lines } = await extractPdfLines(buf, password));
        } catch (err) {
          if (err instanceof PasswordRequiredError) return coded("password_required", err.message, 401);
          if (err instanceof WrongPasswordError) return coded("wrong_password", err.message, 401);
          if (err instanceof ScannedPdfError) return coded("scanned_pdf", err.message, 422);
          if (err instanceof InvalidPdfError) return coded("invalid_pdf", err.message, 422);
          throw err;
        }
        const result = parseStatement(lines);
        txns.push(...result.txns);
        if (result.bank) banks.add(result.bank);
        else parsedGeneric = true;
        if (result.kind === "card") statementKind = "card";
      }

      if (txns.length < 3) {
        // Fail loud + helpful — never show a wrong number on a money app.
        return coded(
          "unrecognised_format",
          "We couldn't confidently read a transaction table from those file(s). You can upload a CSV (date, narration, amount, type) instead — we'll never show you a guessed number.",
          422,
        );
      }
      bank =
        banks.size === 1 ? [...banks][0] : banks.size > 1 ? `${banks.size} accounts merged` : undefined;
      if (files.length > 1) notes.push(`Merged ${files.length} statements into one audit.`);
      if (parsedGeneric) notes.push("A bank layout wasn't specifically recognised — parsed with our generic reader. Double-check anything that looks off.");
    }

    // Privacy: send only narration strings to Claude (no amounts/names/account no).
    const { map, usedAI } = await resolveBatch(txns.map((t) => t.narration));
    const resolve = (n: string) => map[n.trim()] ?? { merchant: n, category: "unknown" as const, isAutoPay: false };

    // Real-time FX rates (cached, with static fallback) for any foreign charges.
    const fx = await getRatesToINR();
    const audit = buildAudit(txns, resolve, {
      bank,
      statementKind,
      usedAI,
      notes,
      fxRates: fx.rates,
      fxAsOf: fx.asOf,
      fxLive: fx.live,
    });
    return NextResponse.json(audit, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("audit failed:", err);
    return bad("Something went wrong reading that statement. Please try another file or the CSV fallback.", 500);
  }
}

function bad(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function coded(code: string, message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}
