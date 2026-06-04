-- ============================================================
-- Aguara — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Store connections (Shopify / Tiendanube) ─────────────────────────────────
create table if not exists public.store_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  platform      text not null,           -- 'shopify' | 'tiendanube'
  store_id      text not null,           -- shop domain or store numeric ID
  store_name    text,
  store_url     text,
  access_token  text not null,
  scope         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (user_id, platform, store_id)
);

alter table public.store_connections enable row level security;

create policy "Users can manage their own store connections"
  on public.store_connections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Subscriptions (Stripe) ────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  plan                    text not null default 'starter',  -- 'starter' | 'growth' | 'pro'
  status                  text not null default 'trialing', -- 'trialing' | 'active' | 'cancelled' | 'past_due'
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),
  unique (user_id)
);

alter table public.subscriptions enable row level security;

create policy "Users can read their own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- Only service_role can write (webhook upserts)
create policy "Service role can manage subscriptions"
  on public.subscriptions
  for all
  using (true)
  with check (true);

-- ─── Expenses / Gastos operativos ─────────────────────────────────────────────
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  amount      numeric(12, 2) not null,
  currency    text not null default 'ARS',
  category    text,
  month       text,   -- 'YYYY-MM'
  created_at  timestamptz default now()
);

alter table public.expenses enable row level security;

create policy "Users can manage their own expenses"
  on public.expenses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Products (maestro) ────────────────────────────────────────────────────────
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  external_id   text,
  name          text not null,
  sku           text,
  cost          numeric(12, 2),
  price         numeric(12, 2),
  stock         integer,
  category      text,
  platform      text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.products enable row level security;

create policy "Users can manage their own products"
  on public.products
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Helper: auto-update updated_at ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_store_connections_updated_at
  before update on public.store_connections
  for each row execute procedure public.set_updated_at();

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

create trigger trg_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();
