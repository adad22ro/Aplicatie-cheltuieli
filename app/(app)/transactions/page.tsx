import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId, getCurrentUser } from "@/lib/auth/current-user";
import { listTransactions } from "@/lib/data/transactions";
import { TransactionsList } from "@/components/transactions/TransactionsList";

/** Listă tranzacții (UI.md §3.4). Filtrarea pe lună + sumar vin la pasul 6. */
export default async function TransactionsPage() {
  const [householdId, user] = await Promise.all([
    getActiveHouseholdId(),
    getCurrentUser(),
  ]);
  if (!user) redirect("/login");
  if (!householdId) redirect("/onboarding");

  const items = await listTransactions();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold">Tranzacții</h1>
      </header>

      <TransactionsList
        items={items}
        currentUserId={user.id}
        currentUserEmail={user.email ?? ""}
      />

      <Link
        href="/transactions/new"
        className="fixed bottom-6 right-1/2 z-40 translate-x-[min(13rem,50vw-1.5rem)] rounded-full bg-primary px-5 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-primary-hover"
      >
        + Adaugă
      </Link>
    </main>
  );
}
