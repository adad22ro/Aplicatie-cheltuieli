"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";

import {
  createRecurringAction,
  updateRecurringAction,
  type RecurringActionState,
} from "@/lib/actions/recurring";
import type { Category, PaymentMethod } from "@/lib/data/settings";

type EntryType = "income" | "expense";

export type RecurringInitial = {
  id: string;
  amount: number;
  type: EntryType;
  category_id: string;
  payment_method_id: string | null;
  day_of_month: number;
  note: string | null;
  is_variable: boolean;
  manual_confirm: boolean;
};

export function RecurringForm({
  mode,
  categories,
  methods,
  initial,
}: {
  mode: "create" | "edit";
  categories: Category[];
  methods: PaymentMethod[];
  initial?: RecurringInitial;
}) {
  const action = mode === "create" ? createRecurringAction : updateRecurringAction;
  const [state, formAction, pending] = useActionState<RecurringActionState, FormData>(
    action,
    undefined,
  );

  const [type, setType] = useState<EntryType>(initial?.type ?? "expense");
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id ?? "");
  const [isVariable, setIsVariable] = useState<boolean>(initial?.is_variable ?? false);
  const [manualConfirm, setManualConfirm] = useState<boolean>(initial?.manual_confirm ?? false);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );
  const categoryStillValid = visibleCategories.some((c) => c.id === categoryId);
  const effectiveCategoryId = categoryStillValid ? categoryId : "";
  const noCategories = visibleCategories.length === 0;

  const switchType = (next: EntryType) => {
    setType(next);
    setCategoryId((prev) =>
      categories.some((c) => c.id === prev && c.type === next) ? prev : "",
    );
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}
      <input type="hidden" name="type" value={type} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className="text-sm font-medium">
          {isVariable ? "Sumă estimată (RON)" : "Sumă (RON)"}
        </label>
        <input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          required
          autoFocus
          defaultValue={initial ? String(initial.amount) : ""}
          placeholder="0,00"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-2xl font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {/* Sumă variabilă (ex: factură curent) */}
      <label className="flex items-start gap-2 rounded-xl border border-border bg-surface p-3">
        <input
          type="checkbox"
          name="is_variable"
          checked={isVariable}
          onChange={(e) => setIsVariable(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="font-medium">Sumă variabilă</span> (ex: factură de curent/gaz)
          <span className="mt-0.5 block text-xs text-muted">
            Nu se generează automat. La scadență apare la „De completat" pe pagina principală și
            introduci suma reală a lunii. Suma de mai sus e doar o estimare.
          </span>
        </span>
      </label>

      {/* Confirmare manuală (pentru întârzieri). Când e variabilă, e deja inclusă → dezactivată. */}
      <label
        className={`flex items-start gap-2 rounded-xl border border-border bg-surface p-3 ${
          isVariable ? "opacity-60" : ""
        }`}
      >
        <input
          type="checkbox"
          name="manual_confirm"
          checked={isVariable || manualConfirm}
          disabled={isVariable}
          onChange={(e) => setManualConfirm(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="font-medium">O confirm manual</span> (pot exista întârzieri)
          <span className="mt-0.5 block text-xs text-muted">
            {isVariable
              ? "Deja inclus în „sumă variabilă" — o completezi tu la scadență."
              : "Nu se generează automat. Apare la „De completat" cu suma precompletată, iar tu o marchezi plătită/încasată când chiar are loc."}
          </span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tip">
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="day_of_month" className="text-sm font-medium">
          Ziua lunii
        </label>
        <select
          id="day_of_month"
          name="day_of_month"
          defaultValue={String(initial?.day_of_month ?? 1)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted">
          Se generează automat în fiecare lună în această zi (dacă luna e mai scurtă, în ultima zi).
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="note" className="text-sm font-medium">
          Notă <span className="text-muted">(opțional)</span>
        </label>
        <input
          id="note"
          name="note"
          type="text"
          maxLength={200}
          defaultValue={initial?.note ?? ""}
          placeholder="ex: chirie apartament"
          className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
          {pending ? "Se salvează…" : mode === "create" ? "Adaugă recurența" : "Salvează"}
        </button>
        <Link
          href="/recurring"
          className="rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-background"
        >
          Anulează
        </Link>
      </div>
    </form>
  );
}
