import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { listBudgetsWithProgress } from "@/lib/data/budgets";
import { listCategories } from "@/lib/data/settings";
import { BudgetManager } from "@/components/budgets/BudgetManager";
import { monthLabel, currentMonth } from "@/lib/utils/month";

/** Bugete pe categorie cu progres lunar (UI.md §4.4). */
export default async function BudgetsPage() {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const [budgets, categories] = await Promise.all([
    listBudgetsWithProgress(),
    listCategories(),
  ]);
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold">Bugete</h1>
      </header>

      <p className="text-sm text-muted">
        Limite lunare pe categorii de cheltuială. Progresul e pentru luna curentă (
        <span className="capitalize">{monthLabel(currentMonth())}</span>).
      </p>

      <BudgetManager budgets={budgets} expenseCategories={expenseCategories} />
    </main>
  );
}
