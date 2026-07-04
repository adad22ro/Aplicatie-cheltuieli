"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser, getActiveHouseholdId } from "@/lib/auth/current-user";
import {
  createTransactionSchema,
  updateTransactionSchema,
  txIdSchema,
} from "@/lib/schemas/transactions";

export type TransactionActionState = { error: string } | undefined;

function revalidateAll() {
  revalidatePath("/transactions");
  revalidatePath("/");
}

function parseForm(formData: FormData) {
  return {
    amount: formData.get("amount"),
    type: formData.get("type"),
    category_id: formData.get("category_id"),
    payment_method_id: formData.get("payment_method_id"),
    date: formData.get("date"),
    note: formData.get("note"),
  };
}

/** Creează o tranzacție manuală în gospodăria activă (autor = userul curent). */
export async function createTransactionAction(
  _prev: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const [user, householdId] = await Promise.all([
    getCurrentUser(),
    getActiveHouseholdId(),
  ]);
  if (!user) redirect("/login");
  if (!householdId) redirect("/onboarding");

  const parsed = createTransactionSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("transactions").insert({
    household_id: householdId,
    user_id: user.id,
    source: "manual",
    ...parsed.data,
  });
  if (error) {
    return { error: "Nu am putut salva tranzacția. Încearcă din nou." };
  }

  revalidateAll();
  redirect("/transactions");
}

/** Editează o tranzacție existentă (RLS o restrânge la gospodăria userului). */
export async function updateTransactionAction(
  _prev: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const parsed = updateTransactionSchema.safeParse({
    id: formData.get("id"),
    ...parseForm(formData),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { id, ...fields } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("transactions").update(fields).eq("id", id);
  if (error) {
    return { error: "Nu am putut actualiza tranzacția. Încearcă din nou." };
  }

  revalidateAll();
  redirect("/transactions");
}

/** Șterge (soft delete) o tranzacție. Folosită de fluxul cu undo. */
export async function deleteTransactionAction(id: string): Promise<void> {
  const parsed = txIdSchema.safeParse({ id });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("transactions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidateAll();
}

/** Restaurează o tranzacție ștearsă (undo). */
export async function restoreTransactionAction(id: string): Promise<void> {
  const parsed = txIdSchema.safeParse({ id });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("transactions")
    .update({ deleted_at: null })
    .eq("id", parsed.data.id);

  revalidateAll();
}

/**
 * Duplică o tranzacție (creează una identică, de ajustat) și redirectează la editarea ei.
 * Copiază câmpurile din original; autorul devine userul curent.
 */
export async function duplicateTransactionAction(formData: FormData): Promise<void> {
  const parsed = txIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const [user, householdId] = await Promise.all([
    getCurrentUser(),
    getActiveHouseholdId(),
  ]);
  if (!user || !householdId) return;

  const supabase = await createServerSupabaseClient();
  const { data: orig } = await supabase
    .from("transactions")
    .select("amount, type, category_id, payment_method_id, date, note")
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!orig) return;

  const { data: created } = await supabase
    .from("transactions")
    .insert({
      household_id: householdId,
      user_id: user.id,
      source: "manual",
      ...orig,
    })
    .select("id")
    .single();

  revalidateAll();
  if (created) redirect(`/transactions/${created.id}/edit`);
}
