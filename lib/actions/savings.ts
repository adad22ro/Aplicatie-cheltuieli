"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveHouseholdId } from "@/lib/auth/current-user";
import {
  createGoalSchema,
  updateGoalSchema,
  goalIdSchema,
  contributeSchema,
} from "@/lib/schemas/savings";

export type SavingsActionState = { error: string } | undefined;

const PATH = "/savings";

/** Creează un obiectiv de economisire. */
export async function createGoalAction(
  _prev: SavingsActionState,
  formData: FormData,
): Promise<SavingsActionState> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const parsed = createGoalSchema.safeParse({
    name: formData.get("name"),
    target_amount: formData.get("target_amount"),
    deadline: formData.get("deadline"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("savings_goals").insert({
    household_id: householdId,
    current_amount: 0,
    ...parsed.data,
  });
  if (error) {
    return { error: "Nu am putut salva obiectivul. Încearcă din nou." };
  }

  revalidatePath(PATH);
  return undefined;
}

/** Editează un obiectiv (nume, țintă, deadline). */
export async function updateGoalAction(
  _prev: SavingsActionState,
  formData: FormData,
): Promise<SavingsActionState> {
  const parsed = updateGoalSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    target_amount: formData.get("target_amount"),
    deadline: formData.get("deadline"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { id, ...fields } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("savings_goals").update(fields).eq("id", id);
  if (error) {
    return { error: "Nu am putut actualiza obiectivul. Încearcă din nou." };
  }

  revalidatePath(PATH);
  redirect(PATH);
}

/** Adaugă sau scoate bani dintr-un obiectiv (contribuție). Clamp la [0, ∞). */
export async function contributeAction(
  _prev: SavingsActionState,
  formData: FormData,
): Promise<SavingsActionState> {
  const parsed = contributeSchema.safeParse({
    id: formData.get("id"),
    amount: formData.get("amount"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: goal } = await supabase
    .from("savings_goals")
    .select("current_amount")
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!goal) return { error: "Obiectivul nu există." };

  const current = typeof goal.current_amount === "string"
    ? Number(goal.current_amount)
    : goal.current_amount;
  const delta = parsed.data.direction === "add" ? parsed.data.amount : -parsed.data.amount;
  const next = Math.max(0, Math.round((current + delta) * 100) / 100);

  const { error } = await supabase
    .from("savings_goals")
    .update({ current_amount: next })
    .eq("id", parsed.data.id);
  if (error) {
    return { error: "Nu am putut actualiza suma. Încearcă din nou." };
  }

  revalidatePath(PATH);
  return undefined;
}

/** Șterge (soft delete) un obiectiv. */
export async function deleteGoalAction(formData: FormData): Promise<void> {
  const parsed = goalIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("savings_goals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidatePath(PATH);
}
