import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listCategories, listPaymentMethods } from "@/lib/data/settings";
import { getTransaction } from "@/lib/data/transactions";
import { TransactionForm } from "@/components/transactions/TransactionForm";

/** Editează tranzacție (UI.md §3.5). */
export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const [tx, categories, methods] = await Promise.all([
    getTransaction(id),
    listCategories(),
    listPaymentMethods(),
  ]);
  if (!tx) redirect("/transactions");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/transactions"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Tranzacții
        </Link>
        <h1 className="text-2xl font-bold">Editează tranzacția</h1>
      </header>

      <TransactionForm
        mode="edit"
        categories={categories}
        methods={methods}
        initial={tx}
      />
    </main>
  );
}
