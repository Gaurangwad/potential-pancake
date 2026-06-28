// Server-side PDF text extraction with password support.
// Most Indian bank statements are password-protected — that is the #1
// friction point, so we handle it as a first-class case.

import { pathToFileURL } from "url";
import { join } from "path";

// Resolve the worker file at runtime (not via a module specifier) so the
// bundler never tries to trace pdfjs's ESM worker. pdfjs is externalized in
// next.config, so it stays in node_modules at the project root.
const WORKER_PATH = join(
  process.cwd(),
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
);

export interface ExtractResult {
  /** Lines of text, reading order, joined per visual row. */
  lines: string[];
  pages: number;
}

export class PasswordRequiredError extends Error {
  constructor() {
    super("This PDF is password-protected. Enter the statement password to continue.");
    this.name = "PasswordRequiredError";
  }
}

export class WrongPasswordError extends Error {
  constructor() {
    super("That password didn't unlock the PDF. Bank PDFs often use your PAN or DOB — check the format and try again.");
    this.name = "WrongPasswordError";
  }
}

export class ScannedPdfError extends Error {
  constructor() {
    super("This looks like a scanned image, not a text PDF. We can't read it yet — try exporting a digital statement from your bank's app, or use CSV upload.");
    this.name = "ScannedPdfError";
  }
}

export class InvalidPdfError extends Error {
  constructor() {
    super("We couldn't open that file as a PDF. Make sure it's the original statement PDF from your bank, or upload a CSV (date, narration, amount, type) instead.");
    this.name = "InvalidPdfError";
  }
}

/**
 * Extract text rows from a PDF buffer. Groups text items by their Y position
 * so each visual line (a transaction row) stays intact — essential for
 * heuristic table parsing.
 */
export async function extractPdfLines(
  data: Uint8Array,
  password?: string,
): Promise<ExtractResult> {
  // Legacy build runs in Node. pdf.js still needs a workerSrc to set up its
  // (main-thread) fake worker, so point it at the resolved worker module.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(WORKER_PATH).href;

  let doc;
  try {
    doc = await pdfjs.getDocument({
      data,
      password: password || undefined,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name;
    // pdf.js raises PasswordException with .code 1 (need) / 2 (incorrect).
    const code = (err as { code?: number })?.code;
    if (name === "PasswordException") {
      if (code === 2) throw new WrongPasswordError();
      throw new PasswordRequiredError();
    }
    if (name === "InvalidPDFException" || name === "MissingPDFException") {
      throw new InvalidPdfError();
    }
    throw err;
  }

  const lines: string[] = [];
  let totalChars = 0;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Bucket items by rounded Y, then sort each row left-to-right by X.
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      if (!("str" in item)) continue;
      const str = item.str;
      if (!str.trim()) continue;
      totalChars += str.length;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      const arr = rows.get(y) ?? [];
      arr.push({ x, s: str });
      rows.set(y, arr);
    }
    const ys = Array.from(rows.keys()).sort((a, b) => b - a); // top-to-bottom
    for (const y of ys) {
      const cells = rows.get(y)!.sort((a, b) => a.x - b.x);
      const line = cells.map((c) => c.s).join(" ").replace(/\s+/g, " ").trim();
      if (line) lines.push(line);
    }
  }

  // A digital statement of any length yields plenty of text. Near-empty text
  // with pages present is the tell-tale of a scanned/image PDF.
  if (totalChars < 40 && doc.numPages >= 1) {
    throw new ScannedPdfError();
  }

  return { lines, pages: doc.numPages };
}
