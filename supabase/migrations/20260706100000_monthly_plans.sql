-- =============================================================================
-- Plan lunar: alocarea venitului + planificarea lunii următoare
--
-- Un „plan lunar" per gospodărie/lună servește ambele fluxuri:
--   • luna curentă  → aloci un venit care a intrat deja pe cheltuieli recurente
--   • luna viitoare → planifici cheltuielile pe baza veniturilor estimate
--
-- Modelul „Plan + confirmi «plătit»": alocările NU devin cheltuieli reale până nu
-- bifezi „plătit" pe un rând; abia atunci se creează o `transactions` (source='plan')
-- legată prin `paid_transaction_id`. Astfel cheltuielile reflectă doar bani chiar dați.
--
-- Sursele de venit recurente refolosesc `recurring_transactions` (type='income'),
-- gestionate din /recurring (activare/dezactivare/ștergere).
-- =============================================================================

-- Sursă nouă de tranzacție: generată din confirmarea unei alocări de plan.
alter type public.transaction_source add value if not exists 'plan';

-- --- monthly_plans: un plan per gospodărie/lună ------------------------------
create table public.monthly_plans (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  month        date not null,  -- prima zi a lunii, ex 2026-08-01
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (household_id, month)
);

-- --- plan_incomes: veniturile din plan (estimate sau reale) ------------------
create table public.plan_incomes (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references public.monthly_plans (id) on delete cascade,
  household_id   uuid not null references public.households (id) on delete cascade,
  label          text not null,
  amount         numeric(14, 2) not null check (amount >= 0),
  -- legat când venitul chiar intră (tranzacție reală de tip venit)
  transaction_id uuid references public.transactions (id) on delete set null,
  is_confirmed   boolean not null default false,  -- false = estimat, true = a intrat
  -- dacă e generat dintr-o sursă recurentă de venit
  recurring_id   uuid references public.recurring_transactions (id) on delete set null,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

-- --- plan_allocations: cheltuielile planificate / alocările ------------------
create table public.plan_allocations (
  id                  uuid primary key default gen_random_uuid(),
  plan_id             uuid not null references public.monthly_plans (id) on delete cascade,
  household_id        uuid not null references public.households (id) on delete cascade,
  -- rândurile precompletate din recurente au recurring_id; cele ad-hoc au doar label
  recurring_id        uuid references public.recurring_transactions (id) on delete set null,
  category_id         uuid references public.categories (id) on delete set null,
  label               text,  -- pt. rândurile ad-hoc „+ Adaugă altceva"
  planned_amount      numeric(14, 2) not null check (planned_amount >= 0),
  is_paid             boolean not null default false,
  paid_transaction_id uuid references public.transactions (id) on delete set null,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- --- Indexuri ----------------------------------------------------------------
create index idx_monthly_plans_household_month on public.monthly_plans (household_id, month);
create index idx_plan_incomes_plan             on public.plan_incomes (plan_id);
create index idx_plan_allocations_plan         on public.plan_allocations (plan_id);

-- =============================================================================
-- RLS — membru al gospodăriei = CRUD complet (ca la transactions/budgets)
-- =============================================================================
alter table public.monthly_plans    enable row level security;
alter table public.plan_incomes     enable row level security;
alter table public.plan_allocations enable row level security;

create policy "monthly_plans_select" on public.monthly_plans
  for select using (public.is_household_member(household_id));
create policy "monthly_plans_insert" on public.monthly_plans
  for insert with check (public.is_household_member(household_id));
create policy "monthly_plans_update" on public.monthly_plans
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "monthly_plans_delete" on public.monthly_plans
  for delete using (public.is_household_member(household_id));

create policy "plan_incomes_select" on public.plan_incomes
  for select using (public.is_household_member(household_id));
create policy "plan_incomes_insert" on public.plan_incomes
  for insert with check (public.is_household_member(household_id));
create policy "plan_incomes_update" on public.plan_incomes
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "plan_incomes_delete" on public.plan_incomes
  for delete using (public.is_household_member(household_id));

create policy "plan_allocations_select" on public.plan_allocations
  for select using (public.is_household_member(household_id));
create policy "plan_allocations_insert" on public.plan_allocations
  for insert with check (public.is_household_member(household_id));
create policy "plan_allocations_update" on public.plan_allocations
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "plan_allocations_delete" on public.plan_allocations
  for delete using (public.is_household_member(household_id));
