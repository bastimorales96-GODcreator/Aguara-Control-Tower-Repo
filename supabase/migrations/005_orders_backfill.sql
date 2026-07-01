-- ============================================================
-- Aguara — Orders backfill / storage
-- Run this in: Supabase Dashboard → SQL Editor
-- Depends on: 001_initial_schema.sql
-- ============================================================
--
-- Stores normalized orders synced from the connected store so that customer
-- analytics (cohorts, LTV, health, Pareto, etc.) run over full history and load
-- fast, instead of live-fetching a 6-month window on every request.
-- ============================================================

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  platform          text not null,             -- 'shopify' | 'tiendanube' | 'mercadolibre'
  store_id          text not null,
  external_order_id text not null,             -- order id from the platform
  customer_id       text,
  customer_name     text,
  customer_email    text,
  status            text,                      -- 'paid' | 'pending' | 'refunded' | 'cancelled'
  total             numeric(14,2) default 0,
  subtotal          numeric(14,2) default 0,
  currency          text,
  source            text,                      -- source_name / channel when available
  order_created_at  timestamptz not null,
  raw               jsonb,
  synced_at         timestamptz default now(),
  unique (user_id, platform, store_id, external_order_id)
);

create index if not exists idx_orders_user_platform_date
  on public.orders (user_id, platform, order_created_at desc);
create index if not exists idx_orders_customer
  on public.orders (user_id, platform, customer_id);

alter table public.orders enable row level security;

create policy "Users manage their own orders"
  on public.orders
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.orders to anon, authenticated;

-- Track incremental sync per connection.
alter table public.store_connections
  add column if not exists last_orders_sync_at timestamptz;
alter table public.store_connections
  add column if not exists orders_backfilled boolean default false;
