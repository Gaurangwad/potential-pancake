-- Ooze — Supabase schema.
-- Run in the Supabase SQL editor. The app uses the service-role key server-side
-- only; access is never exposed to the browser, so RLS can stay restrictive.

create table if not exists public.users (
  phone           text primary key,
  created_at      timestamptz not null default now(),
  premium_active  boolean      not null default false,
  premium_plan    text,
  premium_source  text         not null default 'none',
  premium_since   timestamptz,
  payment_id      text,
  order_id        text,
  subscription_id text
);

create table if not exists public.audit_snapshots (
  id                       bigint generated always as identity primary key,
  phone                    text not null references public.users(phone) on delete cascade,
  at                       timestamptz not null default now(),
  monthly_burn             integer not null default 0,
  waste_monthly            integer not null default 0,
  potential_annual_savings integer not null default 0,
  health_score             integer not null default 0
);

create index if not exists audit_snapshots_phone_at_idx
  on public.audit_snapshots (phone, at);

-- Short-lived OTPs. Stored here (not in-memory) so verification works across
-- serverless instances on Vercel.
create table if not exists public.otps (
  phone      text primary key,
  code       text   not null,
  expires_at bigint not null,
  attempts   integer not null default 0
);

-- Server-only access via the service role. Enable RLS and add no public
-- policies so the anon key cannot read/write these tables.
alter table public.users enable row level security;
alter table public.audit_snapshots enable row level security;
alter table public.otps enable row level security;
