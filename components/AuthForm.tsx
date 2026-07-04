"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthActionState } from "@/lib/actions/auth";

type AuthAction = (
  prev: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

type Props = {
  action: AuthAction;
  submitLabel: string;
  altText: string;
  altHref: string;
  altLinkLabel: string;
};

/**
 * Formular de autentificare reutilizabil (login și register). Gestionează starea de
 * eroare și „pending" prin `useActionState`. Validarea reală se face pe server, în
 * action — aici e doar UX.
 */
export function AuthForm({
  action,
  submitLabel,
  altText,
  altHref,
  altLinkLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
          autoComplete="current-password"
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
        {pending ? "Se procesează…" : submitLabel}
      </button>

      <p className="text-center text-sm text-muted">
        {altText}{" "}
        <Link href={altHref} className="font-semibold text-primary">
          {altLinkLabel}
        </Link>
      </p>
    </form>
  );
}
