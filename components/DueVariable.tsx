"use client";

import { useActionState } from "react";

import {
  confirmVariableAction,
  type VariableDueActionState,
} from "@/lib/actions/variable-due";
import type { DueVariableItem } from "@/lib/data/variable-due";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 2,
});

const fmtDate = (s: string) => new Date(s).toLocaleDateString("ro-RO");

function DueRow({ item }: { item: DueVariableItem }) {
  const [state, formAction, pending] = useActionState<VariableDueActionState, FormData>(
    confirmVariableAction,
    undefined,
  );
  return (
    <li className="flex flex-col gap-1 rounded-xl border border-warning/40 bg-warning/5 p-2.5">
      <div className="flex items-center gap-2">
        <span aria-hidden>{item.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="truncate text-xs text-muted">
            Scadentă {fmtDate(item.due_date)} ·{" "}
            {item.kind === "recurring" ? "recurență" : "rată"}{" "}
            {item.reason === "variable" ? "variabilă" : "(confirm manual)"}
          </p>
        </div>
      </div>
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="kind" value={item.kind} />
        <input type="hidden" name="source_id" value={item.source_id} />
        <input type="hidden" name="due_date" value={item.due_date} />
        <input
          name="amount"
          type="text"
          inputMode="decimal"
          required
          defaultValue={item.estimate > 0 ? String(item.estimate) : ""}
          aria-label={`Suma reală pentru ${item.name}`}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-right text-sm font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "…" : "Confirmă"}
        </button>
      </form>
      {state?.error ? (
        <p role="alert" className="text-xs text-expense">
          {state.error}
        </p>
      ) : null}
    </li>
  );
}

export function DueVariable({ items }: { items: DueVariableItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-warning/40 bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">De completat</h2>
        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
          {items.length}
        </span>
      </div>
      <p className="text-xs text-muted">
        Plăți/încasări ajunse la scadență (sumă variabilă sau confirmate manual). Verifică suma și
        confirmă ca să intre în sold.
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <DueRow key={`${item.kind}-${item.source_id}-${item.due_date}`} item={item} />
        ))}
      </ul>
    </section>
  );
}
