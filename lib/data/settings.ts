import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Citiri pentru ecranele de setări. RLS garantează izolarea pe gospodărie; aici filtrăm
 * doar rândurile ne-șterse (soft delete = `deleted_at IS NULL`) și le ordonăm.
 */

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  color: string | null;
};

export type PaymentMethod = {
  id: string;
  name: string;
};

/** Categoriile active ale gospodăriei, ordonate: tip apoi nume. */
export async function listCategories(): Promise<Category[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, type, icon, color")
    .is("deleted_at", null)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  return data ?? [];
}

/** Metodele de plată active ale gospodăriei, ordonate alfabetic. */
export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("payment_methods")
    .select("id, name")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return data ?? [];
}
