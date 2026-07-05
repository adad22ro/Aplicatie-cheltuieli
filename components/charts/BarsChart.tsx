import type { MonthPoint } from "@/lib/data/charts";

const ronShort = (v: number) =>
  new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(v);

/** Bare venituri vs cheltuieli pe ultimele luni (CSS pur). */
export function BarsChart({ points }: { points: MonthPoint[] }) {
  const max = Math.max(1, ...points.flatMap((p) => [p.income, p.expense]));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-income" /> Venituri
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-expense" /> Cheltuieli
        </span>
      </div>

      <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
        {points.map((p) => (
          <div key={p.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div
                className="w-1/2 rounded-t bg-income transition-all"
                style={{ height: `${(p.income / max) * 100}%` }}
                title={`Venituri: ${ronShort(p.income)} RON`}
              />
              <div
                className="w-1/2 rounded-t bg-expense transition-all"
                style={{ height: `${(p.expense / max) * 100}%` }}
                title={`Cheltuieli: ${ronShort(p.expense)} RON`}
              />
            </div>
            <span className="truncate text-[10px] text-muted">
              {p.label.split(" ")[0]?.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
