import type { BudgetActual } from "@/lib/data/charts";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

/**
 * Buget planificat vs cheltuială reală pe categorie. Fiecare rând = o pistă (limita de
 * buget) cu o umplere (cheltuit); depășirea e roșie și afișează cât peste limită.
 */
export function BudgetBars({ rows }: { rows: BudgetActual[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Niciun buget setat. Adaugă din secțiunea Bugete.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      {rows.map((r) => {
        const pct = r.budget > 0 ? Math.min(100, Math.round((r.actual / r.budget) * 100)) : 0;
        return (
          <div key={r.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="truncate">{r.label}</span>
              <span className="tabular-nums">
                <span className={r.over ? "font-semibold text-expense" : "font-semibold text-foreground"}>
                  {ron.format(r.actual)}
                </span>
                <span className="text-muted"> / {ron.format(r.budget)}</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div
                className={`h-full rounded-full ${r.over ? "bg-expense" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {r.over ? (
              <span className="text-xs font-medium text-expense">
                Depășit cu {ron.format(r.actual - r.budget)}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
