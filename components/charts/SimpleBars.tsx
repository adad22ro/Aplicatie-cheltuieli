const ronShort = (v: number) =>
  new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(v);

export type BarPoint = { label: string; value: number; highlight?: boolean };

/**
 * Bare verticale simple (o singură serie, CSS pur). `labelEvery` rărește etichetele X
 * pentru serii dese (ex: zilele lunii). `highlight` colorează diferit anumite bare.
 */
export function SimpleBars({
  points,
  unit = "RON",
  labelEvery = 1,
  height = 130,
}: {
  points: BarPoint[];
  unit?: string;
  labelEvery?: number;
  height?: number;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));

  if (points.every((p) => p.value === 0)) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Nicio cheltuială de afișat.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-end justify-between gap-[2px]" style={{ height }}>
        {points.map((p, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: "100%" }}>
            <div
              className={`w-full rounded-t transition-all ${
                p.highlight ? "bg-primary" : "bg-primary/45"
              }`}
              style={{ height: `${Math.max(p.value > 0 ? 2 : 0, (p.value / max) * 100)}%` }}
              title={`${p.label}: ${ronShort(p.value)} ${unit}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between gap-[2px]">
        {points.map((p, i) => (
          <div key={i} className="flex-1 text-center">
            {i % labelEvery === 0 ? (
              <span className="text-[9px] text-muted">{p.label}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
