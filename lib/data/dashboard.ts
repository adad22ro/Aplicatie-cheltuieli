import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { monthStart, nextMonthStart } from "@/lib/utils/month";

export type MonthlySummary = {
  income: number; // venituri în luna selectată
  expense: number; // cheltuieli în luna selectată
  net: number; // income - expense (fluxul lunii)
  carryOver: number; // sold reportat: net cumulat DIN toate lunile anterioare
  balance: number; // sold real la finalul lunii: carryOver + net
};

/**
 * Sumar financiar pentru o lună, cu carry-over (sold reportat). Volumele fiind mici
 * (o gospodărie), aducem doar `amount, type, date` ale tranzacțiilor active și calculăm
 * în JS — evită o funcție SQL/migrare. RLS scopează la gospodăria userului.
 */
export async function getMonthlySummary(month: string): Promise<MonthlySummary> {
  const supabase = await createServerSupabaseClient();
  const start = monthStart(month);
  const end = nextMonthStart(month);

  const { data } = await supabase
    .from("transactions")
    .select("amount, type, date")
    .is("deleted_at", null)
    .lt("date", end); // tot ce e până la finalul lunii selectate (inclusiv anterior)

  let income = 0;
  let expense = 0;
  let carryOver = 0;

  for (const t of data ?? []) {
    const amt = typeof t.amount === "string" ? Number(t.amount) : t.amount;
    const signed = t.type === "income" ? amt : -amt;
    if (t.date < start) {
      carryOver += signed; // luni anterioare → report
    } else if (t.type === "income") {
      income += amt;
    } else {
      expense += amt;
    }
  }

  const net = income - expense;
  return { income, expense, net, carryOver, balance: carryOver + net };
}
