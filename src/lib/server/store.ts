import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { supabase } from "./supabase";

// Persistence for users + their premium status + pending OTPs.
//
// Default: a local JSON file under .data/ — zero setup, works out of the box
// for testing. For production, swap this module's read/write for Supabase
// Postgres (the function signatures below are the contract to implement
// against: getUser, upsertUser, setPremium, saveOtp, readOtp, clearOtp).

export type PremiumSource = "razorpay" | "demo" | "none";

export interface PremiumState {
  active: boolean;
  plan?: string;
  source: PremiumSource;
  since?: string;
  // Razorpay references kept for the webhook/source-of-truth reconciliation.
  paymentId?: string;
  orderId?: string;
  subscriptionId?: string;
}

export interface User {
  phone: string;
  createdAt: string;
  premium: PremiumState;
}

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

/** One re-audit snapshot — the basis for the savings-over-time analysis. */
export interface AuditSnapshot {
  at: string; // ISO date
  monthlyBurn: number;
  wasteMonthly: number;
  potentialAnnualSavings: number;
  healthScore: number;
}

interface DB {
  users: Record<string, User>;
  otps: Record<string, OtpRecord>;
  audits: Record<string, AuditSnapshot[]>; // by phone
}

// On Vercel the project dir is read-only — only /tmp is writable (and it's
// per-instance + ephemeral). So when the JSON store is used at all on Vercel
// it lives in /tmp. For real, persistent, multi-instance state, configure
// Supabase (the branches below switch to it automatically).
const DATA_DIR = process.env.VERCEL ? join(tmpdir(), "ooze-data") : join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "ooze.json");

let cache: DB | null = null;

async function load(): Promise<DB> {
  if (cache) return cache;
  let db: DB = { users: {}, otps: {}, audits: {} };
  try {
    const parsed = JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as Partial<DB>;
    db = {
      users: parsed.users ?? {},
      otps: parsed.otps ?? {},
      audits: parsed.audits ?? {},
    };
  } catch {
    // No file yet — start empty.
  }
  cache = db;
  return db;
}

