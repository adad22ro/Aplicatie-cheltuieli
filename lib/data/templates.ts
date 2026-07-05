import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TemplateLine = {
  id: string;
  category_id: string | null;
  label: string | null;
  mode: "fixed" | "percent";
  value: number;
  category: { name: string; icon: string | null } | null;
};

export type AllocationTemplate = {
  id: string;
  name: string;
  lines: TemplateLine[];
};

const num = (v: number | string) => (typeof v === "string" ? Number(v) : v);
const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

/** Șabloanele de alocare ale gospodăriei, cu liniile lor (RLS scoped). */
export async function listTemplates(): Promise<AllocationTemplate[]> {
  const supabase = await createServerSupabaseClient();
  const { data: templates } = await supabase
    .from("allocation_templates")
    .select("id, name")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (!templates || templates.length === 0) return [];

  const { data: lines } = await supabase
    .from("template_lines")
    .select("id, template_id, category_id, label, mode, value, category:categories(name, icon)")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const byTemplate = new Map<string, TemplateLine[]>();
  for (const l of lines ?? []) {
    const arr = byTemplate.get(l.template_id) ?? [];
    arr.push({
      id: l.id,
      category_id: l.category_id,
      label: l.label,
      mode: l.mode,
      value: num(l.value),
      category: one(l.category),
    });
    byTemplate.set(l.template_id, arr);
  }

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    lines: byTemplate.get(t.id) ?? [],
  }));
}
