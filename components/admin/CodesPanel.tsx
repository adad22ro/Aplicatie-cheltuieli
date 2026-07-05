"use client";

import { useActionState, useState } from "react";

import {
  generateSignupCodeAction,
  revokeSignupCodeAction,
  type AdminActionState,
} from "@/lib/actions/admin";
import type { SignupCodeRow } from "@/lib/data/admin";

const STATUS_LABEL = { active: "Activ", used: "Folosit", expired: "Expirat" } as const;
const STATUS_CLS = { active: "text-income", used: "text-muted", expired: "text-expense" } as const;

function registerLink(code: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/register?code=${code}`;
}

function Copy({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard indisponibil */
        }
      }}
      className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-background"
    >
      {done ? "Copiat ✓" : label}
    </button>
  );
}

export function CodesPanel({
  households,
  codes,
}: {
  households: { id: string; name: string }[];
  codes: SignupCodeRow[];
}) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    generateSignupCodeAction,
    undefined,
  );

  return (
    <div className="flex flex-col gap-5">
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-muted">Cod nou</h2>

        <input
          name="label"
          type="text"
          maxLength={60}
          placeholder="Etichetă (ex: pentru Maria)"
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />

        <label className="text-xs font-medium text-muted">Gospodărie țintă</label>
        <select
          name="household_id"
          defaultValue=""
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">Gospodărie nouă (userul își creează una)</option>
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <select
            name="role"
            defaultValue="member"
            aria-label="Rol"
            className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="member">Membru</option>
            <option value="owner">Owner</option>
          </select>
          <select
            name="expiresInDays"
            defaultValue="7"
            aria-label="Expirare"
            className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="1">Expiră în 1 zi</option>
            <option value="7">Expiră în 7 zile</option>
            <option value="30">Expiră în 30 zile</option>
            <option value="">Fără expirare</option>
          </select>
        </div>

        {state && "error" in state ? (
          <p role="alert" className="text-sm text-expense">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Se generează…" : "Generează cod"}
        </button>
      </form>

      {codes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
          Niciun cod încă.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {codes.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-lg font-bold tracking-wider">{c.code}</span>
                <span className={`text-xs font-medium ${STATUS_CLS[c.status]}`}>
                  {STATUS_LABEL[c.status]}
                </span>
              </div>
              <p className="text-xs text-muted">
                {c.label ? `${c.label} · ` : ""}
                {c.household_name ? `→ ${c.household_name} (${c.role})` : "→ gospodărie nouă"}
                {c.expires_at ? ` · expiră ${new Date(c.expires_at).toLocaleDateString("ro-RO")}` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {c.status === "active" ? (
                  <>
                    <Copy text={c.code} label="Copiază codul" />
                    <Copy text={registerLink(c.code)} label="Copiază linkul" />
                  </>
                ) : null}
                <form action={revokeSignupCodeAction} className="ml-auto">
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-expense hover:bg-background"
                  >
                    Șterge
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
