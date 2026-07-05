import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  monthStart,
  nextMonthStart,
  prevMonth,
  monthLabel,
  daysInMonth,
  currentMonth,
} from "@/lib/utils/month";

export type CategorySlice = { label: string; value: number; color: string };
export type MonthPoint = { month: string; label: string; income: number; expense: number };

// Paletă de rezervă pentru categorii fără culoare setată.
const FALLBACK = [
  "#2563eb", "#16a34a", "#dc2626", "#ea580c", "#7c3aed",
  "#0891b2", "#db2777", "#ca8a04", "#475569", "#d97706",
];

const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

/** Cheltuielile pe categorie pentru o lună, descrescător după sumă. */
export async function getExpenseByCategory(month: string): Promise<CategorySlice[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("transactions")
    .select("amount, category:categories(name, color)")
    .eq("type", "expense")
    .is("deleted_at", null)
    .gte("date", monthStart(month))
    .lt("date", nextMonthStart(month));

  const byName = new Map<string, { value: number; color: string | null }>();
  for (const t of data ?? []) {
    const cat = one(t.category);
    const name = cat?.name ?? "Fără categorie";
    const amt = typeof t.amount === "string" ? Number(t.amount) : t.amount;
    const cur = byName.get(name) ?? { value: 0, color: cat?.color ?? null };
    cur.value += amt;
    byName.set(name, cur);
  }

  return [...byName.entries()]
    .map(([label, v], i) => ({
      label,
      value: Math.round(v.value * 100) / 100,
      color: v.color ?? FALLBACK[i % FALLBACK.length]!,
    }))
    .sort((a, b) => b.value - a.value);
}

export type CategoryDelta = {
  label: string;
  current: number;
  previous: number;
  delta: number; // current - previous
  pct: number | null; // % schimbare vs. luna trecută (null dacă luna trecută = 0)
};

/**
 * Comparație a cheltuielilor pe categorie: luna `month` vs. luna anterioară.
 * Ordonată după mărimea schimbării absolute (ce a variat cel mai mult).
 */
export async function getCategoryComparison(month: string): Promise<{
  prevLabel: string;
  totalCurrent: number;
  totalPrevious: number;
  rows: CategoryDelta[];
}> {
  const prev = prevMonth(month);
  const [cur, old] = await Promise.all([
    getExpenseByCategory(month),
    getExpenseByCategory(prev),
  ]);

  const curMap = new Map(cur.map((c) => [c.label, c.value]));
  const oldMap = new Map(old.map((c) => [c.label, c.value]));
  const labels = new Set([...curMap.keys(), ...oldMap.keys()]);

  const rows: CategoryDelta[] = [...labels]
    .map((label) => {
      const current = curMap.get(label) ?? 0;
      const previous = oldMap.get(label) ?? 0;
      const delta = Math.round((current - previous) * 100) / 100;
      const pct = previous > 0 ? Math.round((delta / previous) * 100) : null;
      return { label, current, previous, delta, pct };
    })
    .filter((r) => r.current !== 0 || r.previous !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    prevLabel: monthLabel(prev),
    totalCurrent: cur.reduce((s, c) => s + c.value, 0),
    totalPrevious: old.reduce((s, c) => s + c.value, 0),
    rows,
  };
}

/** Evoluția venituri/cheltuieli pe ultimele `months` luni (cronologic). */
export async function getMonthlyTrend(month: string, months = 6): Promise<MonthPoint[]> {
  const supabase = await createServerSupabaseClient();

  // Determinăm intervalul: de la (month - months + 1) până la finalul lunii `month`.
  let first = month;
  for (let i = 1; i < months; i++) first = prevMonth(first);

  const { data } = await supabase
    .from("transactions")
    .select("amount, type, date")
    .is("deleted_at", null)
    .gte("date", monthStart(first))
    .lt("date", nextMonthStart(month));

  // Pregătim bucket-urile în ordine cronologică.
  const buckets: MonthPoint[] = [];
  let m = first;
  for (let i = 0; i < months; i++) {
    buckets.push({ month: m, label: monthLabel(m), income: 0, expense: 0 });
    m = m === month ? m : nextMonthOf(m);
  }
  const idx = new Map(buckets.map((b, i) => [b.month, i]));

  for (const t of data ?? []) {
    const mm = (t.date as string).slice(0, 7);
    const i = idx.get(mm);
    if (i === undefined) continue;
    const amt = typeof t.amount === "string" ? Number(t.amount) : t.amount;
    if (t.type === "income") buckets[i]!.income += amt;
    else buckets[i]!.expense += amt;
  }

  return buckets;
}

