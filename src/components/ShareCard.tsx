"use client";

import { useState } from "react";
import { Share2, Download, Loader2 } from "lucide-react";
import { inrGroup } from "@/lib/format";

/**
 * Privacy-safe shareable result card (PNG, drawn on a canvas). No account
 * numbers, no merchant list — just the two numbers that make people share:
 * what's oozing out, and what they can save.
 */
export function ShareCard({
  forgottenMonthly,
  annualSavings,
}: {
  forgottenMonthly: number;
  annualSavings: number;
}) {
  const [busy, setBusy] = useState(false);

  function draw(): HTMLCanvasElement {
    const W = 1080;
    const H = 1080;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;

    // Background
    ctx.fillStyle = "#08090a";
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(W / 2, 180, 0, W / 2, 180, 900);
    grad.addColorStop(0, "rgba(157,179,128,0.16)");
    grad.addColorStop(1, "rgba(8,9,10,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Logo box
    ctx.fillStyle = "#000";
    ctx.fillRect(80, 90, 168, 70);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 90, 168, 70);
    ctx.fillStyle = "#fff";
    ctx.font = "700 46px Georgia, serif";
    ctx.textBaseline = "middle";
    ctx.fillText("ooze", 104, 128);

    // Headline
    ctx.fillStyle = "#b4b0a6";
    ctx.font = "400 40px Georgia, serif";
    ctx.fillText("I found", 80, 380);

    ctx.fillStyle = "#d98a6a";
    ctx.font = "700 150px Georgia, serif";
    ctx.fillText(`₹${inrGroup(forgottenMonthly)}`, 80, 500);

    ctx.fillStyle = "#b4b0a6";
    ctx.font = "400 40px Georgia, serif";
    ctx.fillText("oozing out every month —", 80, 620);

    // Savings
    ctx.fillStyle = "#ece9e1";
    ctx.font = "400 40px Georgia, serif";
    ctx.fillText("and I can save", 80, 760);
    ctx.fillStyle = "#9DB380";
    ctx.font = "700 120px Georgia, serif";
    ctx.fillText(`₹${inrGroup(annualSavings)}`, 80, 880);
    ctx.fillStyle = "#b4b0a6";
    ctx.font = "400 40px Georgia, serif";
    ctx.fillText("a year.", 80, 980);

    // Footer
    ctx.fillStyle = "#75736c";
    ctx.font = "400 28px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("audited free with Ooze · every rupee before it oozes out", 80, 1030);

    return c;
  }

  async function share() {
    setBusy(true);
    try {
      const canvas = draw();
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) return;
      const file = new File([blob], "ooze-result.png", { type: "image/png" });

      // Native share sheet (mobile) when available, else download.
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "My Ooze audit" } as ShareData);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ooze-result.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      /* user cancelled share — ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={share}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-ivy/30 bg-ivy/10 px-3 py-2 text-xs font-600 text-ivy transition hover:bg-ivy/15 disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" strokeWidth={2} />}
      Share my result
      <Download className="h-3 w-3 opacity-60" strokeWidth={2} />
    </button>
  );
}
