"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Phase = "checking" | "ready" | "invalid" | "done";

function validate(pw: string): string | null {
  if (pw.length < 8) return "Parola trebuie să aibă minim 8 caractere";
  if (!/[a-zA-Z]/.test(pw)) return "Parola trebuie să conțină cel puțin o literă";
  if (!/[0-9]/.test(pw)) return "Parola trebuie să conțină cel puțin o cifră";
  return null;
}

export default function ResetPasswordPage() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Stabilește sesiunea de recuperare din link (code PKCE sau hash implicit).
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    (async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setPhase("invalid");
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      setPhase(data.session ? "ready" : "invalid");
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const pw = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;
    const v = validate(pw);
    if (v) return setError(v);
    if (pw !== confirm) return setError("Parolele nu coincid");

    setError(null);
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPending(false);
    if (error) return setError("Nu am putut schimba parola. Linkul poate fi expirat.");
    setPhase("done");
  };

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Setează o parolă nouă</h1>

        {phase === "checking" ? (
          <p className="mt-4 text-sm text-muted">Se verifică linkul…</p>
        ) : phase === "invalid" ? (
          <div className="mt-4 flex flex-col gap-4">
            <p className="rounded-lg border border-expense/40 bg-expense/5 px-3 py-2 text-sm text-expense">
              Linkul de resetare e invalid sau a expirat. Cere unul nou.
            </p>
            <Link href="/forgot-password" className="text-center text-sm font-semibold text-primary">
              Cere alt link
            </Link>
          </div>
        ) : phase === "done" ? (
          <div className="mt-4 flex flex-col gap-4">
            <p className="rounded-lg border border-income/40 bg-income/5 px-3 py-2 text-sm text-income">
              Parola a fost schimbată. Te poți autentifica acum.
            </p>
            <Link href="/login" className="text-center text-sm font-semibold text-primary">
              Mergi la autentificare →
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
            <p className="text-sm text-muted">Minim 8 caractere, cu literă și cifră.</p>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Parolă nouă"
              className="rounded-lg border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <input
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirmă parola"
              className="rounded-lg border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            {error ? (
              <p role="alert" className="text-sm text-expense">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {pending ? "Se salvează…" : "Schimbă parola"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
