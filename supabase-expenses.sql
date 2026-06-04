-- Gastos operativos
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  category text not null default 'otros' check (category in ('marketing', 'logistica', 'tecnologia', 'honorarios', 'alquiler', 'otros')),
  frequency text not null default 'mensual' check (frequency in ('unico', 'mensual', 'anual')),
  date date not null default current_date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.expenses enable row level security;

create policy "Users can view own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.expenses to authenticated, anon, service_role;
