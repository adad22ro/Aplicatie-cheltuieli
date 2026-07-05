"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import {
  addIncomeAction,
  addAllocationAction,
  setAllocationAmountAction,
  setAllocationOrderAction,
  setIncomeAmountAction,
  deleteAllocationAction,
  deleteIncomeAction,
  togglePaidAction,
  type PlanActionState,
} from "@/lib/actions/plan";
import type { PlanIncome, PlanAllocation, Contribution } from "@/lib/data/plan";
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
  rollover,
  contributions,
}: {
  month: string;
  incomes: PlanIncome[];
  allocations: PlanAllocation[];
  categories: Category[];
  rollover: number;
  contributions: Contribution[];
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

  // Ordinea locală a alocărilor (pentru prioritizare cu ↑/↓).
  const [order, setOrder] = useState<string[]>(() => allocations.map((a) => a.id));
  const [, startReorder] = useTransition();
  const byId = useMemo(
    () => Object.fromEntries(allocations.map((a) => [a.id, a])),
    [allocations],
  );
  const orderedAllocs = order.map((id) => byId[id]).filter(Boolean) as PlanAllocation[];

  const amountOf = (a: PlanAllocation) => allocAmounts[a.id] ?? a.planned_amount;

  const totalIncome = incomes.reduce((s, i) => s + (incomeAmounts[i.id] ?? i.amount), 0);
  const available = totalIncome + rollover; // bani de repartizat (venit + report)
  const totalAllocated = allocations.reduce((s, a) => s + amountOf(a), 0);
  const unallocated = available - totalAllocated;
  // Rest de plătit = alocările încă nebifate „plătit".
  const remainingToPay = allocations
    .filter((a) => !a.is_paid)
    .reduce((s, a) => s + amountOf(a), 0);
  const pctAllocated =
    available > 0 ? Math.round((totalAllocated / available) * 100) : 0;

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    setOrder(next);
    startReorder(() => setAllocationOrderAction(next));
  };

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

        {/* Report din luna anterioară */}
        {rollover !== 0 ? (
          <p className="mt-2 text-center text-xs text-muted">
            Report din luna trecută:{" "}
            <span className={`font-semibold ${rollover < 0 ? "text-expense" : "text-income"}`}>
              {rollover >= 0 ? "+" : ""}
              {ron.format(rollover)}
            </span>{" "}
            · disponibil {ron.format(available)}
          </p>
        ) : null}

        {/* Bară de progres alocare */}
        {available > 0 ? (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
            <div
              className={`h-full rounded-full ${
                unallocated < 0 ? "bg-expense" : "bg-primary"
              }`}
              style={{ width: `${Math.min(pctAllocated, 100)}%` }}
            />
          </div>
        ) : null}

        {/* Alerte / rest de acoperit */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted">
            Rest de plătit: <span className="font-semibold text-foreground">{ron.format(remainingToPay)}</span>
          </span>
          {totalIncome > 0 ? (
            unallocated < 0 ? (
              <span className="font-medium text-expense">
                Lipsă {ron.format(-unallocated)} pentru tot planul
              </span>
            ) : unallocated === 0 ? (
              <span className="font-medium text-income">Tot venitul e alocat 🎉</span>
            ) : (
              <span className="text-muted">
                Alocat {pctAllocated}% · mai ai {ron.format(unallocated)}
              </span>
            )
          ) : null}
        </div>

        {/* Contribuții pe persoană (cont comun cu 2 venituri) */}
        {contributions.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-2">
            {contributions.map((c) => (
              <span
                key={c.user_id ?? "comun"}
                className="rounded-full bg-background px-2.5 py-1 text-xs"
              >
                {c.name}: <span className="font-semibold tabular-nums">{ron.format(c.amount)}</span>
              </span>
            ))}
          </div>
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
          {orderedAllocs.length === 0 ? (
            <p className="text-sm text-muted">Nicio cheltuială planificată.</p>
          ) : (
            orderedAllocs.map((a, index) => (
              <AllocationRow
                key={a.id}
                alloc={a}
                index={index}
                count={orderedAllocs.length}
                onMove={move}
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
  index,
  count,
  onMove,
  onAmount,
}: {
  alloc: PlanAllocation;
  index: number;
  count: number;
  onMove: (index: number, dir: -1 | 1) => void;
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
      {/* Reordonare (prioritizare) */}
      <div className="flex flex-col">
        <button
          type="button"
          aria-label="Mută mai sus"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          className="px-1 text-xs leading-none text-muted hover:text-foreground disabled:opacity-30"
        >
          ▲
        </button>
        <button
          type="button"
          aria-label="Mută mai jos"
          disabled={index === count - 1}
          onClick={() => onMove(index, 1)}
          className="px-1 text-xs leading-none text-muted hover:text-foreground disabled:opacity-30"
        >
          ▼
        </button>
      </div>

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
