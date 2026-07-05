import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { getExpenseByCategory, getMonthlyTrend } from "@/lib/data/charts";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarsChart } from "@/components/charts/BarsChart";
import {
  normalizeMonth,
  prevMonth,
  nextMonth,
  monthLabel,
  isCurrentOrFuture,
} from "@/lib/utils/month";

/** Grafice: cheltuieli pe categorie + evoluție lunară (UI.md §4.5). */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const [{ month: monthParam }, householdId] = await Promise.all([
    searchParams,
    getActiveHouseholdId(),
  ]);
  if (!householdId) redirect("/onboarding");

  const month = normalizeMonth(monthParam);
  const [byCategory, trend] = await Promise.all([
    getExpenseByCategory(month),
    getMonthlyTrend(month, 6),
  ]);
  const atCurrent = isCurrentOrFuture(month);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold">Grafice</h1>
      </header>

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-2">
        <Link
          href={`/reports?month=${prevMonth(month)}`}
          aria-label="Luna anterioară"
          className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ←
        </Link>
        <span className="font-semibold capitalize">{monthLabel(month)}</span>
        {atCurrent ? (
          <span aria-hidden className="px-3 py-1.5 text-sm text-muted opacity-40">→</span>
        ) : (
          <Link
            href={`/reports?month=${nextMonth(month)}`}
            aria-label="Luna următoare"
            className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-background"
          >
            →
          </Link>
        )}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Cheltuieli pe categorie</h2>
        <DonutChart segments={byCategory} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Evoluție (ultimele 6 luni)</h2>
        <BarsChart points={trend} />
      </section>
    </main>
  );
}
