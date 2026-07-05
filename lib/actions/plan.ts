"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser, getActiveHouseholdId } from "@/lib/auth/current-user";
import { currentMonth, monthStart } from "@/lib/utils/month";
import { ensurePlan } from "@/lib/plan/ensure-plan";
import {
  addIncomeSchema,
  addAllocationSchema,
  idSchema,
} from "@/lib/schemas/plan";

export type PlanActionState = { error: string } | undefined;

function revalidate() {
  revalidatePath("/plan");
  revalidatePath("/");
}

/** Data tranzacției generate dintr-o alocare: azi dacă e luna curentă, altfel ziua 1 a lunii. */
function planTxDate(month: string): string {
  if (month === currentMonth()) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return monthStart(month);
}

/** Creează planul lunii (seedat din recurențe). Declanșat de butonul „Creează plan". */
export async function ensurePlanAction(formData: FormData): Promise<void> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) return;
  const month = String(formData.get("month") ?? "");
  await ensurePlan(householdId, month);
  revalidate();
}

/** Adaugă un venit în plan; opțional îl transformă în sursă recurentă. */
export async function addIncomeAction(
  _prev: PlanActionState,
  formData: FormData,
): Promise<PlanActionState> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const parsed = addIncomeSchema.safeParse({
    month: formData.get("month"),
    label: formData.get("label"),
    amount: formData.get("amount"),
    is_recurring: formData.get("is_recurring"),
    category_id: formData.get("category_id"),
    day_of_month: formData.get("day_of_month"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { month, label, amount, is_recurring, category_id, day_of_month } = parsed.data;

  const planId = await ensurePlan(householdId, month);
  if (!planId) return { error: "Nu am putut pregăti planul." };

  const supabase = await createServerSupabaseClient();
  let recurringId: string | null = null;

  // Bifa „recurent" → creează o recurență de tip venit (gestionabilă din /recurring)
  if (is_recurring && category_id) {
    const { data: rec } = await supabase
      .from("recurring_transactions")
      .insert({
        household_id: householdId,
        amount,
        type: "income",
        category_id,
        day_of_month: day_of_month ?? 1,
        note: label,
        frequency: "monthly",
      })
      .select("id")
      .single();
    recurringId = rec?.id ?? null;
  }

  const { error } = await supabase.from("plan_incomes").insert({
    plan_id: planId,
    household_id: householdId,
    label,
    amount,
    recurring_id: recurringId,
  });
  if (error) return { error: "Nu am putut salva venitul." };

  revalidate();
  return undefined;
}

/** Adaugă o cheltuială ad-hoc în plan („+ Adaugă altceva"). */
export async function addAllocationAction(
  _prev: PlanActionState,
  formData: FormData,
): Promise<PlanActionState> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const parsed = addAllocationSchema.safeParse({
    month: formData.get("month"),
    category_id: formData.get("category_id"),
    label: formData.get("label"),
    planned_amount: formData.get("planned_amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { month, category_id, label, planned_amount } = parsed.data;

  const planId = await ensurePlan(householdId, month);
  if (!planId) return { error: "Nu am putut pregăti planul." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("plan_allocations").insert({
    plan_id: planId,
    household_id: householdId,
    category_id,
    label,
    planned_amount,
  });
  if (error) return { error: "Nu am putut salva alocarea." };

  revalidate();
  return undefined;
}

/** Actualizează suma alocată a unui rând (auto-save la blur din editor). */
export async function setAllocationAmountAction(
  id: string,
  amount: number,
): Promise<void> {
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return;
  const value = Number.isFinite(amount) && amount >= 0 ? amount : 0;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("plan_allocations")
    .update({ planned_amount: value })
    .eq("id", parsed.data.id);

  revalidate();
}

/** Actualizează suma unui venit din plan (auto-save la blur). */
export async function setIncomeAmountAction(id: string, amount: number): Promise<void> {
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return;
  const value = Number.isFinite(amount) && amount >= 0 ? amount : 0;

  const supabase = await createServerSupabaseClient();
  await supabase.from("plan_incomes").update({ amount: value }).eq("id", parsed.data.id);

  revalidate();
}

/**
 * Bifează/debifează „plătit" pe o alocare.
 * • bifat  → creează o tranzacție reală (expense, source='plan') și o leagă.
 * • debifat → șterge (soft) tranzacția legată.
 */
export async function togglePaidAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const id = parsed.data.id;

  const [user, householdId] = await Promise.all([
    getCurrentUser(),
    getActiveHouseholdId(),
  ]);
  if (!user || !householdId) return;

  const supabase = await createServerSupabaseClient();
  const { data: alloc } = await supabase
    .from("plan_allocations")
    .select(
      "id, planned_amount, category_id, label, is_paid, paid_transaction_id, plan:monthly_plans(month)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!alloc) return;

  if (alloc.is_paid) {
    // Debifare: șterge tranzacția generată (dacă există)
    if (alloc.paid_transaction_id) {
      await supabase
        .from("transactions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", alloc.paid_transaction_id);
    }
    await supabase
      .from("plan_allocations")
      .update({ is_paid: false, paid_transaction_id: null })
      .eq("id", id);
    revalidate();
    return;
  }

  // Bifare: creează tranzacția reală. Fără categorie nu putem (category_id NOT NULL).
  if (!alloc.category_id) {
    await supabase.from("plan_allocations").update({ is_paid: true }).eq("id", id);
    revalidate();
    return;
  }

  const planRow = Array.isArray(alloc.plan) ? alloc.plan[0] : alloc.plan;
  const monthStr =
    typeof planRow?.month === "string" ? planRow.month.slice(0, 7) : currentMonth();

  const { data: tx } = await supabase
    .from("transactions")
    .insert({
      household_id: householdId,
      user_id: user.id,
      amount: alloc.planned_amount,
      type: "expense",
      category_id: alloc.category_id,
      date: planTxDate(monthStr),
      note: alloc.label,
      source: "plan",
      source_id: alloc.id,
    })
    .select("id")
    .single();

  await supabase
    .from("plan_allocations")
    .update({ is_paid: true, paid_transaction_id: tx?.id ?? null })
    .eq("id", id);

  revalidate();
}

/** Șterge o alocare din plan. Dacă era plătită, șterge și tranzacția legată. */
export async function deleteAllocationAction(id: string): Promise<void> {
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  const { data: alloc } = await supabase
    .from("plan_allocations")
    .select("paid_transaction_id")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (alloc?.paid_transaction_id) {
    await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", alloc.paid_transaction_id);
  }
  await supabase
    .from("plan_allocations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidate();
}

/** Șterge un venit din plan. NU șterge sursa recurentă (o gestionezi din /recurring). */
export async function deleteIncomeAction(id: string): Promise<void> {
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("plan_incomes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidate();
}
