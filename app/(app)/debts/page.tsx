import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listDebts } from "@/lib/data/debts";
import { DebtsManager } from "@/components/debts/DebtsManager";

/** Datorii — bani împrumutați de la / către persoane, cu marcaj manual al restituirilor. */
export default async function DebtsPage() {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const debts = await listDebts();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold">Datorii</h1>
      </header>

      <p className="text-sm text-muted">
        Bani împrumutați de la sau către alte persoane. Fiecare mișcare (împrumut și restituire)
        intră automat în soldul lunii ca venit sau cheltuială, pe categoria „Datorii".
      </p>

      <DebtsManager debts={debts} />
    </main>
  );
}
