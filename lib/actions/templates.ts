"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { ensurePlan } from "@/lib/plan/ensure-plan";
import { getPlanView } from "@/lib/data/plan";
import {
  createTemplateSchema,
  addLineSchema,
  applyTemplateSchema,
  idSchema,
} from "@/lib/schemas/templates";

export type TemplateActionState = { error: string } | undefined;

const PATH = "/plan/templates";

/** Creează un șablon gol. */
export async function createTemplateAction(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const parsed = createTemplateSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Date invalide" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("allocation_templates")
    .insert({ household_id: householdId, name: parsed.data.name });
  if (error) return { error: "Nu am putut crea șablonul." };

  revalidatePath(PATH);
  return undefined;
}

/** Adaugă o linie într-un șablon (sumă fixă sau procent). */
export async function addTemplateLineAction(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const parsed = addLineSchema.safeParse({
    template_id: formData.get("template_id"),
    category_id: formData.get("category_id"),
    label: formData.get("label"),
    mode: formData.get("mode"),
    value: formData.get("value"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Date invalide" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("template_lines").insert({
    template_id: parsed.data.template_id,
    household_id: householdId,
    category_id: parsed.data.category_id,
    label: parsed.data.label,
    mode: parsed.data.mode,
    value: parsed.data.value,
  });
  if (error) return { error: "Nu am putut adăuga linia." };

  revalidatePath(PATH);
  return undefined;
}

/** Șterge o linie de șablon. */
export async function deleteTemplateLineAction(id: string): Promise<void> {
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return;
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("template_lines")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);
  revalidatePath(PATH);
}

/** Șterge un șablon (și liniile prin cascade la nivel de citire filtrate soft). */
export async function deleteTemplateAction(id: string): Promise<void> {
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return;
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("allocation_templates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);
  revalidatePath(PATH);
}

/**
 * Aplică un șablon pe planul unei luni: fiecare linie devine o alocare.
 * Procentele se calculează din banii disponibili (venit + report) ai planului.
 */
export async function applyTemplateAction(formData: FormData): Promise<void> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) return;

  const parsed = applyTemplateSchema.safeParse({
    month: formData.get("month"),
    template_id: formData.get("template_id"),
  });
  if (!parsed.success) return;
  const { month, template_id } = parsed.data;

  const planId = await ensurePlan(householdId, month);
  if (!planId) return;

  const supabase = await createServerSupabaseClient();
  const { data: lines } = await supabase
    .from("template_lines")
    .select("category_id, label, mode, value, sort_order")
    .eq("template_id", template_id)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (!lines || lines.length === 0) return;

  // Baza pentru procente = banii disponibili din plan (venit + report).
  const view = await getPlanView(month);
  const base = view.totals.available;

  const rows = lines.map((l, i) => {
    const val = typeof l.value === "string" ? Number(l.value) : l.value;
    const amount = l.mode === "percent" ? Math.round(((base * val) / 100) * 100) / 100 : val;
    return {
      plan_id: planId,
      household_id: householdId,
      category_id: l.category_id,
      label: l.label,
      planned_amount: amount,
      sort_order: 1000 + i, // sub alocările existente
    };
  });

  await supabase.from("plan_allocations").insert(rows);

  revalidatePath("/plan");
  redirect(`/plan?month=${month}`);
}
