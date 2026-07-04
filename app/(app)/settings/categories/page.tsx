import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listCategories } from "@/lib/data/settings";
import { CategoryManager } from "@/components/settings/CategoryManager";

/** CRUD categorii (income/expense, icon + culoare). UI.md §3.6. */
export default async function CategoriesPage() {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const categories = await listCategories();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/settings"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Setări
        </Link>
        <h1 className="text-2xl font-bold">Categorii</h1>
      </header>

      <CategoryManager categories={categories} />
    </main>
  );
}
