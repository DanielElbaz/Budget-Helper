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

-- Household membership: only accounts listed here can access the budget data.
-- Being signed in is NOT enough (anyone can sign up with the public anon key
-- if sign-ups are enabled), so every policy checks membership.
create table if not exists household_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Row Level Security on every table.
alter table household_members enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;

-- A member can only see their own membership row. There is no insert/update/
-- delete policy: members are added from the SQL editor only (see README).
create policy "members read own row" on household_members
  for select to authenticated using (user_id = (select auth.uid()));

create policy "household members full access" on categories for all to authenticated
  using (exists (select 1 from household_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from household_members m where m.user_id = (select auth.uid())));

create policy "household members full access" on transactions for all to authenticated
  using (exists (select 1 from household_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from household_members m where m.user_id = (select auth.uid())));

create policy "household members full access" on budgets for all to authenticated
  using (exists (select 1 from household_members m where m.user_id = (select auth.uid())))
  with check (exists (select 1 from household_members m where m.user_id = (select auth.uid())));

-- After creating the shared account (README step 3), add it to the household:
--   insert into household_members (user_id)
--   select id from auth.users where email = 'famille@budget-helper.local';

-- Real-time: let the app receive live inserts/updates/deletes so both phones
-- stay in sync instantly.
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table budgets;
