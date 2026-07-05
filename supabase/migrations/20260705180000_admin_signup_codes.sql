-- =============================================================================
-- Admin & înregistrare controlată prin coduri
--
-- Înregistrarea publică în Supabase Auth se dezactivează (disable_signup=true).
-- Conturile se creează DOAR prin serverul aplicației, după validarea unui cod din
-- `signup_codes`. Codul poate ținti o gospodărie anume (auto-join) — userul nou nu vede
-- alte gospodării.
--
-- Ambele tabele au RLS activat FĂRĂ politici permisive: utilizatorii normali (cheie
-- anon) nu au acces deloc. Tot accesul se face prin `service_role` din cod de server
-- controlat (înregistrare pe bază de cod, panou admin protejat prin ADMIN_EMAIL).
-- =============================================================================

create table public.signup_codes (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  label        text,                                   -- etichetă liberă („pentru Maria")
  household_id uuid references public.households (id) on delete cascade, -- null = creează gospodărie nouă
  role         public.household_role not null default 'member',
  expires_at   timestamptz,
  used_by      uuid references auth.users (id),
  used_at      timestamptz,
  created_by   uuid not null references auth.users (id),
  created_at   timestamptz not null default now()
);

create index idx_signup_codes_household on public.signup_codes (household_id);

-- Jurnal de acțiuni admin (generare cod, ștergere user, resetare parolă etc.).
create table public.admin_audit (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid references auth.users (id),
  action     text not null,
  detail     jsonb,
  created_at timestamptz not null default now()
);

create index idx_admin_audit_created on public.admin_audit (created_at desc);

-- RLS activat, FĂRĂ politici → deny complet pentru cheia anon. service_role trece peste.
alter table public.signup_codes enable row level security;
alter table public.admin_audit  enable row level security;
