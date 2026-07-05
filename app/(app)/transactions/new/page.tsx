import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listCategories, listPaymentMethods } from "@/lib/data/settings";
import { frequentTransactions } from "@/lib/data/transactions";
import {
  TransactionForm,
  type TransactionPrefill,
} from "@/components/transactions/TransactionForm";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

/** Adaugă tranzacție (UI.md §3.5) — ecranul cel mai folosit. */
export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{
    amount?: string;
    type?: string;
    category?: string;
    note?: string;
  }>;
}) {
  const [sp, householdId] = await Promise.all([searchParams, getActiveHouseholdId()]);
  if (!householdId) redirect("/onboarding");

  const [categories, methods, suggestions] = await Promise.all([
    listCategories(),
    listPaymentMethods(),
    frequentTransactions(6),
  ]);

  const prefill: TransactionPrefill = {
    amount: sp.amount,
    type: sp.type === "income" || sp.type === "expense" ? sp.type : undefined,
    category_id: sp.category,
    note: sp.note,
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/transactions"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Tranzacții
        </Link>
        <h1 className="text-2xl font-bold">Tranzacție nouă</h1>
      </header>

      {/* Adăugare rapidă — „la fel ca data trecută" */}
      {suggestions.length > 0 ? (
        <section className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted">Adaugă rapid</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => {
              const params = new URLSearchParams({
                amount: String(s.amount),
                type: s.type,
                category: s.category_id,
              });
              if (s.note) params.set("note", s.note);
              return (
                <Link
                  key={i}
                  href={`/transactions/new?${params.toString()}`}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:bg-background"
                >
                  <span>{s.icon ?? (s.type === "income" ? "➕" : "🧾")}</span>
                  <span className="max-w-[9rem] truncate">{s.note ?? s.category_name}</span>
                  <span className={`font-semibold tabular-nums ${s.type === "income" ? "text-income" : "text-expense"}`}>
                    {ron.format(s.amount)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <TransactionForm
        mode="create"
        categories={categories}
        methods={methods}
        prefill={prefill}
      />
    </main>
  );
}
