-- Tabla de conexiones de tiendas (multi-tenant)
create table if not exists public.store_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null check (platform in ('tiendanube', 'shopify')),
  store_id text not null,
  store_name text,
  store_url text,
  access_token text not null,
  scope text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, platform, store_id)
);

-- RLS: cada usuario solo ve sus propias tiendas
alter table public.store_connections enable row level security;

create policy "Users can view own store connections"
  on public.store_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own store connections"
  on public.store_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own store connections"
  on public.store_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own store connections"
  on public.store_connections for delete
  using (auth.uid() = user_id);
