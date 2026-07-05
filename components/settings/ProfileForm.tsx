"use client";

import { useActionState } from "react";

import { saveProfileAction, type ProfileActionState } from "@/lib/actions/profile";

export function ProfileForm({ initialName }: { initialName: string | null }) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(
    saveProfileAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="display_name" className="text-sm font-medium">
          Numele tău
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          maxLength={40}
          defaultValue={initialName ?? ""}
          placeholder="ex: Maria"
          className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <p className="text-xs text-muted">
          Apare pe tranzacțiile pe care le adaugi, ca ceilalți membri să vadă cine a trecut fiecare sumă.
        </p>
      </div>

      {state && "error" in state ? (
        <p role="alert" className="text-sm text-expense">
          {state.error}
        </p>
      ) : state && "ok" in state ? (
        <p className="text-sm text-income">Salvat ✓</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Se salvează…" : "Salvează"}
      </button>
    </form>
  );
}
