import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listCategories, listPaymentMethods } from "@/lib/data/settings";
import { getRecurring } from "@/lib/data/recurring";
import { RecurringForm } from "@/components/recurring/RecurringForm";

export default async function EditRecurringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const [rec, categories, methods] = await Promise.all([
    getRecurring(id),
    listCategories(),
    listPaymentMethods(),
  ]);
  if (!rec) redirect("/recurring");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/recurring"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Recurențe
        </Link>
        <h1 className="text-2xl font-bold">Editează recurența</h1>
      </header>

      <RecurringForm mode="edit" categories={categories} methods={methods} initial={rec} />
    </main>
  );
}
