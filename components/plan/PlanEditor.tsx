"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import {
  addIncomeAction,
  addAllocationAction,
  setAllocationAmountAction,
  setIncomeAmountAction,
  deleteAllocationAction,
  deleteIncomeAction,
  togglePaidAction,
  type PlanActionState,
} from "@/lib/actions/plan";
import type { PlanIncome, PlanAllocation } from "@/lib/data/plan";
import type { Category } from "@/lib/data/settings";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 2,
});

function parseAmount(v: string): number {
  const n = Number(v.replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function PlanEditor({
  month,
  incomes,
  allocations,
  categories,
}: {
  month: string;
  incomes: PlanIncome[];
  allocations: PlanAllocation[];
  categories: Category[];
}) {
  const incomeCats = useMemo(() => categories.filter((c) => c.type === "income"), [categories]);
  const expenseCats = useMemo(() => categories.filter((c) => c.type === "expense"), [categories]);

  // Sume locale pentru totaluri live (cheia = id-ul rândului).
  const [allocAmounts, setAllocAmounts] = useState<Record<string, number>>(
    () => Object.fromEntries(allocations.map((a) => [a.id, a.planned_amount])),
  );
  const [incomeAmounts, setIncomeAmounts] = useState<Record<string, number>>(
    () => Object.fromEntries(incomes.map((i) => [i.id, i.amount])),
  );

  const totalIncome = incomes.reduce((s, i) => s + (incomeAmounts[i.id] ?? i.amount), 0);
  const totalAllocated = allocations.reduce(
    (s, a) => s + (allocAmounts[a.id] ?? a.planned_amount),
    0,
  );
  const unallocated = totalIncome - totalAllocated;

  return (
    <div className="flex flex-col gap-6">
      {/* Bara de sumar: Venit → Alocat → Nealocat */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs font-medium text-muted">Venit</p>
            <p className="mt-1 font-bold tabular-nums text-income">{ron.format(totalIncome)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Alocat</p>
            <p className="mt-1 font-bold tabular-nums">{ron.format(totalAllocated)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Nealocat</p>
            <p
              className={`mt-1 font-bold tabular-nums ${
                unallocated < 0 ? "text-expense" : "text-income"
              }`}
            >
              {ron.format(unallocated)}
            </p>
          </div>
        </div>
        {unallocated < 0 ? (
          <p className="mt-2 text-center text-xs text-expense">
            Ai alocat mai mult decât venitul disponibil.
          </p>
        ) : null}
      </div>

      {/* Venituri */}
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Venituri</h2>
        <div className="flex flex-col gap-2">
          {incomes.length === 0 ? (
            <p className="text-sm text-muted">Niciun venit adăugat.</p>
          ) : (
            incomes.map((i) => (
              <IncomeRow
                key={i.id}
                income={i}
                onAmount={(v) => setIncomeAmounts((m) => ({ ...m, [i.id]: v }))}
              />
            ))
          )}
        </div>
        <AddIncomeForm month={month} incomeCats={incomeCats} />
      </section>

      {/* Cheltuieli planificate */}
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Cheltuieli planificate</h2>
        <div className="flex flex-col gap-2">
          {allocations.length === 0 ? (
            <p className="text-sm text-muted">Nicio cheltuială planificată.</p>
          ) : (
            allocations.map((a) => (
              <AllocationRow
                key={a.id}
                alloc={a}
                onAmount={(v) => setAllocAmounts((m) => ({ ...m, [a.id]: v }))}
              />
            ))
          )}
        </div>
        <AddAllocationForm month={month} expenseCats={expenseCats} />
      </section>
    </div>
  );
}

function IncomeRow({
  income,
  onAmount,
}: {
  income: PlanIncome;
  onAmount: (v: number) => void;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2.5">
      <span className="flex-1 truncate text-sm font-medium">
        {income.label}
        {income.recurring_id ? <span className="ml-1 text-muted">🔁</span> : null}
      </span>
      <input
        type="text"
        inputMode="decimal"
        defaultValue={String(income.amount)}
        aria-label={`Sumă ${income.label}`}
        onChange={(e) => onAmount(parseAmount(e.target.value))}
        onBlur={(e) => {
          const v = parseAmount(e.target.value);
          start(() => setIncomeAmountAction(income.id, v));
        }}
        className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-right text-sm font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <button
        type="button"
        aria-label="Șterge venitul"
        disabled={pending}
        onClick={() => start(() => deleteIncomeAction(income.id))}
        className="rounded-lg px-2 py-1 text-muted hover:text-expense"
      >
        ✕
      </button>
    </div>
  );
}

function AllocationRow({
  alloc,
  onAmount,
}: {
  alloc: PlanAllocation;
  onAmount: (v: number) => void;
}) {
  const [pending, start] = useTransition();
  const name = alloc.category?.name ?? alloc.label ?? "Cheltuială";
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border p-2.5 ${
        alloc.is_paid ? "border-income/40 bg-income/5" : "border-border bg-surface"
      }`}
    >
      {/* Toggle „plătit" */}
      <form action={togglePaidAction}>
        <input type="hidden" name="id" value={alloc.id} />
        <button
          type="submit"
          aria-label={alloc.is_paid ? "Marchează neplătit" : "Marchează plătit"}
          className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs ${
            alloc.is_paid
              ? "border-income bg-income text-white"
              : "border-border hover:border-primary"
          }`}
        >
          {alloc.is_paid ? "✓" : ""}
        </button>
      </form>

      <span className="flex-1 truncate text-sm font-medium">
        {alloc.category?.icon ? `${alloc.category.icon} ` : ""}
        {name}
        {alloc.recurring_id ? <span className="ml-1 text-muted">🔁</span> : null}
      </span>

      <input
        type="text"
        inputMode="decimal"
        defaultValue={String(alloc.planned_amount)}
        aria-label={`Sumă ${name}`}
        disabled={alloc.is_paid}
        onChange={(e) => onAmount(parseAmount(e.target.value))}
        onBlur={(e) => {
          const v = parseAmount(e.target.value);
          start(() => setAllocationAmountAction(alloc.id, v));
        }}
        className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-right text-sm font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      />
      <button
        type="button"
        aria-label="Șterge alocarea"
        disabled={pending}
        onClick={() => start(() => deleteAllocationAction(alloc.id))}
        className="rounded-lg px-2 py-1 text-muted hover:text-expense"
      >
        ✕
      </button>
    </div>
  );
}

function AddIncomeForm({ month, incomeCats }: { month: string; incomeCats: Category[] }) {
  const [state, formAction, pending] = useActionState<PlanActionState, FormData>(
    addIncomeAction,
    undefined,
  );
  const [open, setOpen] = useState(false);
  const [recurring, setRecurring] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted hover:bg-background"
      >
        + Adaugă venit
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
    >
      <input type="hidden" name="month" value={month} />
      <input
        name="label"
        required
        placeholder="ex: Salariu Gabi"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <input
        name="amount"
        type="text"
        inputMode="decimal"
        required
        placeholder="Sumă (RON)"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_recurring"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
        />
        Venit recurent (se repetă lunar)
      </label>
      {recurring ? (
        <div className="flex gap-2">
          <select
            name="category_id"
            required
            defaultValue=""
            className="flex-1 rounded-lg border border-border bg-background px-2 py-2 text-sm"
          >
            <option value="" disabled>
              Categorie venit…
            </option>
            {incomeCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="day_of_month"
            type="number"
            min={1}
            max={31}
            defaultValue={1}
            aria-label="Ziua lunii"
            className="w-16 rounded-lg border border-border bg-background px-2 py-2 text-sm"
          />
        </div>
      ) : null}
      {state?.error ? <p className="text-sm text-expense">{state.error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Se salvează…" : "Adaugă"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-background"
        >
          Anulează
        </button>
      </div>
    </form>
  );
}

function AddAllocationForm({
  month,
  expenseCats,
}: {
  month: string;
  expenseCats: Category[];
}) {
  const [state, formAction, pending] = useActionState<PlanActionState, FormData>(
    addAllocationAction,
    undefined,
  );
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted hover:bg-background"
      >
        + Adaugă altceva
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
    >
      <input type="hidden" name="month" value={month} />
      <select
        name="category_id"
        required
        defaultValue=""
        className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
      >
        <option value="" disabled>
          Categorie cheltuială…
        </option>
        {expenseCats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon ? `${c.icon} ` : ""}
            {c.name}
          </option>
        ))}
      </select>
      <input
        name="label"
        placeholder="Detaliu (opțional)"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <input
        name="planned_amount"
        type="text"
        inputMode="decimal"
        required
        placeholder="Sumă (RON)"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      {state?.error ? <p className="text-sm text-expense">{state.error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Se salvează…" : "Adaugă"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-background"
        >
          Anulează
        </button>
      </div>
    </form>
  );
}
