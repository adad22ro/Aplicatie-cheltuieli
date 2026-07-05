import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listSavings } from "@/lib/data/savings";
import { SavingsManager } from "@/components/savings/SavingsManager";

/** Obiective de economisire (UI.md §4.6). */
export default async function SavingsPage() {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const goals = await listSavings();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold">Obiective</h1>
      </header>

      <p className="text-sm text-muted">
        Ținte de economisire (vacanță, fond de urgență). Adaugă sau scoate bani și urmărește
        progresul.
      </p>

      <SavingsManager goals={goals} />
    </main>
  );
}
