import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listCategories, listPaymentMethods } from "@/lib/data/settings";
import { InstallmentForm } from "@/components/installments/InstallmentForm";

export default async function NewInstallmentPage() {
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
          href="/installments"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Rate
        </Link>
        <h1 className="text-2xl font-bold">Angajament nou</h1>
      </header>

      <InstallmentForm mode="create" categories={categories} methods={methods} />
    </main>
  );
}
