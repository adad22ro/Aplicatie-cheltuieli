-- =============================================================================
-- Datorii — bani împrumutați de la / către persoane
--
-- Listă separată, DECUPLATĂ de tranzacții: o datorie NU afectează soldul lunii.
-- Marcarea restituirilor e manuală (userul adaugă o „plată" când a înapoiat bani).
--
-- `debts`        = o datorie: sumă totală + persoană + direcție (împrumutat de la /
--                  către cineva). `settled_at` marchează închiderea manuală.
-- `debt_payments`= restituiri parțiale/totale. Rest = amount − Σ plăți (derivat în cod).
--
-- Ambele: RLS `is_household_member` (ca restul datelor gospodăriei) + soft delete.
-- =============================================================================

-- Direcția datoriei: 'borrowed' = am împrumutat EU de la cineva (o datorez);
--                    'lent'     = am dat EU cuiva (mi se datorează).
create type public.debt_direction as enum ('borrowed', 'lent');

create table public.debts (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  user_id       uuid references auth.users (id),          -- cine a adăugat datoria
  person        text not null,                            -- de la / către cine
  direction     public.debt_direction not null default 'borrowed',
  amount        numeric(14, 2) not null check (amount > 0),
  note          text,
  borrowed_date date not null default current_date,
  settled_at    timestamptz,                              -- închisă manual („înapoiat tot")
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table public.debt_payments (
  id           uuid primary key default gen_random_uuid(),
  debt_id      uuid not null references public.debts (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid references auth.users (id),
  amount       numeric(14, 2) not null check (amount > 0),
  paid_date    date not null default current_date,
  note         text,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index idx_debts_household         on public.debts (household_id);
create index idx_debt_payments_debt      on public.debt_payments (debt_id);
create index idx_debt_payments_household on public.debt_payments (household_id);

alter table public.debts         enable row level security;
alter table public.debt_payments enable row level security;

-- RLS: orice membru al gospodăriei are CRUD (la fel ca restul datelor).
create policy "debts_select" on public.debts
  for select using (public.is_household_member(household_id));
create policy "debts_insert" on public.debts
  for insert with check (public.is_household_member(household_id));
create policy "debts_update" on public.debts
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "debts_delete" on public.debts
  for delete using (public.is_household_member(household_id));

create policy "debt_payments_select" on public.debt_payments
  for select using (public.is_household_member(household_id));
create policy "debt_payments_insert" on public.debt_payments
  for insert with check (public.is_household_member(household_id));
create policy "debt_payments_update" on public.debt_payments
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "debt_payments_delete" on public.debt_payments
  for delete using (public.is_household_member(household_id));
