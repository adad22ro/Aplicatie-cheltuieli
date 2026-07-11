import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listRecurring } from "@/lib/data/recurring";
import { listInstallments } from "@/lib/data/installments";

export type DueVariableItem = {
  kind: "recurring" | "installment";
  reason: "variable" | "manual"; // sumă variabilă (necunoscută) sau doar confirmare manuală
  source_id: string;
  due_date: string;
  name: string;
  icon: string | null;
  estimate: number; // sumă precompletată (estimare la variabile, sumă fixă la manuale)
};

type Slot = { source_id: string; due_date: string };

/**
 * Sloturile scadente ale recurențelor & ratelor VARIABILE care așteaptă suma reală.
 * Combină cele două RPC-uri cu detaliile din listele existente (nume, icon, estimare).
 */
export async function listDueVariable(): Promise<DueVariableItem[]> {
  const supabase = await createServerSupabaseClient();
  const [recRes, instRes, recurring, installments] = await Promise.all([
    supabase.rpc("list_due_variable_recurring"),
    supabase.rpc("list_due_variable_installments"),
    listRecurring(),
    listInstallments(),
  ]);

  const recById = new Map(recurring.map((r) => [r.id, r]));
  const instById = new Map(installments.map((i) => [i.id, i]));
  const items: DueVariableItem[] = [];

  for (const s of (recRes.data ?? []) as Slot[]) {
    const r = recById.get(s.source_id);
    if (!r) continue;
    items.push({
      kind: "recurring",
      reason: r.is_variable ? "variable" : "manual",
      source_id: s.source_id,
      due_date: s.due_date,
      name: r.category?.name ?? r.note ?? "Recurență",
      icon: r.category?.icon ?? "🔁",
      estimate: r.amount,
    });
  }
  for (const s of (instRes.data ?? []) as Slot[]) {
    const i = instById.get(s.source_id);
    if (!i) continue;
    items.push({
      kind: "installment",
      reason: i.is_variable ? "variable" : "manual",
      source_id: s.source_id,
      due_date: s.due_date,
      name: i.name,
      icon: i.category?.icon ?? "💳",
      estimate: i.installment_amount,
    });
  }

  // Cele mai vechi scadențe întâi.
  return items.sort((a, b) => (a.due_date < b.due_date ? -1 : 1));
}
