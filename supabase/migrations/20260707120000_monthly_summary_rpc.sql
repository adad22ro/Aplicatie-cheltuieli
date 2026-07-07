-- =============================================================================
-- Optimizare: sumar lunar agregat în baza de date
--
-- Înainte, dashboard-ul aducea TOATE tranzacțiile din istoric și calcula în JS
-- venituri/cheltuieli/report. La volume mari devine lent. Această funcție face
-- agregarea direct în Postgres (trei sume), întorcând un singur rând.
--
-- SECURITY INVOKER: rulează cu drepturile userului, deci RLS-ul de pe `transactions`
-- se aplică normal (vede doar gospodăria lui). Fără service_role, fără ocolire RLS.
-- =============================================================================

create or replace function public.get_monthly_summary(p_start date, p_end date)
returns table (income numeric, expense numeric, carry_over numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(t.amount) filter (
      where t.type = 'income' and t.date >= p_start and t.date < p_end), 0) as income,
    coalesce(sum(t.amount) filter (
      where t.type = 'expense' and t.date >= p_start and t.date < p_end), 0) as expense,
    coalesce(sum(case when t.type = 'income' then t.amount else -t.amount end) filter (
      where t.date < p_start), 0) as carry_over
  from public.transactions t
  where t.deleted_at is null
    and t.date < p_end;
$$;

grant execute on function public.get_monthly_summary(date, date) to authenticated;
