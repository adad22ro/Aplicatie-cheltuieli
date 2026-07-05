import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listRecurring } from "@/lib/data/recurring";
import { RecurringList } from "@/components/recurring/RecurringList";

/** Recurențe (UI.md §4.2). */
export default async function RecurringPage() {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const items = await listRecurring();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold">Recurențe</h1>
      </header>

      <p className="text-sm text-muted">
        Venituri și cheltuieli care se repetă lunar (chirie, salariu, abonamente). Se
        generează automat în ziua stabilită.
      </p>

      <RecurringList items={items} />

      <Link
        href="/recurring/new"
        className="fixed bottom-6 right-1/2 z-40 translate-x-[min(13rem,50vw-1.5rem)] rounded-full bg-primary px-5 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-primary-hover"
      >
        + Adaugă
      </Link>
    </main>
  );
}
