"use client";

import Link from "next/link";
import { useState } from "react";

import { deleteInstallmentAction } from "@/lib/actions/installments";
import type { InstallmentItem } from "@/lib/data/installments";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 2,
});

function Card({ item, done }: { item: InstallmentItem; done: boolean }) {
  const pct = Math.round((item.paid_installments / item.total_installments) * 100);
  const [expanded, setExpanded] = useState(false);
  return (
    <li className={`flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm ${done ? "opacity-70" : ""}`}>
      {/* Header clicabil: numele pe rând propriu, pe toată lățimea */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-2 text-left"
      >
        <span className={`mt-0.5 shrink-0 text-xs text-muted transition-transform ${expanded ? "rotate-90" : ""}`}>
          ›
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{item.name}</span>
          <span className="block truncate text-xs text-muted">
            {item.category?.icon ? `${item.category.icon} ` : ""}
            {item.category?.name ?? "—"} · ziua {item.day_of_month}
            {item.is_variable ? " · rată variabilă" : item.manual_confirm ? " · confirm manual" : ""}
          </span>
        </span>
      </button>

      {/* Suma ratei, pe rândul ei */}
      <p className="flex items-baseline justify-between text-sm">
        <span className="text-muted">{item.is_variable ? "Rată (variabilă)" : "Rată / lună"}</span>
        <span className="font-semibold tabular-nums text-expense">
          {ron.format(item.installment_amount)}
        </span>
      </p>

      {expanded ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-border pt-2 text-xs">
          <dt className="text-muted">Denumire</dt>
          <dd className="font-medium">{item.name}</dd>
          <dt className="text-muted">Categorie</dt>
          <dd>
            {item.category?.icon ? `${item.category.icon} ` : ""}
            {item.category?.name ?? "—"}
          </dd>
          <dt className="text-muted">{item.is_variable ? "Total estimat" : "Total"}</dt>
          <dd className="tabular-nums">{ron.format(item.total_amount)}</dd>
          <dt className="text-muted">{item.is_variable ? "Rată medie est." : "Rată / lună"}</dt>
          <dd className="font-semibold tabular-nums">
            {ron.format(item.installment_amount)}
            {item.is_variable ? <span className="ml-1 font-normal text-muted">(variabilă)</span> : null}
          </dd>
          <dt className="text-muted">Rate</dt>
          <dd>
            {item.paid_installments}/{item.total_installments} plătite · {item.remaining_installments} rămase
          </dd>
          <dt className="text-muted">Rest de plată</dt>
          <dd className="tabular-nums">{ron.format(item.remaining_amount)}</dd>
          <dt className="text-muted">Ziua lunii</dt>
          <dd>{item.day_of_month}</dd>
          <dt className="text-muted">Început</dt>
          <dd>{item.start_date}</dd>
          <dt className="text-muted">Mod</dt>
          <dd>
            {item.is_variable
              ? "Rată variabilă (o completezi tu)"
              : item.manual_confirm
                ? "Confirm manual (o marchezi tu)"
                : "Automat"}
          </dd>
          <dt className="text-muted">Stare</dt>
          <dd>{done ? "Finalizat" : "Activ"}</dd>
        </dl>
      ) : null}

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
