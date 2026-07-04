-- =============================================================================
-- Migrare inițială — schema completă + RLS
-- Aplicație de gestiune financiară pentru gospodărie (Profil B, RLS pe auth.uid()).
-- Referință coloane: docs/PLAN.md secțiunea 5. Model securitate: docs/DOCS.md §4.
--
-- Principii:
--  - Fiecare tabel cu date de gospodărie are `household_id` + RLS activat, în ACEEAȘI
--    migrare cu tabelul. Un rând e accesibil doar dacă userul curent e membru al
--    gospodăriei (verificat prin funcțiile helper SECURITY DEFINER de mai jos).
--  - Soft delete peste tot (`deleted_at`); citirile din aplicație filtrează
--    `deleted_at IS NULL` (nu se impune în RLS, ci în queries).
--  - Enum-uri pentru câmpurile tipizate.
-- =============================================================================

-- --- Tipuri (enum) -----------------------------------------------------------
create type public.household_role      as enum ('owner', 'member');
create type public.entry_type          as enum ('income', 'expense');
create type public.transaction_source  as enum ('manual', 'recurring', 'installment');
create type public.recurring_frequency as enum ('monthly');

-- =============================================================================
-- Tabele
-- =============================================================================

-- households — gospodăriile
create table public.households (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- household_members — leagă utilizatorii de gospodării
create table public.household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references auth.users (id),
  role         public.household_role not null default 'member',
  joined_at    timestamptz not null default now(),
  unique (household_id, user_id)
);

-- household_invites — invitații în gospodărie (folosite în faza 2)
create table public.household_invites (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  code         text not null unique,
  created_by   uuid not null references auth.users (id),
  expires_at   timestamptz,
  used_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- categories — categorii de tranzacții (income/expense)
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name         text not null,
  type         public.entry_type not null,
  icon         text,
  color        text,
  deleted_at   timestamptz
);

-- payment_methods — metode de plată
create table public.payment_methods (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name         text not null,
  deleted_at   timestamptz
);

