"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser, getActiveHouseholdId } from "@/lib/auth/current-user";
import {
  createDebtSchema,
  updateDebtSchema,
  debtIdSchema,
  debtPaymentSchema,
  debtPaymentIdSchema,
} from "@/lib/schemas/debts";

export type DebtActionState = { error: string } | undefined;

const PATH = "/debts";

function revalidate() {
  revalidatePath(PATH);
  revalidatePath("/");
}

/** Adaugă o datorie (bani împrumutați de la / către o persoană). */
export async function createDebtAction(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const [user, householdId] = await Promise.all([
    getCurrentUser(),
    getActiveHouseholdId(),
  ]);
  if (!householdId) redirect("/onboarding");

  const parsed = createDebtSchema.safeParse({
    person: formData.get("person"),
    direction: formData.get("direction"),
    amount: formData.get("amount"),
    note: formData.get("note"),
    borrowed_date: formData.get("borrowed_date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { borrowed_date, ...rest } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("debts").insert({
    household_id: householdId,
    user_id: user?.id ?? null,
    ...(borrowed_date ? { borrowed_date } : {}),
    ...rest,
  });
  if (error) return { error: "Nu am putut salva datoria. Încearcă din nou." };

  revalidate();
  return undefined;
}

/** Editează o datorie. */
export async function updateDebtAction(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const parsed = updateDebtSchema.safeParse({
    id: formData.get("id"),
    person: formData.get("person"),
    direction: formData.get("direction"),
    amount: formData.get("amount"),
    note: formData.get("note"),
    borrowed_date: formData.get("borrowed_date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { id, borrowed_date, ...rest } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("debts")
    .update({ ...rest, ...(borrowed_date ? { borrowed_date } : {}) })
    .eq("id", id);
  if (error) return { error: "Nu am putut actualiza datoria." };

  revalidate();
  redirect(PATH);
}

/** Șterge (soft) o datorie. */
export async function deleteDebtAction(formData: FormData): Promise<void> {
  const parsed = debtIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("debts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidate();
}

/** Înregistrează o restituire (plată parțială/totală) pe o datorie. */
export async function addDebtPaymentAction(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const [user, householdId] = await Promise.all([
    getCurrentUser(),
    getActiveHouseholdId(),
  ]);
  if (!householdId) redirect("/onboarding");

  const parsed = debtPaymentSchema.safeParse({
    debt_id: formData.get("debt_id"),
    amount: formData.get("amount"),
    paid_date: formData.get("paid_date"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { debt_id, amount, paid_date, note } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("debt_payments").insert({
    debt_id,
    household_id: householdId,
    user_id: user?.id ?? null,
    amount,
    note,
    ...(paid_date ? { paid_date } : {}),
  });
  if (error) return { error: "Nu am putut salva restituirea." };

  revalidate();
  return undefined;
}

/** Șterge (soft) o restituire. */
export async function deleteDebtPaymentAction(formData: FormData): Promise<void> {
  const parsed = debtPaymentIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("debt_payments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidate();
}

/**
 * „Am înapoiat tot" — închide datoria: adaugă o restituire pentru restul rămas
 * (dacă mai e ceva de restituit) și marchează `settled_at`.
 */
export async function settleDebtAction(formData: FormData): Promise<void> {
  const parsed = debtIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const id = parsed.data.id;

  const [user, householdId] = await Promise.all([
    getCurrentUser(),
    getActiveHouseholdId(),
  ]);
  if (!householdId) return;

  const supabase = await createServerSupabaseClient();
  const { data: debt } = await supabase
    .from("debts")
    .select("amount, payments:debt_payments(amount, deleted_at)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!debt) return;

  const amount = typeof debt.amount === "string" ? Number(debt.amount) : debt.amount;
  const paid = ((debt.payments ?? []) as Array<{ amount: number | string; deleted_at: string | null }>)
    .filter((p) => p.deleted_at === null)
    .reduce((s, p) => s + (typeof p.amount === "string" ? Number(p.amount) : p.amount), 0);
  const remaining = Math.round((amount - paid) * 100) / 100;

  if (remaining > 0) {
    await supabase.from("debt_payments").insert({
      debt_id: id,
      household_id: householdId,
      user_id: user?.id ?? null,
      amount: remaining,
      note: "Restituit integral",
    });
  }
  await supabase
    .from("debts")
    .update({ settled_at: new Date().toISOString() })
    .eq("id", id);

  revalidate();
}

/** Redeschide o datorie închisă (scoate marcajul `settled_at`). */
export async function reopenDebtAction(formData: FormData): Promise<void> {
  const parsed = debtIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase.from("debts").update({ settled_at: null }).eq("id", parsed.data.id);

  revalidate();
}
