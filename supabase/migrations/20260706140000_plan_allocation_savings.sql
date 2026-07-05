-- =============================================================================
-- Plan: alocare către un obiectiv de economisire
--
-- O alocare poate ținti un obiectiv (`savings_goal_id`) în loc de o categorie. Când o
-- bifezi „plătit", crește automat `savings_goals.current_amount` (contribuție), fără a
-- crea o tranzacție de cheltuială — economiile se urmăresc separat. Debifare/ștergere
-- scade la loc contribuția.
-- =============================================================================

alter table public.plan_allocations
  add column if not exists savings_goal_id uuid
    references public.savings_goals (id) on delete set null;