-- transactions — inima aplicației
create table public.transactions (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households (id) on delete cascade,
  user_id           uuid not null references auth.users (id),
  amount            numeric(14, 2) not null check (amount > 0),
  type              public.entry_type not null,
  category_id       uuid not null references public.categories (id),
  payment_method_id uuid references public.payment_methods (id),
  date              date not null,
  note              text,
  source            public.transaction_source not null default 'manual',
  source_id         uuid,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

-- recurring_transactions — recurențe infinite (faza 2)
create table public.recurring_transactions (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households (id) on delete cascade,
  amount            numeric(14, 2) not null check (amount > 0),
  type              public.entry_type not null,
  category_id       uuid not null references public.categories (id),
  payment_method_id uuid references public.payment_methods (id),
  note              text,
  frequency         public.recurring_frequency not null default 'monthly',
  day_of_month      int not null check (day_of_month between 1 and 31),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

-- installment_plans — angajamente/rate (total finit, auto-dezactivare) (faza 2)
create table public.installment_plans (
  id                  uuid primary key default gen_random_uuid(),
  household_id        uuid not null references public.households (id) on delete cascade,
  name                text not null,
  total_amount        numeric(14, 2) not null check (total_amount > 0),
  installment_amount  numeric(14, 2) not null check (installment_amount > 0),
  total_installments  int not null check (total_installments > 0),
  paid_installments   int not null default 0 check (paid_installments >= 0),
  category_id         uuid not null references public.categories (id),
  payment_method_id   uuid references public.payment_methods (id),
  day_of_month        int not null check (day_of_month between 1 and 31),
  start_date          date not null,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  check (paid_installments <= total_installments)
);

-- budgets — bugete pe categorie (faza 2)
create table public.budgets (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  category_id  uuid not null references public.categories (id),
  amount       numeric(14, 2) not null check (amount > 0),
  month        date not null,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- savings_goals — obiective de economisire (faza 2)
create table public.savings_goals (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households (id) on delete cascade,
  name           text not null,
  target_amount  numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  deadline       date,
  created_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

-- --- Indexuri (acces frecvent pe household_id + filtrări) --------------------
create index idx_household_members_user     on public.household_members (user_id);
create index idx_categories_household       on public.categories (household_id);
create index idx_payment_methods_household  on public.payment_methods (household_id);
create index idx_transactions_household_date on public.transactions (household_id, date);
create index idx_transactions_category      on public.transactions (category_id);
create index idx_recurring_household        on public.recurring_transactions (household_id);
create index idx_installments_household     on public.installment_plans (household_id);
create index idx_budgets_household_month    on public.budgets (household_id, month);
create index idx_savings_household          on public.savings_goals (household_id);

-- =============================================================================
-- Funcții helper pentru RLS (SECURITY DEFINER)
--
-- Rulează cu privilegiile owner-ului funcției, deci OCOLESC RLS pe
-- household_members. Fără asta, o politică pe household_members care interoghează
-- household_members ar intra în recursiune infinită. `search_path` fixat pentru
-- siguranță.
-- =============================================================================

create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(hid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid() and role = 'owner'
  );
$$;

-- create_household — bootstrap atomic: creează gospodăria ȘI adaugă creatorul ca
-- owner într-o singură tranzacție. SECURITY DEFINER pentru că, la momentul creării,
-- userul încă nu e membru (deci politicile normale l-ar bloca). Onboarding-ul apelează
-- această funcție, nu un INSERT direct în households.
create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Neautentificat';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Numele gospodăriei este obligatoriu';
  end if;

  insert into public.households (name, created_by)
  values (trim(p_name), auth.uid())
  returning id into new_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

-- =============================================================================
-- Activare RLS + politici
-- =============================================================================

alter table public.households             enable row level security;
alter table public.household_members      enable row level security;
alter table public.household_invites      enable row level security;
alter table public.categories             enable row level security;
alter table public.payment_methods        enable row level security;
alter table public.transactions           enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.installment_plans      enable row level security;
alter table public.budgets                enable row level security;
alter table public.savings_goals          enable row level security;

-- --- households ---------------------------------------------------------------
-- Membrii văd gospodăria; doar owner o modifică (redenumire / soft delete).
-- Fără politică INSERT: crearea se face DOAR prin create_household() (SECURITY DEFINER).
create policy "households_select" on public.households
  for select using (public.is_household_member(id));
create policy "households_update" on public.households
  for update using (public.is_household_owner(id))
  with check (public.is_household_owner(id));

-- --- household_members --------------------------------------------------------
-- Membrii văd componența gospodăriei; doar owner adaugă/schimbă/scoate membri.
-- Bootstrap-ul primului owner se face prin create_household().
create policy "members_select" on public.household_members
  for select using (public.is_household_member(household_id));
create policy "members_insert" on public.household_members
  for insert with check (public.is_household_owner(household_id));
create policy "members_update" on public.household_members
  for update using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));
create policy "members_delete" on public.household_members
  for delete using (public.is_household_owner(household_id));

-- --- household_invites --------------------------------------------------------
-- Membrii văd invitațiile; doar owner le generează/modifică/șterge.
create policy "invites_select" on public.household_invites
  for select using (public.is_household_member(household_id));
create policy "invites_insert" on public.household_invites
  for insert with check (public.is_household_owner(household_id));
create policy "invites_update" on public.household_invites
  for update using (public.is_household_owner(household_id))
  with check (public.is_household_owner(household_id));
create policy "invites_delete" on public.household_invites
  for delete using (public.is_household_owner(household_id));

-- --- Tabele de date (orice membru: select/insert/update/delete) ---------------
-- Model repetat identic pentru toate tabelele cu date de gospodărie.

-- categories
create policy "categories_select" on public.categories
  for select using (public.is_household_member(household_id));
create policy "categories_insert" on public.categories
  for insert with check (public.is_household_member(household_id));
create policy "categories_update" on public.categories
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "categories_delete" on public.categories
  for delete using (public.is_household_member(household_id));

-- payment_methods
create policy "payment_methods_select" on public.payment_methods
  for select using (public.is_household_member(household_id));
create policy "payment_methods_insert" on public.payment_methods
  for insert with check (public.is_household_member(household_id));
create policy "payment_methods_update" on public.payment_methods
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "payment_methods_delete" on public.payment_methods
  for delete using (public.is_household_member(household_id));

-- transactions (la insert impunem și user_id = auth.uid() — autorul e cel logat)
create policy "transactions_select" on public.transactions
  for select using (public.is_household_member(household_id));
create policy "transactions_insert" on public.transactions
  for insert with check (
    public.is_household_member(household_id) and user_id = auth.uid()
  );
create policy "transactions_update" on public.transactions
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "transactions_delete" on public.transactions
  for delete using (public.is_household_member(household_id));

-- recurring_transactions
create policy "recurring_select" on public.recurring_transactions
  for select using (public.is_household_member(household_id));
create policy "recurring_insert" on public.recurring_transactions
  for insert with check (public.is_household_member(household_id));
create policy "recurring_update" on public.recurring_transactions
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "recurring_delete" on public.recurring_transactions
  for delete using (public.is_household_member(household_id));

-- installment_plans
create policy "installments_select" on public.installment_plans
  for select using (public.is_household_member(household_id));
create policy "installments_insert" on public.installment_plans
  for insert with check (public.is_household_member(household_id));
create policy "installments_update" on public.installment_plans
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "installments_delete" on public.installment_plans
  for delete using (public.is_household_member(household_id));

-- budgets
create policy "budgets_select" on public.budgets
  for select using (public.is_household_member(household_id));
create policy "budgets_insert" on public.budgets
  for insert with check (public.is_household_member(household_id));
create policy "budgets_update" on public.budgets
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "budgets_delete" on public.budgets
  for delete using (public.is_household_member(household_id));

-- savings_goals
create policy "savings_select" on public.savings_goals
  for select using (public.is_household_member(household_id));
create policy "savings_insert" on public.savings_goals
  for insert with check (public.is_household_member(household_id));
create policy "savings_update" on public.savings_goals
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "savings_delete" on public.savings_goals
  for delete using (public.is_household_member(household_id));
