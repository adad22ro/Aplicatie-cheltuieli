import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { monthStart, nextMonthStart, currentMonth } from "@/lib/utils/month";

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

export type MonthDigest = {
  isCurrentMonth: boolean; // digestul are sens doar pentru luna în curs
  income: number; // venituri intrate luna asta
  balance: number; // soldul la finalul lunii (carry-over + flux)
  upcomingAmount: number; // suma recurențelor + ratelor rămase de plătit până la finalul lunii
  upcomingCount: number; // câte astfel de plăți urmează
};

/**
 * „Digest" pentru dashboard: cât ți-a intrat, cât mai ai de plătit din recurențe + rate
 * până la finalul lunii curente și soldul rezultat. Are sens doar pentru luna în curs
 * (pentru luni trecute/viitoare întoarce `isCurrentMonth: false`).
 *
 * „Rămas de plătit" = recurențe active de tip cheltuială și rate active neterminate a căror
 * zi de scadență (`day_of_month`, plafonat la ultima zi) e după ziua de azi. RLS scopează.
 */
export async function getMonthDigest(
  month: string,
  summary: MonthlySummary,
): Promise<MonthDigest> {
  const isCurrentMonth = month === currentMonth();

  if (!isCurrentMonth) {
    return {
      isCurrentMonth: false,
      income: summary.income,
      balance: summary.balance,
      upcomingAmount: 0,
      upcomingCount: 0,
    };
  }

  const supabase = await createServerSupabaseClient();
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y!, m!, 0).getDate();
  const today = new Date().getDate();

  const [recurring, installments] = await Promise.all([
    supabase
      .from("recurring_transactions")
      .select("amount, day_of_month")
      .eq("is_active", true)
      .eq("type", "expense")
      .is("deleted_at", null),
    supabase
      .from("installment_plans")
      .select("installment_amount, day_of_month, total_installments, paid_installments")
      .eq("is_active", true)
      .is("deleted_at", null),
  ]);

  let upcomingAmount = 0;
  let upcomingCount = 0;

  for (const r of recurring.data ?? []) {
    const due = Math.min(r.day_of_month, lastDay);
    if (due > today) {
      upcomingAmount += typeof r.amount === "string" ? Number(r.amount) : r.amount;
      upcomingCount += 1;
    }
  }

  for (const p of installments.data ?? []) {
    if (p.paid_installments >= p.total_installments) continue;
    const due = Math.min(p.day_of_month, lastDay);
    if (due > today) {
      upcomingAmount +=
        typeof p.installment_amount === "string"
          ? Number(p.installment_amount)
          : p.installment_amount;
      upcomingCount += 1;
    }
  }

  return {
    isCurrentMonth: true,
    income: summary.income,
    balance: summary.balance,
    upcomingAmount: Math.round(upcomingAmount * 100) / 100,
    upcomingCount,
  };
}
