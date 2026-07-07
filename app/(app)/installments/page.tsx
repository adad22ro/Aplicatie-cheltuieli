import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listInstallments } from "@/lib/data/installments";
import { InstallmentList } from "@/components/installments/InstallmentList";

/** Rate / angajamente (UI.md §4.3). */
export default async function InstallmentsPage() {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const items = await listInstallments();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold">Rate</h1>
      </header>

      <p className="text-sm text-muted">
        Angajamente cu un total finit (telefon, electrocasnice). Se generează o rată pe
        lună până la achitare, apoi se închid automat.
      </p>

      <InstallmentList items={items} />

      <Link
        href="/installments/new"
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-1/2 z-40 translate-x-[min(13rem,50vw-1.5rem)] rounded-full bg-primary px-5 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-primary-hover"
      >
        + Adaugă
      </Link>
    </main>
  );
}