async function persist(db: DB): Promise<void> {
  cache = db;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

// ---- users (Supabase when configured, else JSON) ----

interface UserRow {
  phone: string;
  created_at: string;
  premium_active: boolean;
  premium_plan: string | null;
  premium_source: string | null;
  premium_since: string | null;
  payment_id: string | null;
  order_id: string | null;
  subscription_id: string | null;
}

function rowToUser(r: UserRow): User {
  return {
    phone: r.phone,
    createdAt: r.created_at,
    premium: {
      active: r.premium_active,
      plan: r.premium_plan ?? undefined,
      source: (r.premium_source as PremiumSource) ?? "none",
      since: r.premium_since ?? undefined,
      paymentId: r.payment_id ?? undefined,
      orderId: r.order_id ?? undefined,
      subscriptionId: r.subscription_id ?? undefined,
    },
  };
}

export async function getUser(phone: string): Promise<User | undefined> {
  const sb = supabase();
  if (sb) {
    const { data } = await sb.from("users").select("*").eq("phone", phone).maybeSingle();
    return data ? rowToUser(data as UserRow) : undefined;
  }
  const db = await load();
  return db.users[phone];
}

export async function upsertUser(phone: string): Promise<User> {
  const sb = supabase();
  if (sb) {
    const existing = await getUser(phone);
    if (existing) return existing;
    const row: UserRow = {
      phone,
      created_at: new Date().toISOString(),
      premium_active: false,
      premium_plan: null,
      premium_source: "none",
      premium_since: null,
      payment_id: null,
      order_id: null,
      subscription_id: null,
    };
    await sb.from("users").insert(row);
    return rowToUser(row);
  }
  const db = await load();
  if (!db.users[phone]) {
    db.users[phone] = {
      phone,
      createdAt: new Date().toISOString(),
      premium: { active: false, source: "none" },
    };
    await persist(db);
  }
  return db.users[phone];
}

export async function setPremium(phone: string, premium: PremiumState): Promise<User> {
  const sb = supabase();
  if (sb) {
    await upsertUser(phone);
    await sb
      .from("users")
      .update({
        premium_active: premium.active,
        premium_plan: premium.plan ?? null,
        premium_source: premium.source,
        premium_since: premium.since ?? null,
        payment_id: premium.paymentId ?? null,
        order_id: premium.orderId ?? null,
        subscription_id: premium.subscriptionId ?? null,
      })
      .eq("phone", phone);
    return (await getUser(phone))!;
  }
  const db = await load();
  const user = db.users[phone] ?? (await upsertUser(phone), (await load()).users[phone]);
  user.premium = premium;
  db.users[phone] = user;
  await persist(db);
  return user;
}

export async function saveOtp(phone: string, code: string, ttlMs: number): Promise<void> {
  const sb = supabase();
  if (sb) {
    await sb
      .from("otps")
      .upsert({ phone, code, expires_at: Date.now() + ttlMs, attempts: 0 });
    return;
  }
  const db = await load();
  db.otps[phone] = { code, expiresAt: Date.now() + ttlMs, attempts: 0 };
  await persist(db);
}

export async function readOtp(phone: string): Promise<OtpRecord | undefined> {
  const sb = supabase();
  if (sb) {
    const { data } = await sb.from("otps").select("*").eq("phone", phone).maybeSingle();
    if (!data) return undefined;
    return { code: data.code, expiresAt: Number(data.expires_at), attempts: data.attempts };
  }
  const db = await load();
  return db.otps[phone];
}

export async function bumpOtpAttempts(phone: string): Promise<number> {
  const sb = supabase();
  if (sb) {
    const rec = await readOtp(phone);
    if (!rec) return 0;
    const attempts = rec.attempts + 1;
    await sb.from("otps").update({ attempts }).eq("phone", phone);
    return attempts;
  }
  const db = await load();
  const rec = db.otps[phone];
  if (!rec) return 0;
  rec.attempts += 1;
  await persist(db);
  return rec.attempts;
}

export async function clearOtp(phone: string): Promise<void> {
  const sb = supabase();
  if (sb) {
    await sb.from("otps").delete().eq("phone", phone);
    return;
  }
  const db = await load();
  delete db.otps[phone];
  await persist(db);
}

/** DPDP: erase everything we hold for a phone — account, snapshots, OTPs. */
export async function deleteUser(phone: string): Promise<void> {
  const sb = supabase();
  if (sb) {
    await sb.from("audit_snapshots").delete().eq("phone", phone);
    await sb.from("otps").delete().eq("phone", phone);
    await sb.from("users").delete().eq("phone", phone);
    return;
  }
  const db = await load();
  delete db.users[phone];
  delete db.audits[phone];
  delete db.otps[phone];
  await persist(db);
}

const DAY = 86_400_000;

/**
 * Append today's snapshot (one per day — re-viewing replaces today's). Returns
 * the full history, newest last.
 */
interface SnapRow {
  at: string;
  monthly_burn: number;
  waste_monthly: number;
  potential_annual_savings: number;
  health_score: number;
}
function rowToSnap(r: SnapRow): AuditSnapshot {
  return {
    at: r.at,
    monthlyBurn: r.monthly_burn,
    wasteMonthly: r.waste_monthly,
    potentialAnnualSavings: r.potential_annual_savings,
    healthScore: r.health_score,
  };
}
function snapToRow(phone: string, s: AuditSnapshot) {
  return {
    phone,
    at: s.at,
    monthly_burn: s.monthlyBurn,
    waste_monthly: s.wasteMonthly,
    potential_annual_savings: s.potentialAnnualSavings,
    health_score: s.healthScore,
  };
}

export async function addAuditSnapshot(
  phone: string,
  snap: AuditSnapshot,
): Promise<AuditSnapshot[]> {
  const today = snap.at.slice(0, 10);
  const sb = supabase();
  if (sb) {
    await sb
      .from("audit_snapshots")
      .delete()
      .eq("phone", phone)
      .gte("at", `${today}T00:00:00Z`)
      .lte("at", `${today}T23:59:59Z`);
    await sb.from("audit_snapshots").insert(snapToRow(phone, snap));
    return getAuditHistory(phone);
  }
  const db = await load();
  const list = db.audits[phone] ?? [];
  const filtered = list.filter((s) => s.at.slice(0, 10) !== today);
  filtered.push(snap);
  filtered.sort((a, b) => a.at.localeCompare(b.at));
  db.audits[phone] = filtered;
  await persist(db);
  return filtered;
}

export async function getAuditHistory(phone: string): Promise<AuditSnapshot[]> {
  const sb = supabase();
  if (sb) {
    const { data } = await sb
      .from("audit_snapshots")
      .select("*")
      .eq("phone", phone)
      .order("at", { ascending: true });
    return (data ?? []).map((r) => rowToSnap(r as SnapRow));
  }
  const db = await load();
  return db.audits[phone] ?? [];
}

/**
 * Seed a few months of prior snapshots so the savings-trend graph is meaningful
 * on the very first visit. Only used for the free demo account.
 */
export async function seedDemoHistory(phone: string, current: AuditSnapshot): Promise<void> {
  if ((await getAuditHistory(phone)).length > 1) return;
  const months = 4;
  const seeded: AuditSnapshot[] = [];
  for (let i = months; i >= 1; i--) {
    // Earlier months: higher waste, lower savings, lower health — a real climb.
    const factor = 1 + i * 0.22;
    seeded.push({
      at: new Date(Date.now() - i * 30 * DAY).toISOString(),
      monthlyBurn: Math.round(current.monthlyBurn * (1 + i * 0.04)),
      wasteMonthly: Math.round(current.wasteMonthly * factor),
      potentialAnnualSavings: Math.round(current.potentialAnnualSavings * factor),
      healthScore: Math.max(5, Math.round(current.healthScore - i * 9)),
    });
  }
  const sb = supabase();
  if (sb) {
    await sb.from("audit_snapshots").insert(seeded.map((s) => snapToRow(phone, s)));
    return;
  }
  const db = await load();
  db.audits[phone] = seeded;
  await persist(db);
}
