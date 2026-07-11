"use client";

import Link from "next/link";
import { useState } from "react";

import {
  toggleRecurringAction,
  deleteRecurringAction,
} from "@/lib/actions/recurring";
import type { RecurringItem } from "@/lib/data/recurring";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 2,
});

function Row({ item }: { item: RecurringItem }) {
  const sign = item.type === "income" ? "+" : "−";
  const [expanded, setExpanded] = useState(false);
  return (
    <li
      className={`flex flex-col rounded-xl border border-border bg-surface p-3 ${
        item.is_active ? "" : "opacity-60"
      }`}
    >
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
        style={{ backgroundColor: item.category?.color ?? "var(--color-background)" }}
        aria-hidden
      >
        {item.category?.icon ?? "•"}
      </span>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="min-w-0 flex-1 text-left"
      >
        <p className="flex items-center gap-1 truncate font-medium">
          <span className={`text-xs text-muted transition-transform ${expanded ? "rotate-90" : ""}`}>
            ›
          </span>
          <span className="truncate">{item.category?.name ?? "Fără categorie"}</span>
        </p>
        <p className="truncate pl-4 text-xs text-muted">
          Ziua {item.day_of_month}
          {item.payment_method?.name ? ` · ${item.payment_method.name}` : ""}
          {item.note ? ` · ${item.note}` : ""}
        </p>
      </button>
      <span
        className={`shrink-0 tabular-nums font-semibold ${
          item.type === "income" ? "text-income" : "text-expense"
        }`}
      >
        {sign}
        {ron.format(item.amount)}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/recurring/${item.id}/edit`}
          aria-label="Editează"
          className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-background"
        >
          ✎
        </Link>
        <form action={toggleRecurringAction}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="active" value={String(item.is_active)} />
          <button
            type="submit"
            className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-background"
          >
            {item.is_active ? "Oprește" : "Pornește"}
          </button>
        </form>
        <form action={deleteRecurringAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            aria-label="Șterge"
            className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-expense hover:bg-background"
          >
            🗑
          </button>
        </form>
      </div>
    </div>

      {expanded ? (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-border pt-2 text-xs">
          <dt className="text-muted">Categorie</dt>
          <dd className="font-medium">
            {item.category?.icon ? `${item.category.icon} ` : ""}
            {item.category?.name ?? "Fără categorie"}
          </dd>
          <dt className="text-muted">Tip</dt>
          <dd>{item.type === "income" ? "Venit" : "Cheltuială"}</dd>
          <dt className="text-muted">Sumă</dt>
          <dd className="font-semibold tabular-nums">{ron.format(item.amount)}</dd>
          <dt className="text-muted">Ziua lunii</dt>
          <dd>{item.day_of_month}</dd>
          {item.payment_method?.name ? (
            <>
              <dt className="text-muted">Metodă</dt>
              <dd>{item.payment_method.name}</dd>
            </>
          ) : null}
          {item.note ? (
            <>
              <dt className="text-muted">Notă</dt>
              <dd>{item.note}</dd>
            </>
          ) : null}
          <dt className="text-muted">Stare</dt>
          <dd>{item.is_active ? "Activă" : "Oprită"}</dd>
        </dl>
      ) : null}
    </li>
  );
}

export function RecurringList({ items }: { items: RecurringItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted">Nicio recurență încă.</p>
        <Link
          href="/recurring/new"
          className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Adaugă prima
        </Link>
      </div>
    );
  }

  const active = items.filter((i) => i.is_active);
  const inactive = items.filter((i) => !i.is_active);

  return (
    <div className="flex flex-col gap-5 pb-20">
      {active.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {active.map((i) => (
            <Row key={i.id} item={i} />
          ))}
        </ul>
      ) : null}
      {inactive.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Oprite
          </h2>
          <ul className="flex flex-col gap-2">
            {inactive.map((i) => (
              <Row key={i.id} item={i} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
