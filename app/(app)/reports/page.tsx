import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import {
  getExpenseByCategory,
  getMonthlyTrend,
  getCategoryComparison,
  getBalanceTrend,
  getSavingsRateTrend,
  getFixedVsVariable,
  getDailySpending,
  getSpendProjection,
  getBudgetVsActual,
  getCumulativeComparison,
  getTopTransactions,
  getSpendingByWeekday,
} from "@/lib/data/charts";
import { listSavings } from "@/lib/data/savings";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarsChart } from "@/components/charts/BarsChart";
import { LineChart } from "@/components/charts/LineChart";
import { SimpleBars } from "@/components/charts/SimpleBars";
import { RateBars } from "@/components/charts/RateBars";
import { StackedBar } from "@/components/charts/StackedBar";
import { BudgetBars } from "@/components/charts/BudgetBars";
import { ProgressBars } from "@/components/charts/ProgressBars";
import {
  normalizeMonth,
  prevMonth,
  nextMonth,
  monthLabel,
  isCurrentOrFuture,
} from "@/lib/utils/month";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

const dayFmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short" });

/** Grafice: imagine de ansamblu + defalcări utile pentru o lună. */
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
  const [
    byCategory,
    trend,
    comparison,
    balance,
    rate,
    fixedVar,
    daily,
    projection,
    budgetActual,
    cumulative,
    topTx,
    byWeekday,
    savings,
  ] = await Promise.all([
    getExpenseByCategory(month),
    getMonthlyTrend(month, 6),
    getCategoryComparison(month),
    getBalanceTrend(month, 6),
    getSavingsRateTrend(month, 6),
    getFixedVsVariable(month),
    getDailySpending(month),
    getSpendProjection(month),
    getBudgetVsActual(month),
    getCumulativeComparison(month),
    getTopTransactions(month, 6),
    getSpendingByWeekday(month),
    listSavings(),
  ]);
  const atCurrent = isCurrentOrFuture(month);

  // Zilele de weekend ale lunii (pentru evidențiere în graficul zilnic).
  const [y, m] = month.split("-").map(Number);
  const dailyPoints = daily.map((d) => {
    const wd = new Date(y!, m! - 1, d.day).getDay();
    return { label: String(d.day), value: d.expense, highlight: wd === 0 || wd === 6 };
  });

  const totalDelta = comparison.totalCurrent - comparison.totalPrevious;

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

      {/* Proiecție final de lună (doar luna curentă) */}
      {projection.isCurrentMonth ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">Proiecție final de lună</h2>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-sm text-muted">
              Ai cheltuit{" "}
              <span className="font-semibold text-foreground">{ron.format(projection.spentSoFar)}</span>{" "}
              în {projection.daysElapsed} zile (media{" "}
              <span className="font-semibold text-foreground">{ron.format(projection.dailyAvg)}</span>/zi).
            </p>
            <p className="mt-2 text-sm">
              În ritmul ăsta, la final de lună vei ajunge la{" "}
              <span className="text-lg font-bold tabular-nums text-expense">
                {ron.format(projection.projected)}
              </span>
              .
            </p>
          </div>
        </section>
      ) : null}

      {/* Cheltuieli pe categorie */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Cheltuieli pe categorie</h2>
        <DonutChart segments={byCategory} />
      </section>

      {/* Cumulativ vs luna trecută */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Cumulativ vs {comparison.prevLabel}</h2>
        <p className="text-xs text-muted">Cheltuiala cumulată zi cu zi — ești peste sau sub ritmul de luna trecută.</p>
        <LineChart
          xLabels={cumulative.points.map((p) => String(p.day))}
          series={[
            {
              label: cumulative.curLabel.split(" ")[0] ?? "Luna asta",
              colorClass: "text-primary",
              values: cumulative.points.map((p) => p.current),
            },
            {
              label: cumulative.prevLabel.split(" ")[0] ?? "Luna trecută",
              colorClass: "text-muted",
              values: cumulative.points.map((p) => p.previous),
              dashed: true,
            },
          ]}
        />
      </section>

      {/* Evoluție venituri/cheltuieli 6 luni */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Venituri vs cheltuieli (6 luni)</h2>
        <BarsChart points={trend} />
      </section>

      {/* Sold cumulat în timp */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Sold cumulat (6 luni)</h2>
        <LineChart
          xLabels={balance.map((b) => b.label)}
          series={[{ label: "Sold", colorClass: "text-primary", values: balance.map((b) => b.balance) }]}
        />
      </section>

      {/* Rată de economisire */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Rată de economisire (6 luni)</h2>
        <p className="text-xs text-muted">Cât % din venit rămâne în fiecare lună.</p>
        <RateBars points={rate} />
      </section>

      {/* Fixe vs variabile */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Fixe vs variabile</h2>
        <StackedBar data={fixedVar} />
      </section>

      {/* Buget: planificat vs real */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Buget: planificat vs real</h2>
        <BudgetBars rows={budgetActual} />
      </section>

      {/* Cheltuieli pe zi */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Cheltuieli pe zi</h2>
        <p className="text-xs text-muted">Zilele de weekend sunt evidențiate.</p>
        <SimpleBars points={dailyPoints} labelEvery={7} />
      </section>

      {/* Pe zile ale săptămânii */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Pe zile ale săptămânii</h2>
        <SimpleBars points={byWeekday.map((w) => ({ label: w.label, value: w.total }))} />
      </section>

      {/* Top cheltuieli */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Top cheltuieli ale lunii</h2>
        {topTx.length === 0 ? (
          <p className="text-sm text-muted">Nicio cheltuială luna asta.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {topTx.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden>{t.category?.icon ?? "•"}</span>
                  <span className="min-w-0">
                    <span className="block truncate">{t.note ?? t.category?.name ?? "Cheltuială"}</span>
                    <span className="text-xs text-muted">
                      {t.category?.name ?? "Fără categorie"} · {dayFmt.format(new Date(`${t.date}T00:00:00`))}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-expense">
                  {ron.format(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Progres obiective de economisire */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Progres economii</h2>
        <ProgressBars goals={savings} />
      </section>

      {/* Comparație pe categorie cu luna anterioară */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Pe categorie: față de {comparison.prevLabel}</h2>
        <p className="text-sm text-muted">
          Total cheltuieli:{" "}
          <span className="font-semibold text-foreground">{ron.format(comparison.totalCurrent)}</span>{" "}
          vs {ron.format(comparison.totalPrevious)} ·{" "}
          <span className={totalDelta > 0 ? "text-expense" : "text-income"}>
            {totalDelta >= 0 ? "+" : ""}
            {ron.format(totalDelta)}
          </span>
        </p>
        {comparison.rows.length === 0 ? (
          <p className="text-sm text-muted">Nimic de comparat.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {comparison.rows.slice(0, 8).map((r) => (
              <li
                key={r.label}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="truncate">{r.label}</span>
                <span className="flex items-center gap-2 tabular-nums">
                  <span className="text-muted">{ron.format(r.current)}</span>
                  <span
                    className={`font-semibold ${
                      r.delta > 0 ? "text-expense" : r.delta < 0 ? "text-income" : "text-muted"
                    }`}
                  >
                    {r.delta >= 0 ? "+" : ""}
                    {ron.format(r.delta)}
                    {r.pct !== null ? ` (${r.pct >= 0 ? "+" : ""}${r.pct}%)` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
