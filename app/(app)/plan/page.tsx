import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentMembership } from "@/lib/auth/current-user";
import { getPlanView } from "@/lib/data/plan";
import { listCategories } from "@/lib/data/settings";
import { listTemplates } from "@/lib/data/templates";
import { ensurePlanAction } from "@/lib/actions/plan";
import { applyTemplateAction } from "@/lib/actions/templates";
import { PlanEditor } from "@/components/plan/PlanEditor";
import {
  normalizeMonth,
  prevMonth,
  nextMonth,
  monthLabel,
} from "@/lib/utils/month";

/** Plan lunar: alocare venit (luna curentă) + planificare (luna viitoare). */
export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const [{ month: monthParam }, membership] = await Promise.all([
    searchParams,
    getCurrentMembership(),
  ]);
  if (!membership) redirect("/onboarding");

  const month = normalizeMonth(monthParam);
  const [plan, categories, templates] = await Promise.all([
    getPlanView(month),
    listCategories(),
    listTemplates(),
  ]);

  // Semnătură pt. remontarea editorului când se adaugă/șterg rânduri (nu la editarea sumei).
  const signature = [
    plan.planId,
    plan.incomes.map((i) => i.id).join(","),
    plan.allocations.map((a) => a.id).join(","),
  ].join("|");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Plan lunar</p>
          <h1 className="text-2xl font-bold">Alocare & planificare</h1>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-background"
        >
          ← Acasă
        </Link>
      </header>

      {/* Selector de lună (planificarea permite și lunile viitoare) */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-2">
        <Link
          href={`/plan?month=${prevMonth(month)}`}
          aria-label="Luna anterioară"
          className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ←
        </Link>
        <span className="font-semibold capitalize">{monthLabel(month)}</span>
        <Link
          href={`/plan?month=${nextMonth(month)}`}
          aria-label="Luna următoare"
          className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          →
        </Link>
      </div>

      {/* Aplică șablon de alocare */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2">
        {templates.length > 0 ? (
          <form action={applyTemplateAction} className="flex flex-1 items-center gap-2">
            <input type="hidden" name="month" value={month} />
            <select
              name="template_id"
              required
              defaultValue=""
              aria-label="Alege șablon"
              className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="" disabled>
                Aplică un șablon…
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Aplică
            </button>
          </form>
        ) : (
          <span className="flex-1 text-sm text-muted">Niciun șablon salvat.</span>
        )}
        <Link
          href="/plan/templates"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          Șabloane
        </Link>
      </div>

      {plan.planId === null ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted">
            Nu există încă un plan pentru <span className="capitalize">{monthLabel(month)}</span>.
            Îl creăm precompletat cu recurențele tale active.
          </p>
          <form action={ensurePlanAction}>
            <input type="hidden" name="month" value={month} />
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-hover"
            >
              Creează plan
            </button>
          </form>
        </div>
      ) : (
        <PlanEditor
          key={signature}
          month={month}
          incomes={plan.incomes}
          allocations={plan.allocations}
          categories={categories}
          rollover={plan.totals.rollover}
          contributions={plan.contributions}
        />
      )}
    </main>
  );
}
