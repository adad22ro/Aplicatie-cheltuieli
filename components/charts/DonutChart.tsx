import type { CategorySlice } from "@/lib/data/charts";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

/** Donut cheltuieli pe categorie, desenat cu stroke-dasharray (fără dependențe). */
export function DonutChart({ segments }: { segments: CategorySlice[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);

  if (total <= 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Nicio cheltuială luna asta.
      </p>
    );
  }

  const r = 60;
  const cx = 80;
  const cy = 80;
  const circ = 2 * Math.PI * r;

  // Precalculăm dash + offset cumulativ (prefix-sum, fără mutații de variabile).
  const dashes = segments.map((seg) => (seg.value / total) * circ);
  const arcs = segments.map((seg, i) => ({
    ...seg,
    dash: dashes[i]!,
    offset: dashes.slice(0, i).reduce((a, b) => a + b, 0),
  }));

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-start">
      <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Cheltuieli pe categorie">
        {arcs.map((seg) => (
          <circle
            key={seg.label}
            r={r}
            cx={cx}
            cy={cy}
            fill="none"
            stroke={seg.color}
            strokeWidth={22}
            strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
            strokeDashoffset={-seg.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-muted text-[11px]">
          Total
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-foreground text-sm font-bold">
          {ron.format(total)}
        </text>
      </svg>

      <ul className="flex w-full flex-1 flex-col gap-1.5">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{seg.label}</span>
            <span className="tabular-nums text-muted">
              {Math.round((seg.value / total) * 100)}%
            </span>
            <span className="w-20 text-right tabular-nums font-medium">
              {ron.format(seg.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
