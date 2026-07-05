import type { RatePoint } from "@/lib/data/charts";

/**
 * Rata de economisire lunară: bare divergente de la o linie de zero — pozitiv (economisit)
 * verde, negativ (cheltuit peste venit) roșu. O singură axă, etichetă directă cu %.
 */
export function RateBars({ points }: { points: RatePoint[] }) {
  const rates = points.map((p) => p.rate ?? 0);
  const maxAbs = Math.max(10, ...rates.map((r) => Math.abs(r)));

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-stretch justify-between gap-2" style={{ height: 140 }}>
        {points.map((p) => {
          const rate = p.rate;
          const h = rate === null ? 0 : (Math.abs(rate) / maxAbs) * 100; // % din jumătatea de sus/jos
          const positive = (rate ?? 0) >= 0;
          return (
            <div key={p.month} className="flex flex-1 flex-col items-center">
              {/* Jumătatea de sus (valori pozitive) */}
              <div className="flex w-full flex-1 items-end justify-center">
                {rate !== null && positive ? (
                  <div
                    className="w-2/3 rounded-t bg-income transition-all"
                    style={{ height: `${h}%` }}
                    title={`${p.label}: economisit ${rate}%`}
                  />
                ) : null}
              </div>
              {/* Linia de zero */}
              <div className="h-px w-full bg-border" />
              {/* Jumătatea de jos (valori negative) */}
              <div className="flex w-full flex-1 items-start justify-center">
                {rate !== null && !positive ? (
                  <div
                    className="w-2/3 rounded-b bg-expense transition-all"
                    style={{ height: `${h}%` }}
                    title={`${p.label}: deficit ${rate}%`}
                  />
                ) : null}
              </div>
              <span className="mt-1 text-[9px] text-muted">{p.label.split(" ")[0]?.slice(0, 3)}</span>
              <span
                className={`text-[10px] font-semibold tabular-nums ${
                  rate === null ? "text-muted" : positive ? "text-income" : "text-expense"
                }`}
              >
                {rate === null ? "—" : `${rate}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
