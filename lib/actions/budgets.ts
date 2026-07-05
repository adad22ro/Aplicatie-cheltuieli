"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { setBudgetSchema, budgetIdSchema } from "@/lib/schemas/budgets";
import { monthStart, currentMonth } from "@/lib/utils/month";

export type BudgetActionState = { error: string } | undefined;

const PATH = "/budgets";

/**
 * Setează bugetul lunar al unei categorii. O categorie are un singur buget activ:
 * dacă există deja, îl actualizăm; altfel îl creăm.
 */
export async function setBudgetAction(
  _prev: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const parsed = setBudgetSchema.safeParse({
    category_id: formData.get("category_id"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("category_id", parsed.data.category_id)
    .is("deleted_at", null)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("budgets")
        .update({ amount: parsed.data.amount })
        .eq("id", existing.id)
    : await supabase.from("budgets").insert({
        household_id: householdId,
        category_id: parsed.data.category_id,
        amount: parsed.data.amount,
        month: monthStart(currentMonth()),
      });

  if (error) {
    return { error: "Nu am putut salva bugetul. Încearcă din nou." };
  }

  revalidatePath(PATH);
  revalidatePath("/");
  return undefined;
}

/** Șterge (soft delete) bugetul unei categorii. */
export async function deleteBudgetAction(formData: FormData): Promise<void> {
  const parsed = budgetIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("budgets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidatePath(PATH);
  revalidatePath("/");
}
