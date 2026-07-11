"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import {
  createInstallmentAction,
  updateInstallmentAction,
  type InstallmentActionState,
} from "@/lib/actions/installments";
import { installmentAmount } from "@/lib/schemas/installments";
import type { Category, PaymentMethod } from "@/lib/data/settings";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 2,
});

export type InstallmentInitial = {
  id: string;
  name: string;
  total_amount: number;
  total_installments: number;
  category_id: string;
  payment_method_id: string | null;
  day_of_month: number;
  start_date: string;
  is_variable: boolean;
  manual_confirm: boolean;
};

function todayLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function InstallmentForm({
  mode,
  categories,
  methods,
  initial,
}: {
  mode: "create" | "edit";
  categories: Category[];
  methods: PaymentMethod[];
  initial?: InstallmentInitial;
}) {
  const action = mode === "create" ? createInstallmentAction : updateInstallmentAction;
  const [state, formAction, pending] = useActionState<InstallmentActionState, FormData>(
    action,
    undefined,
  );

  const [total, setTotal] = useState<string>(
    initial ? String(initial.total_amount) : "",
  );
  const [count, setCount] = useState<string>(
    initial ? String(initial.total_installments) : "",
  );
  const [isVariable, setIsVariable] = useState<boolean>(initial?.is_variable ?? false);
  const [manualConfirm, setManualConfirm] = useState<boolean>(initial?.manual_confirm ?? false);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const noCategories = expenseCategories.length === 0;

  const totalNum = Number(total.replace(",", "."));
  const countNum = Number(count);
  const rata =
    totalNum > 0 && Number.isInteger(countNum) && countNum > 0
      ? installmentAmount(totalNum, countNum)
      : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nume
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={60}
          autoFocus
          defaultValue={initial?.name ?? ""}
          placeholder="ex: Telefon Samsung"
          className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="total_amount" className="text-sm font-medium">
            Total (RON)
          </label>
          <input
            id="total_amount"
            name="total_amount"
            type="text"
            inputMode="decimal"
            required
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="3000"
            className="rounded-xl border border-border bg-surface px-3 py-2.5 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="total_installments" className="text-sm font-medium">
            Număr de rate
          </label>
          <input
            id="total_installments"
            name="total_installments"
            type="number"
            min={1}
            max={600}
            required
            value={count}
            onChange={(e) => setCount(e.target.value)}
            placeholder="12"
            className="rounded-xl border border-border bg-surface px-3 py-2.5 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      {rata !== null ? (
        <p className="rounded-lg bg-background px-3 py-2 text-sm">
          {isVariable ? "Rata medie estimată: " : "Rata lunară: "}
          <span className="font-semibold tabular-nums">{ron.format(rata)}</span>
        </p>
      ) : null}

      {/* Rată variabilă (ex: credit cu dobândă variabilă) */}
      <label className="flex items-start gap-2 rounded-xl border border-border bg-surface p-3">
        <input
          type="checkbox"
          name="is_variable"
          checked={isVariable}
          onChange={(e) => setIsVariable(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="font-medium">Rată variabilă</span> (ex: credit cu dobândă variabilă)
          <span className="mt-0.5 block text-xs text-muted">
            Nu se generează automat. Fiecare rată apare la „De completat" pe pagina principală și
            introduci suma reală a lunii. Totalul de mai sus e doar o estimare.
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
              ? "Deja inclus în rata variabilă — o completezi tu la scadență."
              : "Nu se generează automat. Fiecare rată apare la „De completat” cu suma precompletată, iar tu o marchezi plătită când chiar are loc."}
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category_id" className="text-sm font-medium">
          Categorie (cheltuială)
        </label>
        {noCategories ? (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted">
            Nicio categorie de cheltuială.{" "}
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
            defaultValue={initial?.category_id ?? ""}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="" disabled>
              Alege categoria…
            </option>
            {expenseCategories.map((c) => (
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

      <div className="grid grid-cols-2 gap-3">
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
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="start_date" className="text-sm font-medium">
            Prima rată
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={initial?.start_date ?? todayLocal()}
            className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
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
          {pending ? "Se salvează…" : mode === "create" ? "Adaugă planul" : "Salvează"}
        </button>
        <Link
          href="/installments"
          className="rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-background"
        >
          Anulează
        </Link>
      </div>
    </form>
  );
}
