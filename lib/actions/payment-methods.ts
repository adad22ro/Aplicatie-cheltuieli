"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveHouseholdId } from "@/lib/auth/current-user";
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  idSchema,
} from "@/lib/schemas/settings";
import type { SettingsActionState } from "@/lib/actions/categories";

const PATH = "/settings/payment-methods";

/** Creează o metodă de plată în gospodăria activă. */
export async function createPaymentMethodAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const parsed = createPaymentMethodSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("payment_methods")
    .insert({ household_id: householdId, ...parsed.data });
  if (error) {
    return { error: "Nu am putut salva metoda de plată. Încearcă din nou." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/** Editează o metodă de plată. */
export async function updatePaymentMethodAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = updatePaymentMethodSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { id, name } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("payment_methods").update({ name }).eq("id", id);
  if (error) {
    return { error: "Nu am putut actualiza metoda de plată. Încearcă din nou." };
  }

  revalidatePath(PATH);
  return { ok: true };
}

/** Șterge (soft delete) o metodă de plată. */
export async function deletePaymentMethodAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("payment_methods")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidatePath(PATH);
}
