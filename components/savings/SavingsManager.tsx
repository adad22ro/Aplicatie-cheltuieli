"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  createGoalAction,
  contributeAction,
  deleteGoalAction,
  type SavingsActionState,
} from "@/lib/actions/savings";
import type { SavingsGoal } from "@/lib/data/savings";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

function Contribute({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<SavingsActionState, FormData>(
    contributeAction,
    undefined,
  );
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <input
          name="amount"
          type="text"
          inputMode="decimal"
          required
          placeholder="Sumă"
          aria-label="Sumă contribuție"
          className="w-24 rounded-lg border border-border bg-surface px-2 py-1 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button
          type="submit"
          name="direction"
          value="add"
          disabled={pending}
          className="rounded-lg bg-income/15 px-2 py-1 text-xs font-semibold text-income hover:bg-income/25 disabled:opacity-60"
        >
          + Adaugă
        </button>
        <button
          type="submit"
          name="direction"
          value="withdraw"
          disabled={pending}
          className="rounded-lg bg-expense/15 px-2 py-1 text-xs font-semibold text-expense hover:bg-expense/25 disabled:opacity-60"
        >
          − Scoate
        </button>
      </div>
      {state?.error ? (
        <p role="alert" className="text-xs text-expense">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function GoalCard({ goal }: { goal: SavingsGoal }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      {/* Nume pe rând propriu (lățime completă) */}
      <div className="min-w-0">
        <p className="font-semibold">{goal.name}</p>
        {goal.deadline ? (
          <p className="text-xs text-muted">
            Termen: {new Date(goal.deadline).toLocaleDateString("ro-RO")}
          </p>
        ) : null}
      </div>

      {/* Strâns / țintă, pe rândul lor */}
      <p className="flex items-baseline justify-between text-sm">
        <span className="text-muted">Strâns</span>
        <span>
          <span className="font-semibold tabular-nums">{ron.format(goal.current_amount)}</span>
          <span className="text-muted"> / {ron.format(goal.target_amount)}</span>
        </span>
      </p>

      <div className="flex flex-col gap-1">
        <div className="h-2 overflow-hidden rounded-full bg-background">
          <div
            className={`h-full rounded-full transition-all ${goal.reached ? "bg-income" : "bg-primary"}`}
            style={{ width: `${goal.pct}%` }}
          />
        </div>
        <p className={`text-xs ${goal.reached ? "text-income font-medium" : "text-muted"}`}>
          {goal.reached ? "🎉 Obiectiv atins!" : `Mai lipsesc ${ron.format(goal.remaining)}`}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Contribute id={goal.id} />
        <div className="flex items-center gap-1">
          <Link
            href={`/savings/${goal.id}/edit`}
            className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-background"
          >
            Editează
          </Link>
          <form action={deleteGoalAction}>
            <input type="hidden" name="id" value={goal.id} />
            <button
              type="submit"
              className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-expense hover:bg-background"
            >
              Șterge
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

function AddGoal() {
  const [state, formAction, pending] = useActionState<SavingsActionState, FormData>(
    createGoalAction,
    undefined,
  );
  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-muted">Obiectiv nou</h2>
      <input
        name="name"
        type="text"
        required
        maxLength={60}
        placeholder="ex: Vacanță"
        className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="target_amount"
          type="text"
          inputMode="decimal"
          required
          placeholder="Țintă (RON)"
          className="rounded-lg border border-border bg-surface px-3 py-2 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <input
          name="deadline"
          type="date"
          aria-label="Termen (opțional)"
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>
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
        {pending ? "Se salvează…" : "Adaugă obiectiv"}
      </button>
    </form>
  );
}

export function SavingsManager({ goals }: { goals: SavingsGoal[] }) {
  return (
    <div className="flex flex-col gap-5 pb-8">
      <AddGoal />
      {goals.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
          Niciun obiectiv încă. Setează o țintă (vacanță, fond de urgență) și urmărește progresul.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </ul>
      )}
    </div>
  );
}
