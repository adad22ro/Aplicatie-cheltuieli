"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveHouseholdId } from "@/lib/auth/current-user";
import {
  createCategorySchema,
  updateCategorySchema,
  idSchema,
} from "@/lib/schemas/settings";

export type SettingsActionState = { error: string } | { ok: true } | undefined;

const CATEGORIES_PATH = "/settings/categories";

/** Creează o categorie în gospodăria activă. */
export async function createCategoryAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    icon: formData.get("icon"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("categories").insert({
    household_id: householdId,
    ...parsed.data,
  });
  if (error) {
    return { error: "Nu am putut salva categoria. Încearcă din nou." };
  }

  revalidatePath(CATEGORIES_PATH);
  return { ok: true };
}

/** Editează o categorie existentă. RLS asigură că e din gospodăria userului. */
export async function updateCategoryAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = updateCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
    icon: formData.get("icon"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const { id, ...fields } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("categories").update(fields).eq("id", id);
  if (error) {
    return { error: "Nu am putut actualiza categoria. Încearcă din nou." };
  }

  revalidatePath(CATEGORIES_PATH);
  return { ok: true };
}

/** Șterge (soft delete) o categorie. */
export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidatePath(CATEGORIES_PATH);
}
