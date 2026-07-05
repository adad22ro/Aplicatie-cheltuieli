-- =============================================================================
-- Profiluri: nume afișat pentru fiecare utilizator
--
-- Auth (`auth.users`) nu ține un „nume". `profiles` adaugă un nume afișat, setat la
-- înregistrare și editabil în setări. Membrii aceleiași gospodării își pot vedea numele
-- reciproc (ca să apară „cine a adăugat" pe tranzacții).
-- =============================================================================

create table public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Helper SECURITY DEFINER: userul curent împarte vreo gospodărie cu `other`?
-- Ocolește RLS pe household_members (evită recursiune) — la fel ca is_household_member.
create or replace function public.shares_household(other uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members a
    join public.household_members b on a.household_id = b.household_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

alter table public.profiles enable row level security;

-- Vezi propriul profil SAU profilul unui co-membru de gospodărie.
create policy "profiles_select" on public.profiles
  for select using (
    user_id = auth.uid() or public.shares_household(user_id)
  );

-- Fiecare își creează / editează doar propriul profil.
create policy "profiles_insert" on public.profiles
  for insert with check (user_id = auth.uid());
create policy "profiles_update" on public.profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());
