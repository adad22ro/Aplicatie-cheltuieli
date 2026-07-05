-- =============================================================================
-- Șabloane de alocare: „din fiecare salariu: 15% economii, 1200 chirie"
--
-- Un șablon are linii; fiecare linie alocă o sumă FIXĂ sau un PROCENT din banii
-- disponibili (venit + report). La aplicare pe un plan, liniile generează
-- plan_allocations (procentul e calculat la momentul aplicării).
-- =============================================================================

create type public.allocation_mode as enum ('fixed', 'percent');

create table public.allocation_templates (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name         text not null,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table public.template_lines (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references public.allocation_templates (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  category_id  uuid references public.categories (id) on delete set null,
  label        text,
  mode         public.allocation_mode not null default 'fixed',
  value        numeric(14, 2) not null check (value >= 0), -- sumă (fixed) sau procent (percent)
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index idx_templates_household on public.allocation_templates (household_id);
create index idx_template_lines_template on public.template_lines (template_id);

-- RLS: membru = CRUD complet (ca la restul datelor de gospodărie)
alter table public.allocation_templates enable row level security;
alter table public.template_lines       enable row level security;

create policy "allocation_templates_select" on public.allocation_templates
  for select using (public.is_household_member(household_id));
create policy "allocation_templates_insert" on public.allocation_templates
  for insert with check (public.is_household_member(household_id));
create policy "allocation_templates_update" on public.allocation_templates
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "allocation_templates_delete" on public.allocation_templates
  for delete using (public.is_household_member(household_id));

create policy "template_lines_select" on public.template_lines
  for select using (public.is_household_member(household_id));
create policy "template_lines_insert" on public.template_lines
  for insert with check (public.is_household_member(household_id));
create policy "template_lines_update" on public.template_lines
  for update using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "template_lines_delete" on public.template_lines
  for delete using (public.is_household_member(household_id));
