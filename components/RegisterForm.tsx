"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction, type AuthActionState } from "@/lib/actions/auth";

/** Înregistrare cu cod de invitație obligatoriu. */
export function RegisterForm({ initialCode }: { initialCode?: string }) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    registerAction,
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
        <p className="text-xs text-muted">
          Înregistrarea e posibilă doar cu un cod primit de la administrator.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Numele tău
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={40}
          autoComplete="name"
          placeholder="ex: Maria"
          className="rounded-lg border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Parolă
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
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
        className="mt-1 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Se procesează…" : "Creează cont"}
      </button>

      <p className="text-center text-sm text-muted">
        Ai deja cont?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Autentifică-te
        </Link>
      </p>
    </form>
  );
}
