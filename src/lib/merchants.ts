import type { Category } from "./types";

export interface MerchantRule {
  /** Clean display name. */
  name: string;
  /** Lowercased substrings to match inside a bank narration. */
  match: string[];
  category: Category;
  /** A short Lucide icon hint the UI maps to a component. */
  icon?: string;
  /** Typical monthly price band (rupees) — helps trial/price-creep heuristics. */
  typical?: number;
  /** Cancel-assist hint surfaced in the dashboard. */
  cancelHint?: string;
}

// Pre-seeded Indian merchant pack. Order matters: more specific first.
export const MERCHANTS: MerchantRule[] = [
  // ---- Streaming / OTT ----
  { name: "Netflix", match: ["netflix"], category: "subscription", typical: 499, cancelHint: "Account → Membership → Cancel Membership." },
  { name: "JioHotstar", match: ["hotstar", "jiohotstar", "disney"], category: "subscription", typical: 299, cancelHint: "Profile → Subscriptions → Manage." },
  { name: "Amazon Prime", match: ["prime video", "amazon prime", "amzn prime", "primevideo"], category: "subscription", typical: 299, cancelHint: "Amazon → Prime Membership → End Membership." },
  { name: "SonyLIV", match: ["sonyliv", "sony liv"], category: "subscription", typical: 299 },
  { name: "ZEE5", match: ["zee5", "zee 5"], category: "subscription", typical: 299 },
  { name: "Spotify", match: ["spotify"], category: "subscription", typical: 119, cancelHint: "Account → Subscription → Cancel Premium." },
  { name: "YouTube Premium", match: ["youtube prem", "youtubeprem", "google youtube", "g.co/yt"], category: "subscription", typical: 149 },
  { name: "Apple", match: ["apple.com", "itunes", "apple services", "icloud", "apple india"], category: "subscription", typical: 75 },
  { name: "Google One", match: ["google one", "google storage", "google one india"], category: "subscription", typical: 130 },

  // ---- Streaming / OTT (regional + niche) ----
  { name: "Sun NXT", match: ["sun nxt", "sunnxt"], category: "subscription", typical: 50 },
  { name: "aha", match: ["aha video", "aha ott"], category: "subscription", typical: 199 },
  { name: "Discovery+", match: ["discovery+", "discovery plus"], category: "subscription", typical: 299 },
  { name: "Crunchyroll", match: ["crunchyroll"], category: "subscription", typical: 79 },
  { name: "Audible", match: ["audible"], category: "subscription", typical: 199 },
  { name: "Kindle Unlimited", match: ["kindle unltd", "kindle unlimited"], category: "subscription", typical: 169 },

  // ---- Productivity / AI / SaaS ----
  { name: "ChatGPT (OpenAI)", match: ["openai", "chatgpt"], category: "subscription", typical: 1999 },
  { name: "Claude (Anthropic)", match: ["anthropic", "claude.ai"], category: "subscription", typical: 1700 },
  { name: "Adobe", match: ["adobe"], category: "subscription", typical: 1675 },
  { name: "Canva", match: ["canva"], category: "subscription", typical: 500 },
  { name: "Microsoft 365", match: ["microsoft", "msft", "office 365", "ms 365"], category: "subscription", typical: 489 },
  { name: "Google Workspace", match: ["google workspace", "gsuite", "g suite"], category: "subscription", typical: 736 },
  { name: "Notion", match: ["notion"], category: "subscription", typical: 800 },
  { name: "Grammarly", match: ["grammarly"], category: "subscription", typical: 1000 },
  { name: "Dropbox", match: ["dropbox"], category: "subscription", typical: 1100 },
  { name: "GitHub", match: ["github"], category: "subscription", typical: 350 },
  { name: "Figma", match: ["figma"], category: "subscription", typical: 1000 },
  { name: "Zoom", match: ["zoom.us", "zoom video"], category: "subscription", typical: 1300 },
  { name: "LinkedIn Premium", match: ["linkedin"], category: "subscription", typical: 1400 },

  // ---- Edtech ----
  { name: "Coursera", match: ["coursera"], category: "subscription", typical: 4000 },
  { name: "Udemy", match: ["udemy"], category: "subscription", typical: 500 },
  { name: "Unacademy", match: ["unacademy"], category: "subscription", typical: 999 },
  { name: "Duolingo", match: ["duolingo"], category: "subscription", typical: 569 },

  // ---- Dating ----
  { name: "Tinder", match: ["tinder"], category: "subscription", typical: 599 },
  { name: "Bumble", match: ["bumble"], category: "subscription", typical: 599 },

  // ---- Food / lifestyle memberships (membership only — NOT one-off orders) ----
  { name: "Swiggy One", match: ["swiggy one", "swiggyone"], category: "subscription", typical: 149 },
  { name: "Zomato Gold", match: ["zomato gold", "zomato one", "zomatogold"], category: "subscription", typical: 149 },
  { name: "Cult.fit", match: ["cult.fit", "cultfit", "curefit", "cult fit"], category: "subscription", typical: 999, cancelHint: "App → Membership → Pause or Cancel." },
  { name: "Gold's Gym", match: ["golds gym", "gold's gym"], category: "subscription", typical: 2500 },
  { name: "Anytime Fitness", match: ["anytime fitness"], category: "subscription", typical: 2500 },

  // ---- News paywalls ----
  { name: "TOI+", match: ["toi+", "times of india", "toi plus"], category: "subscription", typical: 99 },
  { name: "ET Prime", match: ["et prime", "economic times prime", "etprime"], category: "subscription", typical: 299 },
  { name: "The Hindu", match: ["the hindu sub", "thehindu"], category: "subscription", typical: 149 },
  { name: "Mint", match: ["livemint", "mint sub"], category: "subscription", typical: 199 },
  { name: "Indian Express", match: ["indian express sub", "indianexpress"], category: "subscription", typical: 149 },

  // ---- Telecom (utility, recurring but not waste by default) ----
  { name: "Jio", match: ["jio recharge", "reliance jio", "jio prepaid", "jio postpaid", "jio "], category: "utility", typical: 299 },
  { name: "Airtel", match: ["airtel"], category: "utility", typical: 299 },
  { name: "Vi (Vodafone Idea)", match: ["vodafone", "vi recharge", "idea cellular"], category: "utility", typical: 299 },

  // ---- DTH / cable ----
  { name: "Tata Play", match: ["tata play", "tata sky"], category: "utility", typical: 350 },
  { name: "Dish TV", match: ["dish tv", "dishtv"], category: "utility", typical: 300 },
  { name: "d2h", match: ["d2h", "videocon d2h"], category: "utility", typical: 300 },

  // ---- Utilities ----
  { name: "Electricity (BESCOM)", match: ["bescom", "electricity", "tata power", "adani electric", "msedcl", "tneb", "torrent power"], category: "utility" },
  { name: "Broadband", match: ["act fibernet", "act broadband", "hathway", "excitel", "jiofiber", "jio fiber", "airtel xstream", "broadband"], category: "utility", typical: 799 },
  { name: "Gas (PNG)", match: ["gas connection", "indraprastha gas", "mahanagar gas", "png "], category: "utility" },
  { name: "Water bill", match: ["water bill", "jal board", "bwssb", "water supply"], category: "utility" },
  { name: "FASTag recharge", match: ["fastag", "fas tag", "netc fastag"], category: "utility", typical: 500 },
];

