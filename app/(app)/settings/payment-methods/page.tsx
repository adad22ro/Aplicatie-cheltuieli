import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listPaymentMethods } from "@/lib/data/settings";
import { PaymentMethodManager } from "@/components/settings/PaymentMethodManager";

/** CRUD metode de plată. UI.md §3.6. */
export default async function PaymentMethodsPage() {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const methods = await listPaymentMethods();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/settings"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Setări
        </Link>
        <h1 className="text-2xl font-bold">Metode de plată</h1>
      </header>

      <PaymentMethodManager methods={methods} />
    </main>
  );
}
