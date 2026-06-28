import {
  Repeat,
  AlertTriangle,
  TrendingUp,
  Copy,
  Sparkles,
  CalendarClock,
  Wallet,
  Tv,
  Music,
  Dumbbell,
  Newspaper,
  Cloud,
  Bot,
  Smartphone,
  Wifi,
  PiggyBank,
  Landmark,
  ShieldCheck,
  Home,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { Category, LeakFlag } from "@/lib/types";

// Strict rule: Lucide icons only, never emoji.

const MERCHANT_ICON: Record<string, LucideIcon> = {
  Netflix: Tv,
  JioHotstar: Tv,
  "Amazon Prime": Tv,
  SonyLIV: Tv,
  ZEE5: Tv,
  Spotify: Music,
  "YouTube Premium: ": Music,
  "YouTube Premium": Music,
  "Cult.fit": Dumbbell,
  "TOI+": Newspaper,
  "ET Prime": Newspaper,
  Apple: Cloud,
  "Google One": Cloud,
  "ChatGPT (OpenAI)": Bot,
  "Claude (Anthropic)": Bot,
};

const CATEGORY_ICON: Record<Category, LucideIcon> = {
  subscription: Repeat,
  utility: Wifi,
  emi: Landmark,
  investment: PiggyBank,
  rent: Home,
  insurance: ShieldCheck,
  unknown: HelpCircle,
};

export function iconForItem(merchant: string, category: Category): LucideIcon {
  if (MERCHANT_ICON[merchant]) return MERCHANT_ICON[merchant];
  if (merchant.toLowerCase().includes("jio") || merchant.toLowerCase().includes("airtel"))
    return Smartphone;
  return CATEGORY_ICON[category] ?? HelpCircle;
}

export const FLAG_META: Record<LeakFlag, { label: string; icon: LucideIcon; tone: "leak" | "warn" | "ivy" }> = {
  forgotten: { label: "Likely forgotten", icon: AlertTriangle, tone: "leak" },
  duplicate: { label: "Duplicate service", icon: Copy, tone: "leak" },
  "price-creep": { label: "Price went up", icon: TrendingUp, tone: "warn" },
  "trial-converted": { label: "Trial just converted", icon: Sparkles, tone: "warn" },
  "annual-arbitrage": { label: "Annual plan is cheaper", icon: Wallet, tone: "ivy" },
  autopay: { label: "Auto-debit (UPI AutoPay / mandate)", icon: CalendarClock, tone: "warn" },
};
