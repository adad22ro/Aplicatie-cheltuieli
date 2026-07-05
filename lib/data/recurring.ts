import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type RecurringItem = {
  id: string;
  amount: number;
  type: "income" | "expense";
  day_of_month: number;
  is_active: boolean;
  note: string | null;
  category_id: string;
  payment_method_id: string | null;
  category: { name: string; icon: string | null; color: string | null } | null;
  payment_method: { name: string } | null;
};

/** Recurențele gospodăriei (RLS scoped): active întâi, apoi după ziua lunii. */
export async function listRecurring(): Promise<RecurringItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("recurring_transactions")
    .select(
      "id, amount, type, day_of_month, is_active, note, category_id, payment_method_id, category:categories(name, icon, color), payment_method:payment_methods(name)",
    )
    .is("deleted_at", null)
    .order("is_active", { ascending: false })
    .order("day_of_month", { ascending: true });

  const one = <T>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;

  return (data ?? []).map((r) => ({
    id: r.id,
    amount: typeof r.amount === "string" ? Number(r.amount) : r.amount,
    type: r.type,
    day_of_month: r.day_of_month,
    is_active: r.is_active,
    note: r.note,
    category_id: r.category_id,
    payment_method_id: r.payment_method_id,
    category: one(r.category),
    payment_method: one(r.payment_method),
  }));
}

/** O recurență pentru editare. */
export async function getRecurring(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("recurring_transactions")
    .select("id, amount, type, category_id, payment_method_id, day_of_month, note")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;
  return {
    ...data,
    amount: typeof data.amount === "string" ? Number(data.amount) : data.amount,
  };
}
