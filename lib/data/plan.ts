import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { monthStart } from "@/lib/utils/month";

export type PlanIncome = {
  id: string;
  label: string;
  amount: number;
  is_confirmed: boolean;
  recurring_id: string | null;
};

export type PlanAllocation = {
  id: string;
  label: string | null;
  planned_amount: number;
  is_paid: boolean;
  recurring_id: string | null;
  category_id: string | null;
  category: { name: string; icon: string | null; color: string | null } | null;
};

export type PlanView = {
  planId: string | null; // null = planul nu există încă pentru luna asta
  month: string;
  incomes: PlanIncome[];
  allocations: PlanAllocation[];
  totals: {
    income: number; // Σ venituri
    allocated: number; // Σ alocări planificate
    paid: number; // Σ alocări bifate „plătit"
    unallocated: number; // income - allocated (= sold proiectat)
  };
};

const num = (v: number | string) => (typeof v === "string" ? Number(v) : v);
const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

/**
 * Planul lunar al gospodăriei pentru `month` (YYYY-MM), cu venituri, alocări și totaluri.
 * Dacă planul nu a fost creat încă, `planId` e null și listele sunt goale (UI oferă
 * butonul „Creează plan", care îl seedează din recurențe — vezi ensurePlanAction).
 * RLS scopează totul la gospodăria userului.
 */
export async function getPlanView(month: string): Promise<PlanView> {
  const supabase = await createServerSupabaseClient();

  const { data: plan } = await supabase
    .from("monthly_plans")
    .select("id")
    .eq("month", monthStart(month))
    .is("deleted_at", null)
    .maybeSingle();

  if (!plan) {
    return {
      planId: null,
      month,
      incomes: [],
      allocations: [],
      totals: { income: 0, allocated: 0, paid: 0, unallocated: 0 },
    };
  }

  const [{ data: incomesRaw }, { data: allocsRaw }] = await Promise.all([
    supabase
      .from("plan_incomes")
      .select("id, label, amount, is_confirmed, recurring_id")
      .eq("plan_id", plan.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("plan_allocations")
      .select(
        "id, label, planned_amount, is_paid, recurring_id, category_id, category:categories(name, icon, color)",
      )
      .eq("plan_id", plan.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const incomes: PlanIncome[] = (incomesRaw ?? []).map((i) => ({
    id: i.id,
    label: i.label,
    amount: num(i.amount),
    is_confirmed: i.is_confirmed,
    recurring_id: i.recurring_id,
  }));

  const allocations: PlanAllocation[] = (allocsRaw ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    planned_amount: num(a.planned_amount),
    is_paid: a.is_paid,
    recurring_id: a.recurring_id,
    category_id: a.category_id,
    category: one(a.category),
  }));

  const income = incomes.reduce((s, i) => s + i.amount, 0);
  const allocated = allocations.reduce((s, a) => s + a.planned_amount, 0);
  const paid = allocations
    .filter((a) => a.is_paid)
    .reduce((s, a) => s + a.planned_amount, 0);

  return {
    planId: plan.id,
    month,
    incomes,
    allocations,
    totals: { income, allocated, paid, unallocated: income - allocated },
  };
}
