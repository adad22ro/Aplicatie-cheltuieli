"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction, type ResetActionState } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ResetActionState, FormData>(
    requestPasswordResetAction,
    undefined,
  );
  const sent = state && "ok" in state;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Ți-ai uitat parola?</h1>
        <p className="mb-6 text-sm text-muted">
          Îți trimitem un link de resetare pe email.
        </p>

        {sent ? (
          <div className="flex flex-col gap-4">
            <p className="rounded-lg border border-income/40 bg-income/5 px-3 py-2 text-sm text-income">
              Dacă există un cont cu acest email, ți-am trimis un link de resetare. Verifică-ți
              inbox-ul (și folderul spam).
            </p>
            <Link href="/login" className="text-center text-sm font-semibold text-primary">
              ← Înapoi la autentificare
            </Link>
          </div>
        ) : (
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

            {state && "error" in state ? (
              <p role="alert" className="text-sm text-expense">
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {pending ? "Se trimite…" : "Trimite link de resetare"}
            </button>

            <p className="text-center text-sm text-muted">
              <Link href="/login" className="font-semibold text-primary">
                ← Înapoi la autentificare
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
