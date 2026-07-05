"use client";

import { useActionState, useState } from "react";

import {
  createInviteAction,
  revokeInviteAction,
  type InviteActionState,
} from "@/lib/actions/invites";
import type { Invite } from "@/lib/data/invites";

const STATUS_LABEL: Record<Invite["status"], string> = {
  active: "Activă",
  used: "Folosită",
  expired: "Expirată",
};

const STATUS_CLS: Record<Invite["status"], string> = {
  active: "text-income",
  used: "text-muted",
  expired: "text-expense",
};

function inviteLink(code: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/onboarding?invite=${code}`;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard indisponibil */
        }
      }}
      className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-background"
    >
      {copied ? "Copiat ✓" : label}
    </button>
  );
}

export function InviteManager({ invites }: { invites: Invite[] }) {
  const [state, formAction, pending] = useActionState<InviteActionState, FormData>(
    createInviteAction,
    undefined,
  );

  return (
    <div className="flex flex-col gap-4">
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-muted">Invitație nouă</h3>
        <label htmlFor="expiresInDays" className="text-sm">
          Expiră după
        </label>
        <select
          id="expiresInDays"
          name="expiresInDays"
          defaultValue="7"
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="1">1 zi</option>
          <option value="7">7 zile</option>
          <option value="30">30 de zile</option>
          <option value="">Fără expirare</option>
        </select>

        {state?.error ? (
          <p role="alert" className="text-sm text-expense">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Se generează…" : "Generează invitație"}
        </button>
      </form>

      {invites.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
          Nicio invitație. Generează una ca să inviți pe cineva în gospodărie.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {invites.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-lg font-bold tracking-wider">
                  {inv.code}
                </span>
                <span className={`text-xs font-medium ${STATUS_CLS[inv.status]}`}>
                  {STATUS_LABEL[inv.status]}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {inv.status === "active" ? (
                  <>
                    <CopyButton text={inv.code} label="Copiază codul" />
                    <CopyButton text={inviteLink(inv.code)} label="Copiază linkul" />
                  </>
                ) : null}
                <form action={revokeInviteAction} className="ml-auto">
                  <input type="hidden" name="id" value={inv.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-expense hover:bg-background"
                  >
                    Șterge
                  </button>
                </form>
              </div>
              {inv.expires_at && inv.status === "active" ? (
                <p className="text-xs text-muted">
                  Expiră: {new Date(inv.expires_at).toLocaleDateString("ro-RO")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
