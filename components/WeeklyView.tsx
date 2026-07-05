import { TransactionsList } from "@/components/transactions/TransactionsList";
import type { WeekBucket } from "@/lib/data/weekly";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 2,
});

/** Luna spartă pe blocuri de 7 zile: venituri/cheltuieli/sold + tranzacții desfășurabile. */
export function WeeklyView({
  weeks,
  currentUserId,
  authors,
}: {
  weeks: WeekBucket[];
  currentUserId: string;
  authors: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {weeks.map((w) => (
        <details
          key={w.index}
          className="group rounded-2xl border border-border bg-surface shadow-sm"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4">
            <div>
              <p className="font-semibold">{w.label}</p>
              <p className="text-xs text-muted">
                zilele {w.range} · {w.items.length} tranzacții
              </p>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-xs text-muted">Sold</p>
                <p
                  className={`font-bold tabular-nums ${
                    w.net < 0 ? "text-expense" : "text-income"
                  }`}
                >
                  {w.net >= 0 ? "+" : ""}
                  {ron.format(w.net)}
                </p>
              </div>
              <span aria-hidden className="text-muted transition-transform group-open:rotate-180">
                ▾
              </span>
            </div>
          </summary>

          <div className="border-t border-border px-4 pb-4 pt-3">
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-muted">
                Venituri <span className="font-semibold text-income">{ron.format(w.income)}</span>
              </span>
              <span className="text-muted">
                Cheltuieli{" "}
                <span className="font-semibold text-expense">{ron.format(w.expense)}</span>
              </span>
            </div>

            {/* Unde s-au dus banii — top categorii ale săptămânii */}
            {w.topCategories.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {w.topCategories.map((c) => (
                  <span
                    key={c.name}
                    className="rounded-full bg-background px-2.5 py-1 text-xs text-muted"
                  >
                    {c.icon ? `${c.icon} ` : ""}
                    {c.name}{" "}
                    <span className="font-semibold text-foreground">{ron.format(c.amount)}</span>
                  </span>
                ))}
              </div>
            ) : null}
            {w.items.length > 0 ? (
              <TransactionsList
                items={w.items}
                currentUserId={currentUserId}
                authors={authors}
              />
            ) : (
              <p className="text-sm text-muted">Nicio tranzacție în această săptămână.</p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
