-- =============================================================================
-- Plan pe săptămâni: fiecare cheltuială planificată poate primi o săptămână a lunii.
--
-- `week` = numărul blocului de 7 zile (1 = zilele 1–7, 2 = 8–14, …, până la 5/6 în
-- funcție de lună), aliniat cu vizualizarea săptămânală a dashboard-ului. `null` = „oricând"
-- (nealocat pe o săptămână anume). Permite împărțirea planului lunar pe săptămâni, nu doar
-- a tracking-ului. Fără backfill — alocările existente rămân „oricând".
-- =============================================================================

alter table public.plan_allocations
  add column if not exists week smallint
    check (week is null or (week >= 1 and week <= 6));
