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

  // Cale rapidă: agregare în DB (un singur rând). Vezi migrarea get_monthly_summary.
  const { data: agg, error } = await supabase.rpc("get_monthly_summary", {
    p_start: start,
    p_end: end,
  });
  if (!error && agg && agg.length > 0) {
    const row = agg[0]!;
    const income = Number(row.income) || 0;
    const expense = Number(row.expense) || 0;
    const carryOver = Number(row.carry_over) || 0;
    const net = income - expense;
    return { income, expense, net, carryOver, balance: carryOver + net };
  }

  // Fallback (migrarea încă neaplicată): aducem coloanele mici și calculăm în JS.
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
  weekAmount: number; // din acestea, cât e scadent în următoarele 7 zile
  weekCount: number; // câte plăți sunt scadente în următoarele 7 zile
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
      weekAmount: 0,
      weekCount: 0,
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

  const weekEnd = today + 7; // scadent în următoarele 7 zile din luna curentă

  let upcomingAmount = 0;
  let upcomingCount = 0;
  let weekAmount = 0;
  let weekCount = 0;

  const consider = (amt: number, dayOfMonth: number) => {
    const due = Math.min(dayOfMonth, lastDay);
    if (due <= today) return;
    upcomingAmount += amt;
    upcomingCount += 1;
    if (due <= weekEnd) {
      weekAmount += amt;
      weekCount += 1;
    }
  };

  for (const r of recurring.data ?? []) {
    consider(typeof r.amount === "string" ? Number(r.amount) : r.amount, r.day_of_month);
  }

  for (const p of installments.data ?? []) {
    if (p.paid_installments >= p.total_installments) continue;
    consider(
      typeof p.installment_amount === "string"
        ? Number(p.installment_amount)
        : p.installment_amount,
      p.day_of_month,
    );
  }

  return {
    isCurrentMonth: true,
    income: summary.income,
    balance: summary.balance,
    upcomingAmount: Math.round(upcomingAmount * 100) / 100,
    upcomingCount,
    weekAmount: Math.round(weekAmount * 100) / 100,
    weekCount,
  };
}
