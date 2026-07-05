import type { FixedVariable } from "@/lib/data/charts";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

/**
 * O singură bară orizontală împărțită în „fix" vs „variabil", cu legendă și procente.
 * Două culori categoriale distincte (nu status), separate printr-un mic spațiu de suprafață.
 */
export function StackedBar({ data }: { data: FixedVariable }) {
  const { fixed, variable, total } = data;

  if (total <= 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Nicio cheltuială luna asta.
      </p>
    );
  }

  const fixedPct = Math.round((fixed / total) * 100);
  const varPct = 100 - fixedPct;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex h-6 w-full gap-[2px] overflow-hidden rounded-lg">
        <div
          className="flex items-center justify-center bg-primary text-[10px] font-semibold text-white"
          style={{ width: `${fixedPct}%` }}
          title={`Fixe: ${ron.format(fixed)}`}
        >
          {fixedPct >= 12 ? `${fixedPct}%` : ""}
        </div>
        <div
          className="flex items-center justify-center bg-amber-500 text-[10px] font-semibold text-white"
          style={{ width: `${varPct}%` }}
          title={`Variabile: ${ron.format(variable)}`}
        >
          {varPct >= 12 ? `${varPct}%` : ""}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-primary" aria-hidden />
          Fixe (recurențe + rate)
        </span>
        <span className="font-semibold tabular-nums">{ron.format(fixed)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-amber-500" aria-hidden />
          Variabile (restul)
        </span>
        <span className="font-semibold tabular-nums">{ron.format(variable)}</span>
      </div>
    </div>
  );
}
