import Anthropic from "@anthropic-ai/sdk";
import type { Category } from "./types";
import { resolveNarration } from "./merchants";

export interface NarrationResolution {
  merchant: string;
  category: Category;
  isAutoPay: boolean;
}

/**
 * Resolve a batch of unique narrations to clean merchant + category.
 *
 * Privacy: we send ONLY narration strings (no names, account numbers,
 * balances or amounts). Heuristics run first; Claude is asked to refine
 * only the ones the merchant pack couldn't confidently resolve.
 *
 * Always returns a full map. If the API key is absent or the call fails,
 * we fall back to pure heuristics — the audit never breaks.
 */
export async function resolveBatch(
  narrations: string[],
): Promise<{ map: Record<string, NarrationResolution>; usedAI: boolean }> {
  const unique = Array.from(new Set(narrations.map((n) => n.trim()).filter(Boolean)));
  const map: Record<string, NarrationResolution> = {};
  for (const n of unique) map[n] = resolveNarration(n);

  const key = process.env.ANTHROPIC_API_KEY;
  // Only bother Claude with the ones heuristics left as "unknown".
  const fuzzy = unique.filter((n) => map[n].category === "unknown");
  if (!key || fuzzy.length === 0) {
    return { map, usedAI: false };
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const refined = await refineWithClaude(client, fuzzy);
    for (const r of refined) {
      if (!r?.narration) continue;
      const prev = map[r.narration];
      if (!prev) continue;
      map[r.narration] = {
        merchant: r.merchant || prev.merchant,
        category: (r.category as Category) || prev.category,
        isAutoPay: prev.isAutoPay || !!r.isAutoPay,
      };
    }
    return { map, usedAI: true };
  } catch (err) {
    console.error("Claude categorisation failed, using heuristics:", err);
    return { map, usedAI: false };
  }
}

interface ClaudeRow {
  narration: string;
  merchant: string;
  category: string;
  isAutoPay?: boolean;
}

async function refineWithClaude(
  client: Anthropic,
  narrations: string[],
): Promise<ClaudeRow[]> {
  const list = narrations.map((n, i) => `${i + 1}. ${n}`).join("\n");

  const system = [
    "You normalise messy Indian bank statement narration strings.",
    "For each line, identify the clean merchant/payee name and a category.",
    "Categories (use exactly one): subscription, utility, emi, investment, rent, insurance, unknown.",
    "Rules:",
    "- SIP / mutual fund / RD / NPS / PPF => investment (NEVER subscription).",
    "- Loan / EMI / instalment => emi.",
    "- Telecom recharge, electricity, broadband, gas, water => utility.",
    "- Streaming, SaaS, app memberships, news paywalls => subscription.",
    "- If you cannot tell, use unknown and your best guess at the merchant.",
    "- isAutoPay=true when the narration shows MANDATE / NACH / ENACH / AUTOPAY / SI / e-mandate.",
    "Return STRICT JSON only — an array, no prose, no markdown fences.",
    'Each element: {"narration": string (echo input verbatim), "merchant": string, "category": string, "isAutoPay": boolean}.',
  ].join("\n");

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system,
    messages: [
      {
        role: "user",
        content: `Normalise these ${narrations.length} narrations:\n${list}`,
      },
    ],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return parseJsonArray(text);
}

/** Defensive JSON parse — tolerate stray fences or prose around the array. */
function parseJsonArray(text: string): ClaudeRow[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
