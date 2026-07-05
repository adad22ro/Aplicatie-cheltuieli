"use client";

import { useActionState, useState } from "react";

import {
  resetPasswordAction,
  deleteUserAction,
  type AdminActionState,
} from "@/lib/actions/admin";
import type { AdminUser } from "@/lib/data/admin";

export function UserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    resetPasswordAction,
    undefined,
  );

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {user.email ?? user.id}
            {isSelf ? " (tu)" : ""}
          </p>
          <p className="text-xs text-muted">
            {user.households.length > 0
              ? user.households.map((h) => `${h.name} (${h.role})`).join(", ")
              : "fără gospodărie"}
          </p>
          <p className="text-xs text-muted">
            Creat: {new Date(user.created_at).toLocaleDateString("ro-RO")}
            {user.last_sign_in_at
              ? ` · ultim login: ${new Date(user.last_sign_in_at).toLocaleDateString("ro-RO")}`
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-background"
          >
            Parolă
          </button>
          {!isSelf ? (
            <form action={deleteUserAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-expense hover:bg-background"
              >
                Șterge
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {open ? (
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <input
            name="password"
            type="text"
            minLength={6}
            required
            placeholder="Parolă nouă (min 6)"
            className="flex-1 rounded-lg border border-border bg-surface px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? "…" : "Setează"}
          </button>
        </form>
      ) : null}
      {state && "error" in state ? (
        <p role="alert" className="text-xs text-expense">
          {state.error}
        </p>
      ) : state && "ok" in state ? (
        <p className="text-xs text-income">Parolă actualizată ✓</p>
      ) : null}
    </li>
  );
}
