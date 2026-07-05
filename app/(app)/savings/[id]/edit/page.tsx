import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";
import { getGoal } from "@/lib/data/savings";
import { GoalForm } from "@/components/savings/GoalForm";

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const goal = await getGoal(id);
  if (!goal) redirect("/savings");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/savings"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Obiective
        </Link>
        <h1 className="text-2xl font-bold">Editează obiectivul</h1>
      </header>

      <GoalForm initial={goal} />
    </main>
  );
}
