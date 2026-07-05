"use client";

import { useActionState, useState } from "react";

import { renameHouseholdAction, type AdminActionState } from "@/lib/actions/admin";
import type { AdminHousehold } from "@/lib/data/admin";

export function HouseholdRow({ household }: { household: AdminHousehold }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    renameHouseholdAction,
    undefined,
  );

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{household.name}</p>
          <p className="text-xs text-muted">
            {household.members} membri · {household.transactions} tranzacții · creat{" "}
            {new Date(household.created_at).toLocaleDateString("ro-RO")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-background"
        >
          Redenumește
        </button>
      </div>

      {open ? (
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={household.id} />
          <input
            name="name"
            defaultValue={household.name}
            required
            maxLength={60}
            className="flex-1 rounded-lg border border-border bg-surface px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? "…" : "Salvează"}
          </button>
        </form>
      ) : null}
      {state && "error" in state ? (
        <p role="alert" className="text-xs text-expense">
          {state.error}
        </p>
      ) : state && "ok" in state ? (
        <p className="text-xs text-income">Redenumit ✓</p>
      ) : null}
    </li>
  );
}
