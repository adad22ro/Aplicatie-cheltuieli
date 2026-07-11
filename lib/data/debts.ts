import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type DebtPayment = {
  id: string;
  amount: number;
  paid_date: string;
  note: string | null;
};

export type DebtItem = {
  id: string;
  person: string;
  direction: "borrowed" | "lent";
  amount: number;
  note: string | null;
  borrowed_date: string;
  settled_at: string | null;
  payments: DebtPayment[];
  // Derivate:
  paid_total: number;
  remaining: number;
  is_settled: boolean;
};

function num(v: number | string): number {
  return typeof v === "string" ? Number(v) : v;
}

/** Datoriile gospodăriei (RLS scoped), cu plățile și câmpuri derivate (rest, total plătit). */
export async function listDebts(): Promise<DebtItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("debts")
    .select(
      "id, person, direction, amount, note, borrowed_date, settled_at, payments:debt_payments(id, amount, paid_date, note, deleted_at)",
    )
    .is("deleted_at", null)
    .order("settled_at", { ascending: true, nullsFirst: true })
    .order("borrowed_date", { ascending: false });

  return (data ?? []).map((d) => {
    const amount = num(d.amount);
    const payments = ((d.payments ?? []) as Array<DebtPayment & { deleted_at: string | null }>)
      .filter((p) => p.deleted_at === null)
      .map((p) => ({
        id: p.id,
        amount: num(p.amount),
        paid_date: p.paid_date,
        note: p.note,
      }))
      .sort((a, b) => (a.paid_date < b.paid_date ? 1 : -1));
    const paidTotal = Math.round(payments.reduce((s, p) => s + p.amount, 0) * 100) / 100;
    const remaining = Math.max(0, Math.round((amount - paidTotal) * 100) / 100);
    return {
      id: d.id,
      person: d.person,
      direction: d.direction,
      amount,
      note: d.note,
      borrowed_date: d.borrowed_date,
      settled_at: d.settled_at,
      payments,
      paid_total: paidTotal,
      remaining,
      is_settled: d.settled_at !== null || remaining <= 0,
    };
  });
}

/** O datorie pentru editare. */
export async function getDebt(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("debts")
    .select("id, person, direction, amount, note, borrowed_date")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;
  return { ...data, amount: num(data.amount) };
}
