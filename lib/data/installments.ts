import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type InstallmentItem = {
  id: string;
  name: string;
  total_amount: number;
  installment_amount: number;
  total_installments: number;
  paid_installments: number;
  day_of_month: number;
  start_date: string;
  is_active: boolean;
  category_id: string;
  payment_method_id: string | null;
  category: { name: string; icon: string | null; color: string | null } | null;
  // Câmpuri derivate (nu se stochează):
  remaining_amount: number; // rest de plată
  remaining_installments: number; // rate rămase
};

const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

function num(v: number | string): number {
  return typeof v === "string" ? Number(v) : v;
}

/** Planurile de rate ale gospodăriei (RLS scoped), active întâi. Cu câmpuri derivate. */
export async function listInstallments(): Promise<InstallmentItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("installment_plans")
    .select(
      "id, name, total_amount, installment_amount, total_installments, paid_installments, day_of_month, start_date, is_active, category_id, payment_method_id, category:categories(name, icon, color)",
    )
    .is("deleted_at", null)
    .order("is_active", { ascending: false })
    .order("start_date", { ascending: true });

  return (data ?? []).map((r) => {
    const total = num(r.total_amount);
    const inst = num(r.installment_amount);
    const paid = r.paid_installments;
    return {
      id: r.id,
      name: r.name,
      total_amount: total,
      installment_amount: inst,
      total_installments: r.total_installments,
      paid_installments: paid,
      day_of_month: r.day_of_month,
      start_date: r.start_date,
      is_active: r.is_active,
      category_id: r.category_id,
      payment_method_id: r.payment_method_id,
      category: one(r.category),
      remaining_amount: Math.max(0, Math.round((total - paid * inst) * 100) / 100),
      remaining_installments: Math.max(0, r.total_installments - paid),
    };
  });
}

/** Un plan pentru editare. */
export async function getInstallment(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("installment_plans")
    .select(
      "id, name, total_amount, total_installments, category_id, payment_method_id, day_of_month, start_date",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;
  return { ...data, total_amount: num(data.total_amount) };
}
