"use client";

import { useActionState } from "react";

import { redeemInviteAction, type InviteActionState } from "@/lib/actions/invites";

/** Formular de alăturare la o gospodărie existentă printr-un cod de invitație. */
export function JoinForm({ initialCode }: { initialCode?: string }) {
  const [state, formAction, pending] = useActionState<InviteActionState, FormData>(
    redeemInviteAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="text-sm font-medium">
          Cod de invitație
        </label>
        <input
          id="code"
          name="code"
          type="text"
          required
          defaultValue={initialCode ?? ""}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="ex: AB3K9XQP"
          className="rounded-lg border border-border bg-surface px-3 py-2.5 font-mono uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
        className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Se alătură…" : "Alătură-te gospodăriei"}
      </button>
    </form>
  );
}
