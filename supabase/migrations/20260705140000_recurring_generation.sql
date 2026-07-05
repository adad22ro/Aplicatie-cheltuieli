-- =============================================================================
-- Faza 2 — Recurențe: generarea tranzacțiilor din recurențe active
--
-- Recurențele (chirie, salariu, abonamente) generează câte o tranzacție pe lună, în
-- ziua `day_of_month`. Generarea se face „lazy" la deschiderea aplicației, printr-un
-- RPC SECURITY DEFINER — evită un cron cu service_role în producție.
--
-- Idempotență: fiecare tranzacție generată are `source='recurring'` și
-- `source_id = recurring.id`. Un index unic parțial pe (source_id, date) împiedică
-- duplicatele chiar și sub concurență. Dacă userul șterge (soft delete) o tranzacție
-- generată, slotul rămâne ocupat → NU se regenerează.
-- =============================================================================

-- Împiedică două tranzacții recurente pentru aceeași recurență în aceeași zi.
create unique index if not exists uq_transactions_recurring_slot
  on public.transactions (source_id, date)
  where source = 'recurring';

create or replace function public.generate_due_recurring()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  r           record;
  m           date;    -- prima zi a lunii curente din iterație
  gen_date    date;    -- ziua efectivă de generare (day_of_month, plafonat)
  last_day    integer; -- câte zile are luna m
  v_count     integer := 0;
begin
  if v_uid is null then
    return 0;
  end if;

  -- Doar recurențele active din gospodăriile în care userul e membru.
  for r in
    select rt.*
    from public.recurring_transactions rt
    where rt.is_active
      and rt.deleted_at is null
      and public.is_household_member(rt.household_id)
  loop
    -- Iterăm din luna în care a fost creată recurența până în luna curentă.
    m := date_trunc('month', r.created_at)::date;

    while m <= date_trunc('month', current_date)::date loop
      last_day := extract(day from (m + interval '1 month - 1 day'))::integer;
      gen_date := m + (least(r.day_of_month, last_day) - 1);

      -- Generăm doar dacă ziua a sosit deja și nu există deja tranzacția.
      if gen_date <= current_date
         and not exists (
           select 1 from public.transactions t
           where t.source_id = r.id and t.date = gen_date
         )
      then
        insert into public.transactions
          (household_id, user_id, amount, type, category_id, payment_method_id,
           date, note, source, source_id)
        values
          (r.household_id, v_uid, r.amount, r.type, r.category_id, r.payment_method_id,
           gen_date, r.note, 'recurring', r.id);
        v_count := v_count + 1;
      end if;

      m := (m + interval '1 month')::date;
    end loop;
  end loop;

  return v_count;
end;
$$;
