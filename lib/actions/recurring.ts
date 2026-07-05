"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveHouseholdId } from "@/lib/auth/current-user";
import {
  createRecurringSchema,
  updateRecurringSchema,
  recurringIdSchema,
} from "@/lib/schemas/recurring";

export type RecurringActionState = { error: string } | undefined;

const PATH = "/recurring";

function parseForm(formData: FormData) {
  return {
    amount: formData.get("amount"),
    type: formData.get("type"),
    category_id: formData.get("category_id"),
    payment_method_id: formData.get("payment_method_id"),
    day_of_month: formData.get("day_of_month"),
    note: formData.get("note"),
  };
}

/** Creează o recurență în gospodăria activă. */
export async function createRecurringAction(
  _prev: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const parsed = createRecurringSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("recurring_transactions").insert({
    household_id: householdId,
    frequency: "monthly",
    ...parsed.data,
  });
  if (error) {
    return { error: "Nu am putut salva recurența. Încearcă din nou." };
  }

  revalidatePath(PATH);
  redirect(PATH);
}

/** Editează o recurență. */
export async function updateRecurringAction(
  _prev: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  const parsed = updateRecurringSchema.safeParse({
    id: formData.get("id"),
    ...parseForm(formData),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { id, ...fields } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("recurring_transactions")
    .update(fields)
    .eq("id", id);
  if (error) {
    return { error: "Nu am putut actualiza recurența. Încearcă din nou." };
  }

  revalidatePath(PATH);
  redirect(PATH);
}

/** Activează/dezactivează o recurență. */
export async function toggleRecurringAction(formData: FormData): Promise<void> {
  const parsed = recurringIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const active = formData.get("active") === "true";

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("recurring_transactions")
    .update({ is_active: !active })
    .eq("id", parsed.data.id);

  revalidatePath(PATH);
}

/** Șterge (soft delete) o recurență. Nu afectează tranzacțiile deja generate. */
export async function deleteRecurringAction(formData: FormData): Promise<void> {
  const parsed = recurringIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("recurring_transactions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidatePath(PATH);
}
