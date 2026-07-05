import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { monthStart, nextMonthStart, currentMonth } from "@/lib/utils/month";

export type BudgetItem = {
  id: string;
  category_id: string;
  amount: number;
  category: { name: string; icon: string | null; color: string | null } | null;
  spent: number; // cheltuit în luna curentă pe categoria respectivă
  remaining: number; // rămas (poate fi negativ = depășire)
  pct: number; // procent cheltuit (0..100+, plafonat la 100 pentru bară)
  over: boolean; // depășit
};

const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

/** Bugetele active ale gospodăriei, cu cât s-a cheltuit în luna curentă pe fiecare. */
export async function listBudgetsWithProgress(): Promise<BudgetItem[]> {
  const supabase = await createServerSupabaseClient();
  const month = currentMonth();

  const [{ data: budgets }, { data: txs }] = await Promise.all([
    supabase
      .from("budgets")
      .select("id, category_id, amount, category:categories(name, icon, color)")
      .is("deleted_at", null),
    supabase
      .from("transactions")
      .select("amount, category_id")
      .eq("type", "expense")
      .is("deleted_at", null)
      .gte("date", monthStart(month))
      .lt("date", nextMonthStart(month)),
  ]);

  // Suma cheltuită pe categorie în luna curentă.
  const spentByCat = new Map<string, number>();
  for (const t of txs ?? []) {
    const amt = typeof t.amount === "string" ? Number(t.amount) : t.amount;
    spentByCat.set(t.category_id, (spentByCat.get(t.category_id) ?? 0) + amt);
  }

  return (budgets ?? [])
    .map((b) => {
      const amount = typeof b.amount === "string" ? Number(b.amount) : b.amount;
      const spent = spentByCat.get(b.category_id) ?? 0;
      const remaining = Math.round((amount - spent) * 100) / 100;
      return {
        id: b.id,
        category_id: b.category_id,
        amount,
        category: one(b.category),
        spent,
        remaining,
        pct: amount > 0 ? Math.min(100, Math.round((spent / amount) * 100)) : 0,
        over: spent > amount,
      };
    })
    .sort((a, b) => (a.category?.name ?? "").localeCompare(b.category?.name ?? ""));
}
