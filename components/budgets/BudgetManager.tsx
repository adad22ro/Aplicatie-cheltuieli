"use client";

import { useActionState } from "react";

import {
  setBudgetAction,
  deleteBudgetAction,
  type BudgetActionState,
} from "@/lib/actions/budgets";
import type { BudgetItem } from "@/lib/data/budgets";
import type { Category } from "@/lib/data/settings";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

function BudgetRow({ item }: { item: BudgetItem }) {
  const [state, formAction, pending] = useActionState<BudgetActionState, FormData>(
    setBudgetAction,
    undefined,
  );

  const near = !item.over && item.pct >= 80;
  // Culoare bară: depășit → roșu, aproape (>80%) → ambră, altfel culoarea categoriei.
  const fillColor = item.over
    ? "var(--color-expense)"
    : near
      ? "var(--color-warning)"
      : (item.category?.color ?? "var(--color-primary)");

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      {/* Nume pe rând propriu (lățime completă) */}
      <span className="flex min-w-0 items-center gap-2 font-medium">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm"
          style={{ backgroundColor: item.category?.color ?? "var(--color-background)" }}
          aria-hidden
        >
          {item.category?.icon ?? "•"}
        </span>
        <span className="min-w-0 flex-1">{item.category?.name ?? "—"}</span>
      </span>

      {/* Consum / limită, pe rândul lor */}
      <p className="flex items-baseline justify-between text-sm">
        <span className="text-muted">Cheltuit</span>
        <span className={`tabular-nums ${item.over ? "text-expense font-semibold" : "text-foreground"}`}>
          {ron.format(item.spent)} / {ron.format(item.amount)}
        </span>
      </p>

      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${item.pct}%`, backgroundColor: fillColor }}
        />
      </div>

      <p className={`text-xs ${item.over ? "text-expense" : "text-muted"}`}>
        {item.over
          ? `Depășit cu ${ron.format(-item.remaining)}`
          : `Rămas: ${ron.format(item.remaining)}`}
      </p>

      <div className="flex items-center gap-2">
        <form action={formAction} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="category_id" value={item.category_id} />
          <input
            name="amount"
            type="text"
            inputMode="decimal"
            defaultValue={String(item.amount)}
            aria-label="Limită"
            className="w-24 rounded-lg border border-border bg-surface px-2 py-1 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-background disabled:opacity-60"
          >
            {pending ? "…" : "Salvează"}
          </button>
        </form>
        <form action={deleteBudgetAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-expense hover:bg-background"
          >
            Șterge
          </button>
        </form>
      </div>
      {state?.error ? (
        <p role="alert" className="text-xs text-expense">
          {state.error}
        </p>
      ) : null}
    </li>
  );
}

function AddBudget({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState<BudgetActionState, FormData>(
    setBudgetAction,
    undefined,
  );

  if (categories.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted">
        Toate categoriile de cheltuială au deja buget.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-muted">Buget nou</h2>
      <select
        name="category_id"
        required
        defaultValue=""
        className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <option value="" disabled>
          Alege categoria…
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon ? `${c.icon} ` : ""}
            {c.name}
          </option>
        ))}
      </select>
      <input
        name="amount"
        type="text"
        inputMode="decimal"
        required
        placeholder="Limită lunară (RON)"
        className="rounded-lg border border-border bg-surface px-3 py-2 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      {state?.error ? (
        <p role="alert" className="text-sm text-expense">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Se salvează…" : "Adaugă buget"}
      </button>
    </form>
  );
}

export function BudgetManager({
  budgets,
  expenseCategories,
}: {
  budgets: BudgetItem[];
  expenseCategories: Category[];
}) {
  const budgetedIds = new Set(budgets.map((b) => b.category_id));
  const available = expenseCategories.filter((c) => !budgetedIds.has(c.id));

  return (
    <div className="flex flex-col gap-5">
      <AddBudget categories={available} />
      {budgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="text-3xl" aria-hidden>🎯</p>
          <p className="mt-2 font-semibold">Niciun buget încă</p>
          <p className="mt-1 text-sm text-muted">
            Pune o limită lunară pe o categorie (de ex. Mâncare) și vezi cât ți-a mai rămas.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {budgets.map((b) => (
            <BudgetRow key={b.id} item={b} />
          ))}
        </ul>
      )}
    </div>
  );
}
