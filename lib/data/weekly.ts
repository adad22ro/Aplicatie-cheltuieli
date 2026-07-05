import "server-only";

import { listTransactions, type TransactionListItem } from "@/lib/data/transactions";

export type WeekBucket = {
  index: number; // 0-based
  label: string; // „Săptămâna 1"
  range: string; // „1–7"
  income: number;
  expense: number;
  net: number;
  items: TransactionListItem[];
};

/** Câte zile are luna `YYYY-MM`. */
function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y!, m!, 0).getDate();
}

/**
 * Sparge tranzacțiile lunii în blocuri fixe de 7 zile (1–7, 8–14, 15–21, 22–28, 29–fin).
 * Blocul unei tranzacții = floor((ziua-1)/7). Fără migrări — pură grupare peste date.
 */
export async function getWeeklyBreakdown(month: string): Promise<WeekBucket[]> {
  const items = await listTransactions({ month }, 1000);
  const total = daysInMonth(month);
  const blocks = Math.ceil(total / 7);

  const buckets: WeekBucket[] = Array.from({ length: blocks }, (_, i) => {
    const from = i * 7 + 1;
    const to = Math.min(from + 6, total);
    return {
      index: i,
      label: `Săptămâna ${i + 1}`,
      range: `${from}–${to}`,
      income: 0,
      expense: 0,
      net: 0,
      items: [],
    };
  });

  for (const t of items) {
    const day = Number(t.date.slice(8, 10));
    const bi = Math.min(Math.floor((day - 1) / 7), blocks - 1);
    const b = buckets[bi];
    if (!b) continue;
    b.items.push(t);
    if (t.type === "income") b.income += t.amount;
    else b.expense += t.amount;
  }
  for (const b of buckets) b.net = b.income - b.expense;

  return buckets;
}
