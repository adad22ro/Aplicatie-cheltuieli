-- =============================================================================
-- Recurențe: generarea automată doar pentru CHELTUIELI
--
-- Odată cu „Plan lunar", veniturile recurente (salariu etc.) servesc doar ca sursă de
-- precompletare a planului — NU trebuie să genereze automat tranzacții de venit, ca să nu
-- se dubleze cu venitul real pe care userul îl adaugă când chiar intră banii.
--
-- Singura schimbare față de `20260705140000`: filtrul `rt.type = 'expense'` în bucla de
-- recurențe. Tranzacțiile de venit deja generate anterior rămân (istoric).
-- =============================================================================

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

  -- Doar recurențele active de tip CHELTUIALĂ din gospodăriile userului.
  for r in
    select rt.*
    from public.recurring_transactions rt
    where rt.is_active
      and rt.deleted_at is null
      and rt.type = 'expense'
      and public.is_household_member(rt.household_id)
  loop
    m := date_trunc('month', r.created_at)::date;

    while m <= date_trunc('month', current_date)::date loop
      last_day := extract(day from (m + interval '1 month - 1 day'))::integer;
      gen_date := m + (least(r.day_of_month, last_day) - 1);

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