function nextMonthOf(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y!, m!, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const num = (v: number | string) => (typeof v === "string" ? Number(v) : v);
const round2 = (v: number) => Math.round(v * 100) / 100;

// ---------------------------------------------------------------------------
// Grafice suplimentare (toate SVG/CSS pur, fără dependențe). Volumele fiind mici
// (o gospodărie), aducem tranzacțiile relevante și agregăm în JS.
// ---------------------------------------------------------------------------

export type BalancePoint = { month: string; label: string; balance: number };

/**
 * Soldul cumulat la finalul fiecărei luni pe fereastra de `months` luni. Include tot
 * istoricul de dinainte de fereastră ca report inițial, deci reflectă averea reală.
 */
export async function getBalanceTrend(month: string, months = 6): Promise<BalancePoint[]> {
  const supabase = await createServerSupabaseClient();
  let first = month;
  for (let i = 1; i < months; i++) first = prevMonth(first);

  const { data } = await supabase
    .from("transactions")
    .select("amount, type, date")
    .is("deleted_at", null)
    .lt("date", nextMonthStart(month));

  let carry = 0; // net al tot ce e înainte de fereastră
  const netByMonth = new Map<string, number>();
  for (const t of data ?? []) {
    const signed = t.type === "income" ? num(t.amount) : -num(t.amount);
    const mm = (t.date as string).slice(0, 7);
    if (mm < first) carry += signed;
    else netByMonth.set(mm, (netByMonth.get(mm) ?? 0) + signed);
  }

  const points: BalancePoint[] = [];
  let running = carry;
  let m = first;
  for (let i = 0; i < months; i++) {
    running += netByMonth.get(m) ?? 0;
    points.push({ month: m, label: monthLabel(m), balance: round2(running) });
    m = nextMonthOf(m);
  }
  return points;
}

export type RatePoint = {
  month: string;
  label: string;
  income: number;
  expense: number;
  rate: number | null; // % economisit: (venit-cheltuieli)/venit; null dacă venit = 0
};

/** Rata de economisire lunară pe ultimele `months` luni (derivată din trend). */
export async function getSavingsRateTrend(month: string, months = 6): Promise<RatePoint[]> {
  const trend = await getMonthlyTrend(month, months);
  return trend.map((p) => ({
    ...p,
    rate: p.income > 0 ? Math.round(((p.income - p.expense) / p.income) * 100) : null,
  }));
}

export type FixedVariable = { fixed: number; variable: number; total: number };

/**
 * Cheltuieli fixe (recurențe + rate) vs variabile (restul) în luna dată. „Fix" =
 * `source` ∈ {recurring, installment}; orice altă sursă (manual, plan) = variabil.
 */
export async function getFixedVsVariable(month: string): Promise<FixedVariable> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("transactions")
    .select("amount, source")
    .eq("type", "expense")
    .is("deleted_at", null)
    .gte("date", monthStart(month))
    .lt("date", nextMonthStart(month));

  let fixed = 0;
  let variable = 0;
  for (const t of data ?? []) {
    const amt = num(t.amount);
    if (t.source === "recurring" || t.source === "installment") fixed += amt;
    else variable += amt;
  }
  return { fixed: round2(fixed), variable: round2(variable), total: round2(fixed + variable) };
}

export type DayPoint = { day: number; expense: number };

/** Cheltuiala pe fiecare zi a lunii (index 1..n). */
export async function getDailySpending(month: string): Promise<DayPoint[]> {
  const supabase = await createServerSupabaseClient();
  const total = daysInMonth(month);
  const arr: DayPoint[] = Array.from({ length: total }, (_, i) => ({ day: i + 1, expense: 0 }));

  const { data } = await supabase
    .from("transactions")
    .select("amount, date")
    .eq("type", "expense")
    .is("deleted_at", null)
    .gte("date", monthStart(month))
    .lt("date", nextMonthStart(month));

  for (const t of data ?? []) {
    const d = Number((t.date as string).slice(8, 10));
    const row = arr[d - 1];
    if (row) row.expense += num(t.amount);
  }
  for (const row of arr) row.expense = round2(row.expense);
  return arr;
}

export type SpendProjection = {
  isCurrentMonth: boolean;
  spentSoFar: number; // cheltuit până acum (azi inclusiv)
  dailyAvg: number; // media zilnică până acum
  projected: number; // proiecția la final de lună (avg × zile totale)
  daysElapsed: number;
  daysTotal: number;
};

/**
 * Proiecția cheltuielilor la final de lună pe baza mediei zilnice de până acum.
 * Are sens doar pentru luna curentă (altfel `isCurrentMonth: false`).
 */
export async function getSpendProjection(month: string): Promise<SpendProjection> {
  const daysTotal = daysInMonth(month);
  const isCurrentMonth = month === currentMonth();
  if (!isCurrentMonth) {
    return { isCurrentMonth: false, spentSoFar: 0, dailyAvg: 0, projected: 0, daysElapsed: daysTotal, daysTotal };
  }

  const daysElapsed = new Date().getDate();
  const daily = await getDailySpending(month);
  const spentSoFar = round2(
    daily.slice(0, daysElapsed).reduce((s, d) => s + d.expense, 0),
  );
  const dailyAvg = daysElapsed > 0 ? spentSoFar / daysElapsed : 0;
  return {
    isCurrentMonth: true,
    spentSoFar,
    dailyAvg: round2(dailyAvg),
    projected: round2(dailyAvg * daysTotal),
    daysElapsed,
    daysTotal,
  };
}

