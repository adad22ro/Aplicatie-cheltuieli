"use client";

import { useActionState } from "react";

import {
  createHouseholdAction,
  type HouseholdActionState,
} from "@/lib/actions/household";

/** Formular de creare a gospodăriei la onboarding. */
export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<
    HouseholdActionState,
    FormData
  >(createHouseholdAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Numele gospodăriei
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={80}
          autoFocus
          placeholder="ex: Familia Popescu"
          className="rounded-lg border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
        {pending ? "Se creează…" : "Creează gospodăria"}
      </button>
    </form>
  );
}