const INVESTMENT_HINTS = [
  "sip", "mutual fund", "mf ", "groww", "zerodha", "coin", "kuvera",
  "et money", "indmoney", "nav ", "folio", "recurring deposit", " rd ",
  "rd a/c", "ppf", "elss", "nps", "smallcase", "axis mf", "hdfc mf",
  "icici pru", "sbi mf", "nippon", "uti mf", "lumpsum",
  // more platforms / instruments
  "paytm money", "angel one", "angelone", "motilal", "fundsindia",
  "scripbox", "dhan", "upstox", "5paisa", "navi mf", "jar app", "stockal",
  "sukanya", "ssa ", "nps tier", "sov gold", "sgb",
];

// Lenders / NBFCs — used to recognise EMIs even on a single debit.
const LENDER_HINTS = [
  "bajaj fin", "bajaj finserv", "hdb financial", "tata capital",
  "fullerton", "muthoot", "manappuram", "cholamandalam", "shriram",
  "aditya birla fin", "l&t fin", "poonawalla", "kreditbee", "moneyview",
  "navi loan", "paysense", "cashe", "incred",
];

const EMI_HINTS = [
  "emi", "loan", "instalment", "installment", "no cost emi", "nocost emi",
  "cred pay emi", "home loan", "car loan", "auto loan", "two wheeler loan",
  "personal loan", "education loan", "gold loan", "loan repay", "loan repmt",
  ...LENDER_HINTS,
];

const INSURANCE_HINTS = [
  "insurance", "lic ", "lic of india", "policy", "premium ins", "hdfc life",
  "icici pru life", "icici lombard", "max life", "term plan", "star health",
  "niva bupa", "care health", "acko", "digit", "bajaj allianz", "tata aig",
  "sbi life", "kotak life", "pnb metlife", "new india assurance",
  "health insurance", "motor insurance", "vehicle insurance",
];

const RENT_HINTS = ["rent", "nobroker rent", "rentpay", "housing rent", "landlord"];

const AUTOPAY_HINTS = [
  "mandate", "autopay", "auto pay", "e-mandate", "emandate", "enach",
  "nach", "ach/d", "ach d", "si/", "/si ", "standing instruction",
  "upi autopay", "auto debit", "auto-debit", "recurring/",
];

export interface Resolved {
  merchant: string;
  category: Category;
  isAutoPay: boolean;
}

