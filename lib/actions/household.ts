"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { householdNameSchema } from "@/lib/schemas/auth";

export type HouseholdActionState = { error: string } | undefined;

/**
 * Creează o gospodărie nouă și îl adaugă pe creator ca `owner` (atomic, prin RPC-ul
 * SECURITY DEFINER `create_household`). Reverifică autentificarea în interiorul
 * action-ului — o Server Action e un endpoint public.
 */
export async function createHouseholdAction(
  _prev: HouseholdActionState,
  formData: FormData,
): Promise<HouseholdActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = householdNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_household", {
    p_name: parsed.data.name,
  });
  if (error) {
    return { error: "Nu am putut crea gospodăria. Încearcă din nou." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
