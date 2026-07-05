-- =============================================================================
-- Infrastructură de securitate: jurnal de evenimente + verificator RLS.
--
-- `security_events` = jurnal append-only pentru semnale de securitate (login-uri
-- eșuate/reușite, probe pe /admin, redeem coduri, resetări). Servește și ca sursă pentru
-- rate-limiting (numărăm eșecurile recente per email/IP). RLS activ FĂRĂ politici =
-- inaccesibil oricui; doar service_role (care ocolește RLS) scrie/citește.
--
-- `rls_status()` = funcție SECURITY DEFINER care raportează, pentru fiecare tabel din
-- schema public, dacă are RLS activ și câte politici are. Folosită de panoul de admin ca
-- să confirme că nicio migrare n-a uitat `enable row level security`.
-- =============================================================================

create table if not exists public.security_events (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null,
  email       text,
  user_id     uuid,
  ip          text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

alter table public.security_events enable row level security;
-- Nicio politică → deny implicit pentru anon/authenticated. service_role ocolește RLS.

create index if not exists security_events_type_time_idx
  on public.security_events (event_type, created_at desc);
create index if not exists security_events_email_time_idx
  on public.security_events (email, created_at desc);
create index if not exists security_events_ip_time_idx
  on public.security_events (ip, created_at desc);

-- ---------------------------------------------------------------------------
-- Verificator acoperire RLS
-- ---------------------------------------------------------------------------
create or replace function public.rls_status()
returns table (table_name text, rls_enabled boolean, policy_count integer)
language sql
security definer
set search_path = public
as $$
  select
    c.relname::text as table_name,
    c.relrowsecurity as rls_enabled,
    (select count(*)::integer from pg_policies p
      where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
  order by c.relrowsecurity asc, c.relname asc;
$$;

revoke all on function public.rls_status() from public, anon, authenticated;
grant execute on function public.rls_status() to service_role;