/**
 * Match a hint against a narration. Short alphabetic hints ("emi", "si", "rd",
 * "mf") are matched on WORD BOUNDARIES so they don't trigger inside unrelated
 * words — e.g. "emi" must never match inside "prEMIum". Hints that contain
 * punctuation (e.g. "ach/d", "si/") fall back to substring matching.
 */
function hintMatch(s: string, hint: string): boolean {
  const h = hint.trim();
  if (/^[a-z0-9 ]+$/.test(h)) {
    const re = new RegExp(`\\b${h.replace(/ +/g, "\\s+")}\\b`);
    return re.test(s);
  }
  return s.includes(h);
}

function anyHint(s: string, hints: string[]): boolean {
  return hints.some((h) => hintMatch(s, h));
}

/** Pure-heuristic resolution of a raw narration. Claude can refine later. */
export function resolveNarration(raw: string): Resolved {
  const s = raw.toLowerCase();
  const isAutoPay = anyHint(s, AUTOPAY_HINTS);

  // Protected categories take precedence — never mislabel an SIP as waste.
  if (anyHint(s, INVESTMENT_HINTS))
    return { merchant: prettyFallback(raw), category: "investment", isAutoPay };
  if (anyHint(s, INSURANCE_HINTS))
    return { merchant: prettyFallback(raw), category: "insurance", isAutoPay };
  if (anyHint(s, EMI_HINTS))
    return { merchant: prettyFallback(raw), category: "emi", isAutoPay };
  if (anyHint(s, RENT_HINTS))
    return { merchant: "Rent", category: "rent", isAutoPay };

  for (const m of MERCHANTS) {
    if (m.match.some((token) => s.includes(token))) {
      return { merchant: m.name, category: m.category, isAutoPay };
    }
  }

  return { merchant: prettyFallback(raw), category: "unknown", isAutoPay };
}

export function merchantRule(name: string): MerchantRule | undefined {
  return MERCHANTS.find((m) => m.name === name);
}

// Direct "manage / cancel subscription" deep links — effort reduction at the
// cancel step (the moment intent is highest). Free, not gated.
export const CANCEL_URLS: Record<string, string> = {
  Netflix: "https://www.netflix.com/cancelplan",
  Spotify: "https://www.spotify.com/account/subscription/",
  JioHotstar: "https://www.hotstar.com/in/subscribe/my-account",
  "Amazon Prime": "https://www.amazon.in/gp/primecentral",
  "YouTube Premium": "https://www.youtube.com/paid_memberships",
  Apple: "https://apps.apple.com/account/subscriptions",
  "Google One": "https://one.google.com/settings",
  "Cult.fit": "https://www.cult.fit/",
  "Swiggy One": "https://www.swiggy.com/my-account",
  "Zomato Gold": "https://www.zomato.com/gold",
  "ChatGPT (OpenAI)": "https://chatgpt.com/#settings/Subscription",
  Adobe: "https://account.adobe.com/plans",
  Canva: "https://www.canva.com/settings/billing-and-teams",
  "Microsoft 365": "https://account.microsoft.com/services",
  "LinkedIn Premium": "https://www.linkedin.com/premium/manage/",
  SonyLIV: "https://www.sonyliv.com/myaccount",
  ZEE5: "https://www.zee5.com/myaccount",
};

export function cancelUrlFor(name: string): string | undefined {
  return CANCEL_URLS[name];
}

// Section 80C / 80CCD tax-saving instruments. ELSS, PPF, NPS, Sukanya, life
// insurance and term plans reduce taxable income (₹1.5L cap under 80C). Used to
// surface unused 80C headroom — the freelancer/salaried wedge.
const TAX_80C_HINTS = [
  "elss", "ppf", "public provident", "nps", "national pension", "sukanya",
  "tax saver", "taxsaver", "ulip", "life insurance", "term plan", "lic ",
  "lic of india", "hdfc life", "sbi life", "icici pru life", "max life",
  "kotak life", "tata aia", "80c",
];

export function is80C(narration: string): boolean {
  return anyHint(narration.toLowerCase(), TAX_80C_HINTS);
}

/**
 * Best-effort clean name from a messy UPI/NACH narration when we don't
 * recognise the brand. e.g. "UPI/8472/SOMEVENDOR PVT/HDFC" -> "Somevendor Pvt".
 */
export function prettyFallback(raw: string): string {
  const cleaned = raw
    .replace(/\b(upi|ach|nach|imps|neft|mandate|autopay|si|p2m|p2a)\b/gi, " ")
    .replace(/\b[a-z]{2,5}\d{4,}\b/gi, " ") // ref ids
    .replace(/\b\d{6,}\b/g, " ") // long numbers
    .replace(/[\/@.\-_*|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Pick the longest alpha token group — usually the merchant.
  const parts = cleaned.split(" ").filter((p) => /[a-z]/i.test(p) && p.length > 1);
  const candidate = parts.slice(0, 3).join(" ") || cleaned || raw;
  return candidate
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 40)
    .trim();
}
