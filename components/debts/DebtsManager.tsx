"use client";

import { useActionState, useState } from "react";

import {
  createDebtAction,
  addDebtPaymentAction,
  deleteDebtPaymentAction,
  deleteDebtAction,
  settleDebtAction,
  reopenDebtAction,
  type DebtActionState,
} from "@/lib/actions/debts";
import type { DebtItem } from "@/lib/data/debts";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 2,
});

const fmtDate = (s: string) => new Date(s).toLocaleDateString("ro-RO");

function PaymentForm({ debtId, remaining }: { debtId: string; remaining: number }) {
  const [state, formAction, pending] = useActionState<DebtActionState, FormData>(
    addDebtPaymentAction,
    undefined,
  );
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input type="hidden" name="debt_id" value={debtId} />
        <input
          name="amount"
          type="text"
          inputMode="decimal"
          required
          placeholder={`Sumă (rest ${ron.format(remaining)})`}
          aria-label="Sumă restituită"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-income/15 px-2.5 py-1 text-xs font-semibold text-income hover:bg-income/25 disabled:opacity-60"
        >
          + Restituire
        </button>
      </div>
      {state?.error ? (
        <p role="alert" className="text-xs text-expense">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function DebtCard({ debt }: { debt: DebtItem }) {
  const [expanded, setExpanded] = useState(false);
  const owedByMe = debt.direction === "borrowed";
  const pct =
    debt.amount > 0 ? Math.min(100, Math.round((debt.paid_total / debt.amount) * 100)) : 0;
  return (
    <li
      className={`flex flex-col gap-3 rounded-2xl border bg-surface p-4 shadow-sm ${
        debt.is_settled ? "border-income/40 opacity-70" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="min-w-0 text-left"
        >
          <p className="flex items-center gap-1 font-semibold">
            <span className={`text-xs text-muted transition-transform ${expanded ? "rotate-90" : ""}`}>
              ›
            </span>
            <span className="truncate">{debt.person}</span>
          </p>
          <p className="truncate pl-4 text-xs text-muted">
            {owedByMe ? "Împrumutat de la" : "Împrumutat către"} · {fmtDate(debt.borrowed_date)}
          </p>
        </button>
        <p className="shrink-0 text-right text-sm">
          <span className={`block font-semibold tabular-nums ${owedByMe ? "text-expense" : "text-income"}`}>
            {debt.is_settled ? "Închisă" : ron.format(debt.remaining)}
          </span>
          <span className="text-xs text-muted">din {ron.format(debt.amount)}</span>
        </p>
      </div>

      {/* Progres restituire */}
      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div
          className={`h-full rounded-full transition-all ${debt.is_settled ? "bg-income" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {expanded ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-border pt-2 text-xs">
          <dt className="text-muted">Persoană</dt>
          <dd className="font-medium">{debt.person}</dd>
          <dt className="text-muted">Direcție</dt>
          <dd>{owedByMe ? "Datorez eu" : "Mi se datorează"}</dd>
          <dt className="text-muted">Total</dt>
          <dd className="tabular-nums">{ron.format(debt.amount)}</dd>
          <dt className="text-muted">Restituit</dt>
          <dd className="tabular-nums">{ron.format(debt.paid_total)}</dd>
          <dt className="text-muted">Rest</dt>
          <dd className="font-semibold tabular-nums">{ron.format(debt.remaining)}</dd>
          <dt className="text-muted">Din data</dt>
          <dd>{fmtDate(debt.borrowed_date)}</dd>
          {debt.note ? (
            <>
              <dt className="text-muted">Notă</dt>
              <dd>{debt.note}</dd>
            </>
          ) : null}
          {debt.settled_at ? (
            <>
              <dt className="text-muted">Închisă</dt>
              <dd>{fmtDate(debt.settled_at)}</dd>
            </>
          ) : null}
        </dl>
      ) : null}

      {/* Istoric restituiri */}
      {expanded && debt.payments.length > 0 ? (
        <ul className="flex flex-col gap-1 text-xs">
          <li className="font-medium text-muted">Restituiri:</li>
          {debt.payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-background px-2 py-1">
              <span className="truncate">
                {fmtDate(p.paid_date)}
                {p.note ? ` · ${p.note}` : ""}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums font-medium text-income">{ron.format(p.amount)}</span>
                <form action={deleteDebtPaymentAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" aria-label="Șterge restituirea" className="text-muted hover:text-expense">
                    ✕
                  </button>
                </form>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Acțiuni */}
      {debt.is_settled ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-income">✓ Achitată integral</span>
          <div className="flex items-center gap-1">
            <form action={reopenDebtAction}>
              <input type="hidden" name="id" value={debt.id} />
              <button type="submit" className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-background">
                Redeschide
              </button>
            </form>
            <form action={deleteDebtAction}>
              <input type="hidden" name="id" value={debt.id} />
              <button type="submit" className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-expense hover:bg-background">
                Șterge
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <PaymentForm debtId={debt.id} remaining={debt.remaining} />
          <div className="flex items-center justify-between gap-2">
            <form action={settleDebtAction}>
              <input type="hidden" name="id" value={debt.id} />
              <button type="submit" className="rounded-lg bg-income/15 px-2.5 py-1 text-xs font-semibold text-income hover:bg-income/25">
                {owedByMe ? "Am înapoiat tot" : "Mi-a înapoiat tot"}
              </button>
            </form>
            <form action={deleteDebtAction}>
              <input type="hidden" name="id" value={debt.id} />
              <button type="submit" className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-expense hover:bg-background">
                Șterge
              </button>
            </form>
          </div>
        </div>
      )}
    </li>
  );
}

function AddDebt() {
  const [state, formAction, pending] = useActionState<DebtActionState, FormData>(
    createDebtAction,
    undefined,
  );
  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-muted">Datorie nouă</h2>
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1 text-sm">
        {(
          [
            ["borrowed", "Datorez eu"],
            ["lent", "Mi se datorează"],
          ] as const
        ).map(([value, label], i) => (
          <label
            key={value}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded py-1 text-xs font-medium has-[:checked]:bg-primary has-[:checked]:text-white"
          >
            <input type="radio" name="direction" value={value} defaultChecked={i === 0} className="sr-only" />
            {label}
          </label>
        ))}
      </div>
      <input
        name="person"
        type="text"
        required
        maxLength={80}
        placeholder="Persoana (ex: Andrei)"
        className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="amount"
          type="text"
          inputMode="decimal"
          required
          placeholder="Sumă (RON)"
          className="rounded-lg border border-border bg-surface px-3 py-2 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <input
          name="borrowed_date"
          type="date"
          aria-label="Data (opțional)"
          className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>
      <input
        name="note"
        type="text"
        maxLength={200}
        placeholder="Notă (opțional)"
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
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
        {pending ? "Se salvează…" : "Adaugă datorie"}
      </button>
    </form>
  );
}

export function DebtsManager({ debts }: { debts: DebtItem[] }) {
  const active = debts.filter((d) => !d.is_settled);
  const settled = debts.filter((d) => d.is_settled);
  const owedByMe = active
    .filter((d) => d.direction === "borrowed")
    .reduce((s, d) => s + d.remaining, 0);
  const owedToMe = active
    .filter((d) => d.direction === "lent")
    .reduce((s, d) => s + d.remaining, 0);

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Sumar */}
      {active.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border bg-surface p-3 text-center">
            <p className="text-xs font-medium text-muted">Datorez</p>
            <p className="mt-1 font-bold tabular-nums text-expense">{ron.format(owedByMe)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-3 text-center">
            <p className="text-xs font-medium text-muted">Mi se datorează</p>
            <p className="mt-1 font-bold tabular-nums text-income">{ron.format(owedToMe)}</p>
          </div>
        </div>
      ) : null}

      <AddDebt />

      {debts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
          Nicio datorie încă. Adaugă banii împrumutați de la cineva și marchează manual când i-ai
          înapoiat.
        </p>
      ) : (
        <>
          {active.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {active.map((d) => (
                <DebtCard key={d.id} debt={d} />
              ))}
            </ul>
          ) : null}
          {settled.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Închise
              </h2>
              <ul className="flex flex-col gap-3">
                {settled.map((d) => (
                  <DebtCard key={d.id} debt={d} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
