import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { monthStart, nextMonthStart } from "@/lib/utils/month";

export type TransactionFilters = {
  month?: string;
  type?: "income" | "expense";
  categoryId?: string;
  paymentMethodId?: string;
  userId?: string;
  search?: string; // caută în notă (+ sumă exactă dacă e numeric)
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
  if (filters.search) {
    // Sanitizăm ca să nu spargem sintaxa `.or` din PostgREST (virgule/paranteze).
    const q = filters.search.replace(/[,()]/g, " ").trim();
    if (q) {
      const parts = [`note.ilike.%${q}%`];
      const n = Number(q.replace(",", "."));
      if (Number.isFinite(n)) parts.push(`amount.eq.${n}`);
      query = query.or(parts.join(","));
    }
  }

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

export type QuickSuggestion = {
  type: "income" | "expense";
  category_id: string;
  category_name: string;
  icon: string | null;
  amount: number;
  note: string | null;
};

/**
 * Sugestii pentru adăugare rapidă („la fel ca data trecută"): combinații distincte recente
 * de (tip, categorie, sumă, notă). Refolosite ca butoane care precompletează formularul.
 */
export async function frequentTransactions(limit = 6): Promise<QuickSuggestion[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("transactions")
    .select("type, amount, note, category_id, category:categories(name, icon)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(80);

  const one = <T>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;

  const seen = new Set<string>();
  const out: QuickSuggestion[] = [];
  for (const t of data ?? []) {
    if (!t.category_id) continue;
    const amount = typeof t.amount === "string" ? Number(t.amount) : t.amount;
    const key = `${t.type}|${t.category_id}|${amount}|${t.note ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const cat = one(t.category);
    out.push({
      type: t.type,
      category_id: t.category_id,
      category_name: cat?.name ?? "—",
      icon: cat?.icon ?? null,
      amount,
      note: t.note,
    });
    if (out.length >= limit) break;
  }
  return out;
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
