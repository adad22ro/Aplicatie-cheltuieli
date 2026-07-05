-- =============================================================================
-- Faza 2 — Rate / angajamente: generarea tranzacțiilor din planuri de rate
--
-- Un plan de rate are un total finit (`total_installments`). Generează câte o
-- tranzacție pe lună (ziua `day_of_month`), începând din luna lui `start_date`, până
-- la epuizarea ratelor. La ultima rată, `is_active` devine false (auto-dezactivare).
--
-- La fel ca la recurențe: generare „lazy" SECURITY DEFINER, idempotentă prin
-- `source='installment'` + `source_id = plan.id` și index unic parțial (source_id, date).
-- `paid_installments` se recalculează din câte tranzacții s-au generat (inclusiv cele
-- soft-deleted, ca să nu se regenereze).
-- =============================================================================

create unique index if not exists uq_transactions_installment_slot
  on public.transactions (source_id, date)
  where source = 'installment';

create or replace function public.generate_due_installments()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  p           record;
  k           integer;
  m           date;
  gen_date    date;
  last_day    integer;
  v_generated integer;
  v_paid      integer;
  v_count     integer := 0;
begin
  if v_uid is null then
    return 0;
  end if;

  for p in
    select ip.*
    from public.installment_plans ip
    where ip.is_active
      and ip.deleted_at is null
      and public.is_household_member(ip.household_id)
  loop
    v_generated := 0;

    -- Ratele k = 0 .. total_installments-1, câte una pe lună din luna lui start_date.
    for k in 0 .. (p.total_installments - 1) loop
      m := (date_trunc('month', p.start_date) + make_interval(months => k))::date;
      last_day := extract(day from (m + interval '1 month - 1 day'))::integer;
      gen_date := m + (least(p.day_of_month, last_day) - 1);

      if gen_date <= current_date
         and not exists (
           select 1 from public.transactions t
           where t.source_id = p.id and t.date = gen_date
         )
      then
        insert into public.transactions
          (household_id, user_id, amount, type, category_id, payment_method_id,
           date, note, source, source_id)
        values
          (p.household_id, v_uid, p.installment_amount, 'expense', p.category_id,
           p.payment_method_id, gen_date, p.name, 'installment', p.id);
        v_generated := v_generated + 1;
      end if;
    end loop;

    -- Recalculează ratele plătite din câte tranzacții există (inclusiv soft-deleted)
    -- și dezactivează planul dacă s-au atins toate.
    select count(*) into v_paid
    from public.transactions
    where source_id = p.id and source = 'installment';

    update public.installment_plans
    set paid_installments = v_paid,
        is_active = (v_paid < p.total_installments)
    where id = p.id;

    v_count := v_count + v_generated;
  end loop;

  return v_count;
end;
$$;
