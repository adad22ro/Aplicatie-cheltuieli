"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveHouseholdId } from "@/lib/auth/current-user";
import {
  createInstallmentSchema,
  updateInstallmentSchema,
  installmentIdSchema,
  installmentAmount,
} from "@/lib/schemas/installments";

export type InstallmentActionState = { error: string } | undefined;

const PATH = "/installments";

function parseForm(formData: FormData) {
  return {
    name: formData.get("name"),
    total_amount: formData.get("total_amount"),
    total_installments: formData.get("total_installments"),
    category_id: formData.get("category_id"),
    payment_method_id: formData.get("payment_method_id"),
    day_of_month: formData.get("day_of_month"),
    start_date: formData.get("start_date"),
    is_variable: formData.get("is_variable"),
    manual_confirm: formData.get("manual_confirm"),
  };
}

export async function createInstallmentAction(
  _prev: InstallmentActionState,
  formData: FormData,
): Promise<InstallmentActionState> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const parsed = createInstallmentSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { total_amount, total_installments, ...rest } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("installment_plans").insert({
    household_id: householdId,
    total_amount,
    total_installments,
    installment_amount: installmentAmount(total_amount, total_installments),
    paid_installments: 0,
    is_active: true,
    ...rest,
  });
  if (error) {
    return { error: "Nu am putut salva planul de rate. Încearcă din nou." };
  }

  revalidatePath(PATH);
  redirect(PATH);
}

export async function updateInstallmentAction(
  _prev: InstallmentActionState,
  formData: FormData,
): Promise<InstallmentActionState> {
  const parsed = updateInstallmentSchema.safeParse({
    id: formData.get("id"),
    ...parseForm(formData),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { id, total_amount, total_installments, ...rest } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("installment_plans")
    .update({
      total_amount,
      total_installments,
      installment_amount: installmentAmount(total_amount, total_installments),
      ...rest,
    })
    .eq("id", id);
  if (error) {
    return { error: "Nu am putut actualiza planul. Încearcă din nou." };
  }

  revalidatePath(PATH);
  redirect(PATH);
}

/** Activează/dezactivează manual un plan (ex: pauză). */
export async function toggleInstallmentAction(formData: FormData): Promise<void> {
  const parsed = installmentIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const active = formData.get("active") === "true";

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("installment_plans")
    .update({ is_active: !active })
    .eq("id", parsed.data.id);

  revalidatePath(PATH);
}

/** Șterge (soft delete) un plan. Nu afectează tranzacțiile deja generate. */
export async function deleteInstallmentAction(formData: FormData): Promise<void> {
  const parsed = installmentIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("installment_plans")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidatePath(PATH);
}
