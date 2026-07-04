import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listCategories, listPaymentMethods } from "@/lib/data/settings";
import { TransactionForm } from "@/components/transactions/TransactionForm";

/** Adaugă tranzacție (UI.md §3.5) — ecranul cel mai folosit. */
export default async function NewTransactionPage() {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const [categories, methods] = await Promise.all([
    listCategories(),
    listPaymentMethods(),
  ]);

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

      <TransactionForm mode="create" categories={categories} methods={methods} />
    </main>
  );
}
