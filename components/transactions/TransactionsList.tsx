"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

import {
  deleteTransactionAction,
  restoreTransactionAction,
  duplicateTransactionAction,
} from "@/lib/actions/transactions";
import type { TransactionListItem } from "@/lib/data/transactions";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 2,
});

const dayFmt = new Intl.DateTimeFormat("ro-RO", {
  weekday: "long",
  day: "numeric",
  month: "short",
});

function dayLabel(dateStr: string) {
  const today = new Date();
  const d = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86_400_000,
  );
  if (diffDays === 0) return "Azi";
  if (diffDays === 1) return "Ieri";
  return dayFmt.format(d);
}

export function TransactionsList({
  items,
  currentUserId,
  authors,
}: {
  items: TransactionListItem[];
  currentUserId: string;
  authors: Record<string, string>;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ id: string } | null>(null);
  const [, startTransition] = useTransition();

  const visible = useMemo(
    () => items.filter((t) => !hidden.has(t.id)),
    [items, hidden],
  );

  // Grupare pe zile (items deja sortate desc pe dată).
  const groups = useMemo(() => {
    const map = new Map<string, TransactionListItem[]>();
    for (const t of visible) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return [...map.entries()];
  }, [visible]);

  const remove = (id: string) => {
    setHidden((prev) => new Set(prev).add(id));
    setToast({ id });
    startTransition(() => {
      void deleteTransactionAction(id);
    });
    window.setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
    }, 6000);
  };

  const undo = () => {
    if (!toast) return;
    const id = toast.id;
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setToast(null);
    startTransition(() => {
      void restoreTransactionAction(id);
    });
  };

  const authorLabel = (userId: string) =>
    authors[userId] ?? (userId === currentUserId ? "Eu" : "Membru");

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-3xl" aria-hidden>👛</p>
        <p className="mt-2 font-semibold">Încă nimic pe aici</p>
        <p className="mt-1 text-sm text-muted">
          Notează prima ta cheltuială sau venit — durează câteva secunde.
        </p>
        <Link
          href="/transactions/new"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Adaugă prima
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-20">
      {groups.map(([date, rows]) => (
        <section key={date} className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {dayLabel(date)}
          </h2>
          <ul className="flex flex-col gap-2">
            {rows.map((t) => {
              const who = authorLabel(t.user_id);
              const sign = t.type === "income" ? "+" : "−";
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                    style={{
                      backgroundColor: t.category?.color ?? "var(--color-background)",
                    }}
                    aria-hidden
                  >
                    {t.category?.icon ?? "•"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {t.category?.name ?? "Fără categorie"}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {[t.payment_method?.name, t.note].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-background text-[10px] font-semibold text-muted"
                    title={who}
                  >
                    {(who[0] ?? "?").toUpperCase()}
                  </span>
                  <span
                    className={`shrink-0 tabular-nums font-semibold ${
                      t.type === "income" ? "text-income" : "text-expense"
                    }`}
                  >
                    {sign}
                    {ron.format(t.amount)}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={`/transactions/${t.id}/edit`}
                      aria-label="Editează"
                      className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-background"
                    >
                      ✎
                    </Link>
                    <form action={duplicateTransactionAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        aria-label="Duplică"
                        className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-background"
                      >
                        ⧉
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => remove(t.id)}
                      aria-label="Șterge"
                      className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-expense hover:bg-background"
                    >
                      🗑
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {toast ? (
        <div
          role="status"
          className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[min(28rem,calc(100%-2rem))] items-center justify-between gap-3 rounded-xl border border-border bg-foreground px-4 py-3 text-background shadow-lg"
        >
          <span className="text-sm">Tranzacție ștearsă</span>
          <button
            type="button"
            onClick={undo}
            className="rounded-lg px-3 py-1 text-sm font-semibold underline"
          >
            Anulează
          </button>
        </div>
      ) : null}
    </div>
  );
}
