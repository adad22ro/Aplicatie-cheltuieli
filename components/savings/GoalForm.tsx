"use client";

import { useActionState } from "react";
import Link from "next/link";

import { updateGoalAction, type SavingsActionState } from "@/lib/actions/savings";

export type GoalInitial = {
  id: string;
  name: string;
  target_amount: number;
  deadline: string | null;
};

/** Editarea unui obiectiv (nume, țintă, termen). Contribuțiile se fac din listă. */
export function GoalForm({ initial }: { initial: GoalInitial }) {
  const [state, formAction, pending] = useActionState<SavingsActionState, FormData>(
    updateGoalAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={initial.id} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nume
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={60}
          defaultValue={initial.name}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="target_amount" className="text-sm font-medium">
          Țintă (RON)
        </label>
        <input
          id="target_amount"
          name="target_amount"
          type="text"
          inputMode="decimal"
          required
          defaultValue={String(initial.target_amount)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="deadline" className="text-sm font-medium">
          Termen <span className="text-muted">(opțional)</span>
        </label>
        <input
          id="deadline"
          name="deadline"
          type="date"
          defaultValue={initial.deadline ?? ""}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-expense">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Se salvează…" : "Salvează"}
        </button>
        <Link
          href="/savings"
          className="rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-background"
        >
          Anulează
        </Link>
      </div>
    </form>
  );
}
