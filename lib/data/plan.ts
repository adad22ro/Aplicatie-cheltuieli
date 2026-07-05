import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { monthStart, prevMonth } from "@/lib/utils/month";
import { listMemberProfiles } from "@/lib/data/profiles";

export type PlanIncome = {
  id: string;
  label: string;
  amount: number;
  is_confirmed: boolean;
  recurring_id: string | null;
  user_id: string | null;
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

export type Contribution = { user_id: string | null; name: string; amount: number };

export type PlanView = {
  planId: string | null; // null = planul nu există încă pentru luna asta
  month: string;
  incomes: PlanIncome[];
  allocations: PlanAllocation[];
  contributions: Contribution[]; // cine cât a adus (venituri grupate pe persoană)
  totals: {
    income: number; // Σ venituri
    allocated: number; // Σ alocări planificate
    paid: number; // Σ alocări bifate „plătit"
    rollover: number; // report din luna anterioară (income - allocated al planului precedent)
    available: number; // income + rollover (banii de repartizat)
    unallocated: number; // available - allocated (= sold proiectat)
  };
};

const num = (v: number | string) => (typeof v === "string" ? Number(v) : v);
const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

/** Reportul din luna anterioară: (venituri - alocări) ale planului lunii precedente. */
async function getRollover(month: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { data: prevPlan } = await supabase
    .from("monthly_plans")
    .select("id")
    .eq("month", monthStart(prevMonth(month)))
    .is("deleted_at", null)
    .maybeSingle();
  if (!prevPlan) return 0;

  const [{ data: pi }, { data: pa }] = await Promise.all([
    supabase.from("plan_incomes").select("amount").eq("plan_id", prevPlan.id).is("deleted_at", null),
    supabase
      .from("plan_allocations")
      .select("planned_amount")
      .eq("plan_id", prevPlan.id)
      .is("deleted_at", null),
  ]);
  const inc = (pi ?? []).reduce((s, x) => s + num(x.amount), 0);
  const alloc = (pa ?? []).reduce((s, x) => s + num(x.planned_amount), 0);
  return inc - alloc;
}

/**
 * Planul lunar al gospodăriei pentru `month` (YYYY-MM): venituri, alocări, contribuții
 * pe persoană, rollover din luna anterioară și totaluri. Dacă planul nu există încă,
 * `planId` e null și listele sunt goale. RLS scopează totul la gospodăria userului.
 */
export async function getPlanView(month: string): Promise<PlanView> {
  const supabase = await createServerSupabaseClient();

  const { data: plan } = await supabase
    .from("monthly_plans")
    .select("id")
    .eq("month", monthStart(month))
    .is("deleted_at", null)
    .maybeSingle();

  const rollover = await getRollover(month);

  if (!plan) {
    return {
      planId: null,
      month,
      incomes: [],
      allocations: [],
      contributions: [],
      totals: {
        income: 0,
        allocated: 0,
        paid: 0,
        rollover,
        available: rollover,
        unallocated: rollover,
      },
    };
  }

  const [{ data: incomesRaw }, { data: allocsRaw }, members] = await Promise.all([
    supabase
      .from("plan_incomes")
      .select("id, label, amount, is_confirmed, recurring_id, user_id")
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
    listMemberProfiles(),
  ]);

  const incomes: PlanIncome[] = (incomesRaw ?? []).map((i) => ({
    id: i.id,
    label: i.label,
    amount: num(i.amount),
    is_confirmed: i.is_confirmed,
    recurring_id: i.recurring_id,
    user_id: i.user_id,
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

  // Contribuții pe persoană (venituri grupate pe user_id; null = „Comun").
  const nameById = new Map(members.map((m) => [m.user_id, m.name]));
  const byUser = new Map<string | null, number>();
  for (const i of incomes) {
    byUser.set(i.user_id, (byUser.get(i.user_id) ?? 0) + i.amount);
  }
  const contributions: Contribution[] = [...byUser.entries()]
    .map(([uid, amount]) => ({
      user_id: uid,
      name: uid ? (nameById.get(uid) ?? "Membru") : "Comun",
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const income = incomes.reduce((s, i) => s + i.amount, 0);
  const allocated = allocations.reduce((s, a) => s + a.planned_amount, 0);
  const paid = allocations
    .filter((a) => a.is_paid)
    .reduce((s, a) => s + a.planned_amount, 0);
  const available = income + rollover;

  return {
    planId: plan.id,
    month,
    incomes,
    allocations,
    contributions,
    totals: {
      income,
      allocated,
      paid,
      rollover,
      available,
      unallocated: available - allocated,
    },
  };
}
