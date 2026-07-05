"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";

import {
  createTransactionAction,
  updateTransactionAction,
  type TransactionActionState,
} from "@/lib/actions/transactions";
import type { Category, PaymentMethod } from "@/lib/data/settings";

type EntryType = "income" | "expense";

export type TransactionInitial = {
  id: string;
  amount: number;
  type: EntryType;
  category_id: string;
  payment_method_id: string | null;
  date: string;
  note: string | null;
};

/** Data de azi în format local YYYY-MM-DD (nu UTC, ca să nu sară ziua). */
function todayLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type TransactionPrefill = {
  amount?: string;
  type?: EntryType;
  category_id?: string;
  note?: string;
};

export function TransactionForm({
  mode,
  categories,
  methods,
  initial,
  prefill,
}: {
  mode: "create" | "edit";
  categories: Category[];
  methods: PaymentMethod[];
  initial?: TransactionInitial;
  prefill?: TransactionPrefill;
}) {
  const action =
    mode === "create" ? createTransactionAction : updateTransactionAction;
  const [state, formAction, pending] = useActionState<
    TransactionActionState,
    FormData
  >(action, undefined);

  const [type, setType] = useState<EntryType>(initial?.type ?? prefill?.type ?? "expense");
  const [categoryId, setCategoryId] = useState<string>(
    initial?.category_id ?? prefill?.category_id ?? "",
  );

  // Categoriile afișate depind de tipul selectat (venit vs cheltuială).
  const visibleCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  // La schimbarea tipului, dacă categoria aleasă nu mai e validă, o resetăm.
  const categoryStillValid = visibleCategories.some((c) => c.id === categoryId);
  const effectiveCategoryId = categoryStillValid ? categoryId : "";

  const switchType = (next: EntryType) => {
    setType(next);
    setCategoryId((prev) =>
      categories.some((c) => c.id === prev && c.type === next) ? prev : "",
    );
  };

  const noCategories = visibleCategories.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}
      <input type="hidden" name="type" value={type} />

      {/* Sumă — câmpul principal, focus automat, tastatură numerică pe mobil */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className="text-sm font-medium">
          Sumă (RON)
        </label>
        <input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          required
          autoFocus
          defaultValue={initial ? String(initial.amount) : (prefill?.amount ?? "")}
          placeholder="0,00"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-2xl font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {/* Tip: venit / cheltuială */}
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tip tranzacție">
        <button
          type="button"
          onClick={() => switchType("expense")}
          aria-pressed={type === "expense"}
          className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
            type === "expense"
              ? "border-expense bg-expense/10 text-expense"
              : "border-border hover:bg-background"
          }`}
        >
          Cheltuială
        </button>
        <button
          type="button"
          onClick={() => switchType("income")}
          aria-pressed={type === "income"}
          className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
            type === "income"
              ? "border-income bg-income/10 text-income"
              : "border-border hover:bg-background"
          }`}
        >
          Venit
        </button>
      </div>

      {/* Categorie (filtrată după tip) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category_id" className="text-sm font-medium">
          Categorie
        </label>
        {noCategories ? (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted">
            Nicio categorie de {type === "income" ? "venit" : "cheltuială"}.{" "}
            <Link href="/settings/categories" className="font-medium text-primary underline">
              Adaugă una
            </Link>
            .
          </p>
        ) : (
          <select
            id="category_id"
            name="category_id"
            required
            value={effectiveCategoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="" disabled>
              Alege categoria…
            </option>
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Metodă de plată (opțional) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="payment_method_id" className="text-sm font-medium">
          Metodă de plată <span className="text-muted">(opțional)</span>
        </label>
        <select
          id="payment_method_id"
          name="payment_method_id"
          defaultValue={initial?.payment_method_id ?? ""}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">—</option>
          {methods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dată */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="date" className="text-sm font-medium">
          Dată
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={initial?.date ?? todayLocal()}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {/* Notă */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note" className="text-sm font-medium">
          Notă <span className="text-muted">(opțional)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          maxLength={200}
          defaultValue={initial?.note ?? prefill?.note ?? ""}
          placeholder="ex: cumpărături săptămânale"
          className="resize-none rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-expense">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || noCategories}
          className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Se salvează…" : mode === "create" ? "Adaugă tranzacția" : "Salvează"}
        </button>
        <Link
          href="/transactions"
          className="rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-background"
        >
          Anulează
        </Link>
      </div>
    </form>
  );
}
