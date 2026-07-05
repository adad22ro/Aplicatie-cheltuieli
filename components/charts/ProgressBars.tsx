import type { SavingsGoal } from "@/lib/data/savings";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

/** Progresul agregat al obiectivelor de economisire: bară curent/țintă per obiectiv. */
export function ProgressBars({ goals }: { goals: SavingsGoal[] }) {
  if (goals.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Niciun obiectiv de economisire.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      {goals.map((g) => (
        <div key={g.id} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="truncate">
              {g.reached ? "✅ " : "🐷 "}
              {g.name}
            </span>
            <span className="tabular-nums">
              <span className="font-semibold text-foreground">{ron.format(g.current_amount)}</span>
              <span className="text-muted"> / {ron.format(g.target_amount)}</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-background">
            <div
              className={`h-full rounded-full ${g.reached ? "bg-income" : "bg-primary"}`}
              style={{ width: `${g.pct}%` }}
            />
          </div>
          <span className="text-xs text-muted">
            {g.pct}%{g.reached ? " · atins" : ` · mai lipsesc ${ron.format(g.remaining)}`}
          </span>
        </div>
      ))}
    </div>
  );
}
