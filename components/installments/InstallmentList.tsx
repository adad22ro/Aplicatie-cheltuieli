"use client";

import Link from "next/link";

import { deleteInstallmentAction } from "@/lib/actions/installments";
import type { InstallmentItem } from "@/lib/data/installments";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 2,
});

function Card({ item, done }: { item: InstallmentItem; done: boolean }) {
  const pct = Math.round((item.paid_installments / item.total_installments) * 100);
  return (
    <li className={`flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm ${done ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{item.name}</p>
          <p className="text-xs text-muted">
            {item.category?.icon ? `${item.category.icon} ` : ""}
            {item.category?.name ?? "—"} · ziua {item.day_of_month}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block font-semibold tabular-nums text-expense">
            {ron.format(item.installment_amount)}
          </span>
          <span className="text-xs text-muted">/ lună</span>
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="h-2 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted">
          <span>
            {item.paid_installments}/{item.total_installments} rate
          </span>
          <span>
            {done ? "Achitat integral" : `Rest: ${ron.format(item.remaining_amount)}`}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        <Link
          href={`/installments/${item.id}/edit`}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-background"
        >
          Editează
        </Link>
        <form action={deleteInstallmentAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-expense hover:bg-background"
          >
            Șterge
          </button>
        </form>
      </div>
    </li>
  );
}

export function InstallmentList({ items }: { items: InstallmentItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted">Niciun angajament încă.</p>
        <Link
          href="/installments/new"
          className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Adaugă primul
        </Link>
      </div>
    );
  }

  const isDone = (i: InstallmentItem) =>
    !i.is_active || i.paid_installments >= i.total_installments;
  const active = items.filter((i) => !isDone(i));
  const done = items.filter(isDone);

  return (
    <div className="flex flex-col gap-5 pb-20">
      {active.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {active.map((i) => (
            <Card key={i.id} item={i} done={false} />
          ))}
        </ul>
      ) : null}
      {done.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Finalizate
          </h2>
          <ul className="flex flex-col gap-3">
            {done.map((i) => (
              <Card key={i.id} item={i} done />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
