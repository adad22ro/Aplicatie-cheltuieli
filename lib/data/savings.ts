import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SavingsGoal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  pct: number; // 0..100
  remaining: number; // cât mai lipsește (>=0)
  reached: boolean;
};

const num = (v: number | string) => (typeof v === "string" ? Number(v) : v);

/** Obiectivele de economisire ale gospodăriei, cu progres derivat. */
export async function listSavings(): Promise<SavingsGoal[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("savings_goals")
    .select("id, name, target_amount, current_amount, deadline")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return (data ?? []).map((g) => {
    const target = num(g.target_amount);
    const current = num(g.current_amount);
    return {
      id: g.id,
      name: g.name,
      target_amount: target,
      current_amount: current,
      deadline: g.deadline,
      pct: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
      remaining: Math.max(0, Math.round((target - current) * 100) / 100),
      reached: current >= target,
    };
  });
}

/** Un obiectiv pentru editare. */
export async function getGoal(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("savings_goals")
    .select("id, name, target_amount, deadline")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;
  return { ...data, target_amount: num(data.target_amount) };
}
