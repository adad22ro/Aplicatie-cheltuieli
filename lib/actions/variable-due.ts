"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser, getActiveHouseholdId } from "@/lib/auth/current-user";

export type VariableDueActionState = { error: string } | undefined;

const confirmSchema = z.object({
  kind: z.enum(["recurring", "installment"]),
  source_id: z.string().uuid("ID invalid"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă"),
  amount: z.preprocess(
    (v) => (typeof v === "string" ? Number(v.replace(",", ".").trim()) : v),
    z
      .number({ error: "Suma este obligatorie" })
      .positive("Suma trebuie să fie mai mare ca 0")
      .max(1_000_000_000, "Sumă prea mare"),
  ),
});

function revalidate() {
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/recurring");
  revalidatePath("/installments");
}

/**
 * Confirmă suma reală a unui slot scadent (recurență/rată variabilă) → creează
 * tranzacția. Indexul unic (source_id, date) previne dublurile.
 */
export async function confirmVariableAction(
  _prev: VariableDueActionState,
  formData: FormData,
): Promise<VariableDueActionState> {
  const [user, householdId] = await Promise.all([
    getCurrentUser(),
    getActiveHouseholdId(),
  ]);
  if (!householdId || !user) return { error: "Sesiune expirată. Reautentifică-te." };

  const parsed = confirmSchema.safeParse({
    kind: formData.get("kind"),
    source_id: formData.get("source_id"),
    due_date: formData.get("due_date"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { kind, source_id, due_date, amount } = parsed.data;

  const supabase = await createServerSupabaseClient();

  if (kind === "recurring") {
    const { data: rec } = await supabase
      .from("recurring_transactions")
      .select("type, category_id, payment_method_id, note, is_variable")
      .eq("id", source_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!rec || !rec.is_variable) return { error: "Recurența nu există." };

    const { error } = await supabase.from("transactions").insert({
      household_id: householdId,
      user_id: user.id,
      amount,
      type: rec.type,
      category_id: rec.category_id,
      payment_method_id: rec.payment_method_id,
      date: due_date,
      note: rec.note,
      source: "recurring",
      source_id,
    });
    if (error) return { error: "Nu am putut salva. Poate e deja completată." };
  } else {
    const { data: plan } = await supabase
      .from("installment_plans")
      .select("category_id, payment_method_id, name, total_installments, is_variable")
      .eq("id", source_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!plan || !plan.is_variable) return { error: "Planul de rate nu există." };

    const { error } = await supabase.from("transactions").insert({
      household_id: householdId,
      user_id: user.id,
      amount,
      type: "expense",
      category_id: plan.category_id,
      payment_method_id: plan.payment_method_id,
      date: due_date,
      note: plan.name,
      source: "installment",
      source_id,
    });
    if (error) return { error: "Nu am putut salva. Poate e deja completată." };

    // Recalculează ratele plătite și dezactivează planul la epuizare.
    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("source_id", source_id)
      .eq("source", "installment");
    const paid = count ?? 0;
    await supabase
      .from("installment_plans")
      .update({ paid_installments: paid, is_active: paid < plan.total_installments })
      .eq("id", source_id);
  }

  revalidate();
  return undefined;
}
