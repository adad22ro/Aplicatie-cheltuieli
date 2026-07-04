"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  createPaymentMethodAction,
  updatePaymentMethodAction,
  deletePaymentMethodAction,
} from "@/lib/actions/payment-methods";
import type { SettingsActionState } from "@/lib/actions/categories";
import type { PaymentMethod } from "@/lib/data/settings";

/** Formular de creare/editare a unei metode de plată. */
function PaymentMethodForm({
  mode,
  initial,
  onDone,
}: {
  mode: "create" | "edit";
  initial?: PaymentMethod;
  onDone?: () => void;
}) {
  const action =
    mode === "create" ? createPaymentMethodAction : updatePaymentMethodAction;
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    action,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      if (mode === "create") formRef.current?.reset();
      onDone?.();
    }
  }, [state, mode, onDone]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <div className="flex gap-2">
        <input
          name="name"
          type="text"
          required
          maxLength={40}
          defaultValue={initial?.name ?? ""}
          placeholder="ex: Card BT, Cash, Revolut"
          aria-label="Nume metodă de plată"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Se salvează…" : mode === "create" ? "Adaugă" : "Salvează"}
        </button>
        {mode === "edit" ? (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-background"
          >
            Anulează
          </button>
        ) : null}
      </div>

      {state && "error" in state ? (
        <p role="alert" className="text-sm text-expense">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function PaymentMethodRow({ method }: { method: PaymentMethod }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-xl border border-border bg-surface p-3">
        <PaymentMethodForm mode="edit" initial={method} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <p className="min-w-0 flex-1 truncate font-medium">{method.name}</p>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
      >
        Editează
      </button>
      <form action={deletePaymentMethodAction}>
        <input type="hidden" name="id" value={method.id} />
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-expense hover:bg-background"
        >
          Șterge
        </button>
      </form>
    </li>
  );
}

export function PaymentMethodManager({ methods }: { methods: PaymentMethod[] }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-muted">Metodă nouă</h2>
        <PaymentMethodForm mode="create" />
      </section>

      {methods.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
          Nicio metodă de plată încă. Adaugă prima mai sus.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {methods.map((m) => (
            <PaymentMethodRow key={m.id} method={m} />
          ))}
        </ul>
      )}
    </div>
  );
}
