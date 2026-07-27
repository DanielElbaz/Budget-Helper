-- Budget Helper — schema for a shared, real-time-synced household budget.
-- Run this once in the Supabase SQL editor of your project (see README.md
-- for the full setup walkthrough).

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null,
  color text not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  category_id uuid not null references categories(id) on delete cascade,
  description text not null default '',
  date date not null,
  recurring boolean not null default false,
  recurrence_frequency text check (recurrence_frequency in ('weekly', 'monthly', 'yearly')),
  template_id uuid references transactions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null unique references categories(id) on delete cascade,
  monthly_limit numeric not null check (monthly_limit > 0)
);

create index if not exists transactions_category_id_idx on transactions(category_id);
create index if not exists transactions_date_idx on transactions(date);
create index if not exists transactions_template_id_idx on transactions(template_id);

-- Row Level Security: only the couple's signed-in account (the single shared
-- Supabase Auth user created during setup) may read or write anything.
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;

create policy "authenticated full access" on categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on transactions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on budgets
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Real-time: let the app receive live inserts/updates/deletes so both phones
-- stay in sync instantly.
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table budgets;
