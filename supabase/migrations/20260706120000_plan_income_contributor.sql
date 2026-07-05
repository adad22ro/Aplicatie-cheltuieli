-- =============================================================================
-- Plan: contribuitorul unui venit (cine l-a adus în plan)
--
-- Pentru gospodăriile cu 2 venituri, vrem să vedem cine cât contribuie. Adăugăm
-- `user_id` pe plan_incomes (cine a adăugat venitul). Nullable: rândurile seedate din
-- recurențe (venit „comun") și cele vechi rămân neatribuite.
-- =============================================================================

alter table public.plan_incomes
  add column if not exists user_id uuid references auth.users (id) on delete set null;
