const ronShort = (v: number) =>
  new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(v);

export type LineSeries = {
  label: string;
  colorClass: string; // clasă Tailwind pentru stroke (ex: "text-primary")
  values: (number | null)[];
  dashed?: boolean;
};

/**
 * Grafic cu linii (1..n serii) desenat în SVG, fără dependențe. O singură axă Y comună
 * (dataviz: niciodată două scale). Include linia de zero dacă apar valori negative.
 * Prima serie (dacă e singură) primește și o arie subțire sub linie.
 */
export function LineChart({
  series,
  xLabels,
  valueFormat = ronShort,
}: {
  series: LineSeries[];
  xLabels: string[];
  valueFormat?: (v: number) => string;
}) {
  const W = 320;
  const H = 170;
  const padL = 8;
  const padR = 8;
  const padT = 12;
  const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const n = Math.max(1, xLabels.length);

  if (all.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Nu sunt date de afișat.
      </p>
    );
  }

  const dataMax = Math.max(...all);
  const dataMin = Math.min(...all);
  const yMax = Math.max(0, dataMax);
  const yMin = Math.min(0, dataMin);
  const span = yMax - yMin || 1;

  const x = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => padT + (1 - (v - yMin) / span) * plotH;
  const zeroY = y(0);

  // Câteva etichete X (max ~6) ca să nu se aglomereze.
  const step = Math.max(1, Math.ceil(n / 6));
  const ticks = xLabels
    .map((label, i) => ({ label, i }))
    .filter(({ i }) => i % step === 0 || i === n - 1);

  const pathFor = (values: (number | null)[]) => {
    let d = "";
    let pen = false;
    values.forEach((v, i) => {
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  };

  const single = series.length === 1;
  const first = series[0]!;
  const areaPath =
    single && first.values.some((v) => v !== null)
      ? (() => {
          const firstIdx = first.values.findIndex((v) => v !== null);
          const lastIdx =
            first.values.length - 1 - [...first.values].reverse().findIndex((v) => v !== null);
          return `${pathFor(first.values)} L${x(lastIdx).toFixed(1)} ${zeroY.toFixed(
            1,
          )} L${x(firstIdx).toFixed(1)} ${zeroY.toFixed(1)} Z`;
        })()
      : null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      {series.length > 1 ? (
        <div className="flex items-center gap-4 text-xs text-muted">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={`h-0.5 w-4 rounded ${s.colorClass}`} style={{ backgroundColor: "currentColor" }} />
              {s.label}
            </span>
          ))}
        </div>
      ) : null}

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Grafic cu linii">
        {/* Linia de zero (dacă există valori negative) */}
        {yMin < 0 ? (
          <line x1={padL} x2={W - padR} y1={zeroY} y2={zeroY} className="stroke-border" strokeWidth={1} />
        ) : null}

        {areaPath ? (
          <path d={areaPath} className={first.colorClass} fill="currentColor" opacity={0.1} />
        ) : null}

        {series.map((s) => (
          <path
            key={s.label}
            d={pathFor(s.values)}
            className={s.colorClass}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={s.dashed ? "4 3" : undefined}
          />
        ))}

        {/* Marker pe ultimul punct al fiecărei serii */}
        {series.map((s) => {
          const lastIdx = s.values.length - 1 - [...s.values].reverse().findIndex((v) => v !== null);
          const v = s.values[lastIdx];
          if (v === null || v === undefined) return null;
          return (
            <circle key={`m-${s.label}`} cx={x(lastIdx)} cy={y(v)} r={3} className={s.colorClass} fill="currentColor" />
          );
        })}

        {ticks.map(({ label, i }) => (
          <text
            key={`x-${i}`}
            x={x(i)}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            className="fill-muted text-[9px]"
          >
            {label.split(" ")[0]?.slice(0, 3)}
          </text>
        ))}
      </svg>

      {/* Rezumat: ultima valoare a fiecărei serii */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {series.map((s) => {
          const lastIdx = s.values.length - 1 - [...s.values].reverse().findIndex((v) => v !== null);
          const v = s.values[lastIdx];
          return (
            <span key={`v-${s.label}`} className="text-muted">
              {s.label}:{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {v === null || v === undefined ? "—" : `${valueFormat(v)} RON`}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
