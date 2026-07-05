import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { monthStart } from "@/lib/utils/month";

/**
 * Găsește (sau creează) planul lunii pentru o gospodărie și îl seedează din recurențele
 * active: cheltuielile recurente → alocări precompletate, veniturile recurente → linii de
 * venit. Idempotent — dacă planul există, doar întoarce ID-ul (fără re-seed). Întoarce
 * ID-ul planului sau null la eroare.
 */
export async function ensurePlan(
  householdId: string,
  month: string,
): Promise<string | null> {
  const supabase = await createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("monthly_plans")
    .select("id")
    .eq("month", monthStart(month))
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: plan, error } = await supabase
    .from("monthly_plans")
    .insert({ household_id: householdId, month: monthStart(month) })
    .select("id")
    .single();
  if (error || !plan) {
    // Curse posibilă cu unique(household_id, month) — reîncearcă citirea.
    const { data: retry } = await supabase
      .from("monthly_plans")
      .select("id")
      .eq("month", monthStart(month))
      .is("deleted_at", null)
      .maybeSingle();
    return retry?.id ?? null;
  }

  const { data: recurring } = await supabase
    .from("recurring_transactions")
    .select("id, amount, type, category_id, day_of_month, note")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("day_of_month", { ascending: true });

  const incomes = (recurring ?? []).filter((r) => r.type === "income");
  const expenses = (recurring ?? []).filter((r) => r.type === "expense");

  if (incomes.length > 0) {
    await supabase.from("plan_incomes").insert(
      incomes.map((r, i) => ({
        plan_id: plan.id,
        household_id: householdId,
        label: r.note ?? "Venit recurent",
        amount: r.amount,
        recurring_id: r.id,
        sort_order: i,
      })),
    );
  }
  if (expenses.length > 0) {
    await supabase.from("plan_allocations").insert(
      expenses.map((r, i) => ({
        plan_id: plan.id,
        household_id: householdId,
        recurring_id: r.id,
        category_id: r.category_id,
        planned_amount: r.amount,
        sort_order: i,
        // Presetează săptămâna din ziua recurenței (bloc de 7 zile), plafonat la 5.
        week: Math.min(Math.floor((r.day_of_month - 1) / 7) + 1, 5),
      })),
    );
  }

  return plan.id;
}

/**
 * Adaugă un venit real (o tranzacție deja creată) ca linie în planul lunii, ca să devină
 * parte din „banii de alocat". Evită dublarea dacă tranzacția e deja legată.
 */
export async function linkIncomeToPlan(
  householdId: string,
  month: string,
  income: { label: string; amount: number; transactionId: string; userId: string },
): Promise<void> {
  const planId = await ensurePlan(householdId, month);
  if (!planId) return;

  const supabase = await createServerSupabaseClient();
  const { data: dup } = await supabase
    .from("plan_incomes")
    .select("id")
    .eq("transaction_id", income.transactionId)
    .maybeSingle();
  if (dup) return;

  await supabase.from("plan_incomes").insert({
    plan_id: planId,
    household_id: householdId,
    label: income.label,
    amount: income.amount,
    transaction_id: income.transactionId,
    user_id: income.userId,
    is_confirmed: true,
  });
}