export type BudgetActual = {
  label: string;
  color: string;
  budget: number;
  actual: number;
  over: boolean;
};

/** Buget planificat vs cheltuială reală pe categorie, pentru luna dată. */
export async function getBudgetVsActual(month: string): Promise<BudgetActual[]> {
  const supabase = await createServerSupabaseClient();
  const [{ data: budgets }, { data: txs }] = await Promise.all([
    supabase
      .from("budgets")
      .select("category_id, amount, category:categories(name, color)")
      .is("deleted_at", null),
    supabase
      .from("transactions")
      .select("amount, category_id")
      .eq("type", "expense")
      .is("deleted_at", null)
      .gte("date", monthStart(month))
      .lt("date", nextMonthStart(month)),
  ]);

  const spentByCat = new Map<string, number>();
  for (const t of txs ?? []) {
    spentByCat.set(t.category_id, (spentByCat.get(t.category_id) ?? 0) + num(t.amount));
  }

  return (budgets ?? [])
    .map((b, i) => {
      const cat = one(b.category);
      const budget = num(b.amount);
      const actual = round2(spentByCat.get(b.category_id) ?? 0);
      return {
        label: cat?.name ?? "Fără categorie",
        color: cat?.color ?? FALLBACK[i % FALLBACK.length]!,
        budget,
        actual,
        over: actual > budget,
      };
    })
    .sort((a, b) => b.actual - a.actual);
}

export type CumulativePoint = { day: number; current: number | null; previous: number | null };
export type CumulativeComparison = {
  curLabel: string;
  prevLabel: string;
  points: CumulativePoint[];
};

/** Serie cumulată de cheltuieli pe zi pentru o lună; oprită la `capDay` (inclusiv). */
async function cumulativeDaily(month: string, capDay: number): Promise<number[]> {
  const daily = await getDailySpending(month);
  const out: number[] = [];
  let running = 0;
  for (let i = 0; i < daily.length; i++) {
    if (i + 1 > capDay) break;
    running += daily[i]!.expense;
    out.push(round2(running));
  }
  return out;
}

/**
 * Cheltuiala cumulată zi-cu-zi: luna `month` vs luna anterioară, aliniate pe ziua lunii.
 * Pentru luna curentă, linia se oprește la ziua de azi. Arată dacă ești peste/sub ritm.
 */
export async function getCumulativeComparison(month: string): Promise<CumulativeComparison> {
  const prev = prevMonth(month);
  const capCur = month === currentMonth() ? new Date().getDate() : daysInMonth(month);
  const [cur, old] = await Promise.all([
    cumulativeDaily(month, capCur),
    cumulativeDaily(prev, daysInMonth(prev)),
  ]);

  const maxDays = Math.max(cur.length, old.length);
  const points: CumulativePoint[] = Array.from({ length: maxDays }, (_, i) => ({
    day: i + 1,
    current: i < cur.length ? cur[i]! : null,
    previous: i < old.length ? old[i]! : null,
  }));
  return { curLabel: monthLabel(month), prevLabel: monthLabel(prev), points };
}

export type TopTx = {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  category: { name: string; icon: string | null } | null;
};

/** Cele mai mari `n` cheltuieli individuale ale lunii. */
export async function getTopTransactions(month: string, n = 6): Promise<TopTx[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("transactions")
    .select("id, amount, date, note, category:categories(name, icon)")
    .eq("type", "expense")
    .is("deleted_at", null)
    .gte("date", monthStart(month))
    .lt("date", nextMonthStart(month))
    .order("amount", { ascending: false })
    .limit(n);

  return (data ?? []).map((t) => ({
    id: t.id,
    amount: num(t.amount),
    date: t.date as string,
    note: t.note,
    category: one(t.category),
  }));
}

export type WeekdayPoint = { label: string; total: number };

const WEEKDAYS = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];

/** Cheltuieli pe zi a săptămânii (Luni→Duminică), însumate pe lună. */
export async function getSpendingByWeekday(month: string): Promise<WeekdayPoint[]> {
  const supabase = await createServerSupabaseClient();
  const arr: WeekdayPoint[] = WEEKDAYS.map((label) => ({ label, total: 0 }));

  const { data } = await supabase
    .from("transactions")
    .select("amount, date")
    .eq("type", "expense")
    .is("deleted_at", null)
    .gte("date", monthStart(month))
    .lt("date", nextMonthStart(month));

  for (const t of data ?? []) {
    const d = new Date(`${t.date as string}T00:00:00`);
    const idx = (d.getDay() + 6) % 7; // getDay: 0=Dum..6=Sâm → 0=Lun..6=Dum
    arr[idx]!.total += num(t.amount);
  }
  for (const row of arr) row.total = round2(row.total);
  return arr;
}
