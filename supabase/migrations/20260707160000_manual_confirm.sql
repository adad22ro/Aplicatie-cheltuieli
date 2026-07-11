-- =============================================================================
-- Confirmare MANUALĂ pentru recurențe & rate (pentru întârzieri)
--
-- Uneori o plată/încasare fixă vine mai târziu decât ziua stabilită. Cu `manual_confirm`
-- userul o marchează el „plătită/încasată" când chiar are loc, în loc să se genereze automat.
--
--   manual_confirm = true → NU se generează automat; apare la „De completat" cu suma
--   (fixă) precompletată, pe care userul o confirmă (poate ajusta) când a avut loc.
--
-- Reutilizează exact mecanismul sumelor variabile: aceleași funcții `list_due_variable_*`
-- întorc acum și sloturile cu `manual_confirm`, iar generarea automată le sare.
-- =============================================================================

alter table public.recurring_transactions
  add column if not exists manual_confirm boolean not null default false;

alter table public.installment_plans
  add column if not exists manual_confirm boolean not null default false;

-- ---------------------------------------------------------------------------
-- Generarea automată sare peste variabile ȘI peste cele cu confirmare manuală.
-- ---------------------------------------------------------------------------
create or replace function public.generate_due_recurring()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  r           record;
  m           date;
  gen_date    date;
  last_day    integer;
  v_count     integer := 0;
begin
  if v_uid is null then
    return 0;
  end if;

  for r in
    select rt.*
    from public.recurring_transactions rt
    where rt.is_active
      and rt.deleted_at is null
      and rt.type = 'expense'
      and not rt.is_variable
      and not rt.manual_confirm
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

    if not p.is_variable and not p.manual_confirm then
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
    end if;

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

-- ---------------------------------------------------------------------------
-- Sloturile scadente „de completat/confirmat": variabile SAU cu confirmare manuală.
-- (Nume păstrat pentru compatibilitate cu apelurile existente.)
-- ---------------------------------------------------------------------------
create or replace function public.list_due_variable_recurring()
returns table (source_id uuid, due_date date)
language plpgsql
security definer
set search_path = public
as $$
declare
  r        record;
  m        date;
  gen_date date;
  last_day integer;
begin
  if auth.uid() is null then
    return;
  end if;

  for r in
    select rt.*
    from public.recurring_transactions rt
    where rt.is_active
      and rt.deleted_at is null
      and (rt.is_variable or rt.manual_confirm)
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
        source_id := r.id;
        due_date := gen_date;
        return next;
      end if;

      m := (m + interval '1 month')::date;
    end loop;
  end loop;
end;
$$;

create or replace function public.list_due_variable_installments()
returns table (source_id uuid, due_date date)
language plpgsql
security definer
set search_path = public
as $$
declare
  p        record;
  k        integer;
  m        date;
  gen_date date;
  last_day integer;
begin
  if auth.uid() is null then
    return;
  end if;

  for p in
    select ip.*
    from public.installment_plans ip
    where ip.is_active
      and ip.deleted_at is null
      and (ip.is_variable or ip.manual_confirm)
      and public.is_household_member(ip.household_id)
  loop
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
        source_id := p.id;
        due_date := gen_date;
        return next;
      end if;
    end loop;
  end loop;
end;
$$;
