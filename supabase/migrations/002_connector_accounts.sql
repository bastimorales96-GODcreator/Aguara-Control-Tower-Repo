-- ============================================================
-- Aguara — Connector Accounts & OAuth State
-- Run this in: Supabase Dashboard → SQL Editor
-- Depends on: 001_initial_schema.sql
-- ============================================================

-- ─── connector_accounts ───────────────────────────────────────────────────────
-- Stores encrypted credentials for every ad/email connector a user links.
-- One row per (user, platform, external_account_id).
create table if not exists public.connector_accounts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,

  -- Connector type: 'meta_ads' | 'google_ads' | 'tiktok_ads' | 'klaviyo' | 'perfit'
  platform              text not null,

  -- The external account/page ID from the platform
  external_account_id   text not null,
  account_name          text,
  account_currency      text,

  -- AES-256-GCM encrypted JSON blob: { access_token, refresh_token?, expires_at? }
  encrypted_credentials text not null,

  -- 'active' | 'error' | 'revoked' | 'pending'
  status                text not null default 'active',
  error_message         text,

  last_synced_at        timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),

  unique (user_id, platform, external_account_id)
);

alter table public.connector_accounts enable row level security;

create policy "Users can manage their own connector accounts"
  on public.connector_accounts
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger trg_connector_accounts_updated_at
  before update on public.connector_accounts
  for each row execute procedure public.set_updated_at();

-- ─── oauth_states ─────────────────────────────────────────────────────────────
-- Temporary CSRF-state tokens for OAuth flows.
-- Replaces Redis/in-memory approach — safe for serverless (Vercel) deployments.
-- Records expire automatically after 10 minutes via a cron cleanup (see below).
create table if not exists public.oauth_states (
  state      text primary key,             -- random 32-byte hex string
  user_id    uuid not null references auth.users(id) on delete cascade,
  platform   text not null,               -- 'meta_ads' | 'google_ads' | 'tiktok_ads'
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '10 minutes')
);

alter table public.oauth_states enable row level security;

-- Only service_role reads/writes oauth_states (server-side routes only)
create policy "Service role manages oauth_states"
  on public.oauth_states
  for all
  using (true)
  with check (true);

-- ─── oauth_discoveries ────────────────────────────────────────────────────────
-- Temporary storage for the list of ad accounts discovered during OAuth callback,
-- before the user has selected which account(s) to connect.
-- Also replaces Redis for the account-selection step.
create table if not exists public.oauth_discoveries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  platform   text not null,
  -- JSON array of discovered accounts: [{ id, name, currency, ... }]
  accounts   jsonb not null default '[]'::jsonb,
  -- Encrypted token set stored temporarily before account selection
  encrypted_token text not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '15 minutes')
);

alter table public.oauth_discoveries enable row level security;

-- Users can read their own discoveries (needed by account-selection UI)
create policy "Users can read their own oauth_discoveries"
  on public.oauth_discoveries
  for select
  using (auth.uid() = user_id);

-- Service role writes
create policy "Service role manages oauth_discoveries"
  on public.oauth_discoveries
  for all
  using (true)
  with check (true);

-- ─── Cleanup function (call via pg_cron or Supabase scheduled functions) ──────
-- Removes expired oauth_states and oauth_discoveries.
-- Schedule: every 5 minutes.
create or replace function public.cleanup_expired_oauth()
returns void language plpgsql as $$
begin
  delete from public.oauth_states      where expires_at < now();
  delete from public.oauth_discoveries where expires_at < now();
end;
$$;

-- ─── Unified ad metrics (normalised across platforms) ─────────────────────────
-- Stores synced ad spend / performance data so the dashboard can query one table.
create table if not exists public.ad_metrics (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  connector_account_id  uuid references public.connector_accounts(id) on delete cascade,
  platform              text not null,   -- 'meta_ads' | 'google_ads' | 'tiktok_ads'
  external_account_id   text not null,

  date                  date not null,
  campaign_id           text,
  campaign_name         text,
  ad_set_id             text,
  ad_set_name           text,

  -- All monetary values stored in account currency
  currency              text not null default 'ARS',
  spend                 numeric(14, 4) default 0,
  impressions           bigint         default 0,
  clicks                bigint         default 0,
  conversions           numeric(14, 4) default 0,
  conversion_value      numeric(14, 4) default 0,

  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),

  unique (user_id, platform, external_account_id, date, campaign_id, ad_set_id)
);

alter table public.ad_metrics enable row level security;

create policy "Users can manage their own ad metrics"
  on public.ad_metrics
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_ad_metrics_user_date
  on public.ad_metrics (user_id, date desc);

create trigger trg_ad_metrics_updated_at
  before update on public.ad_metrics
  for each row execute procedure public.set_updated_at();
