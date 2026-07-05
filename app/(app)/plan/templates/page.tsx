import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentMembership } from "@/lib/auth/current-user";
import { listTemplates } from "@/lib/data/templates";
import { listCategories } from "@/lib/data/settings";
import { TemplatesManager } from "@/components/plan/TemplatesManager";

/** Gestiune șabloane de alocare (reguli reutilizabile pentru plan). */
export default async function TemplatesPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/onboarding");

  const [templates, categories] = await Promise.all([listTemplates(), listCategories()]);
  const expenseCats = categories.filter((c) => c.type === "expense");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Plan lunar</p>
          <h1 className="text-2xl font-bold">Șabloane de alocare</h1>
        </div>
        <Link
          href="/plan"
          className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-background"
        >
          ← Plan
        </Link>
      </header>

      <p className="text-sm text-muted">
        Un șablon reține cum împarți banii (ex: 15% economii, 1200 chirie). Îl aplici pe orice
        lună dintr-un click, ca să nu recompletezi de fiecare dată.
      </p>

      <TemplatesManager templates={templates} expenseCats={expenseCats} />
    </main>
  );
}
