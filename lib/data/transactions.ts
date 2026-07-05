import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { monthStart, nextMonthStart } from "@/lib/utils/month";

export type TransactionFilters = {
  month?: string;
  type?: "income" | "expense";
  categoryId?: string;
  paymentMethodId?: string;
  userId?: string;
};

export type TransactionListItem = {
  id: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  note: string | null;
  user_id: string;
  category: { name: string; icon: string | null; color: string | null } | null;
  payment_method: { name: string } | null;
};

/**
 * Tranzacțiile active ale gospodăriei (RLS scoped), cu categoria și metoda de plată
 * atașate. Ordonate descrescător pe dată (apoi pe momentul creării). Filtrarea pe lună
 * vine la dashboard (pasul 6); aici listăm recentele.
 */
export async function listTransactions(
  filters: TransactionFilters = {},
  limit = 200,
): Promise<TransactionListItem[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("transactions")
    .select(
      "id, amount, type, date, note, user_id, category:categories(name, icon, color), payment_method:payment_methods(name)",
    )
    .is("deleted_at", null);

  if (filters.month) {
    query = query
      .gte("date", monthStart(filters.month))
      .lt("date", nextMonthStart(filters.month));
  }
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.paymentMethodId) {
    query = query.eq("payment_method_id", filters.paymentMethodId);
  }
  if (filters.userId) query = query.eq("user_id", filters.userId);

  const { data } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  // Relațiile embed vin ca array din supabase-js (deși sunt to-one); luăm primul.
  // amount vine ca number sau string (numeric); normalizăm la number.
  const one = <T>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;

  return (data ?? []).map((t) => ({
    id: t.id,
    amount: typeof t.amount === "string" ? Number(t.amount) : t.amount,
    type: t.type,
    date: t.date,
    note: t.note,
    user_id: t.user_id,
    category: one(t.category),
    payment_method: one(t.payment_method),
  }));
}

/** O singură tranzacție (pentru pagina de editare). Null dacă nu există / nu e vizibilă. */
export async function getTransaction(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("transactions")
    .select("id, amount, type, category_id, payment_method_id, date, note")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;
  return {
    ...data,
    amount: typeof data.amount === "string" ? Number(data.amount) : data.amount,
  };
}
