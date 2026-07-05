import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  monthStart,
  nextMonthStart,
  prevMonth,
  monthLabel,
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
