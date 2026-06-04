-- Maestro de productos
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  sku text not null,
  description text not null,
  cost_price numeric(12,2) not null default 0,
  iva_rate numeric(5,2) not null default 21, -- 10.5 or 21
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, sku)
);

alter table public.products enable row level security;

create policy "Users can view own products"
  on public.products for select
  using (auth.uid() = user_id);

create policy "Users can insert own products"
  on public.products for insert
  with check (auth.uid() = user_id);

create policy "Users can update own products"
  on public.products for update
  using (auth.uid() = user_id);

create policy "Users can delete own products"
  on public.products for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.products to authenticated, anon, service_role;
