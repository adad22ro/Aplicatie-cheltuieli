import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentMembership, getCurrentUser } from "@/lib/auth/current-user";
import { isAdminEmail } from "@/lib/auth/admin";
import { signOutAction } from "@/lib/actions/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMonthlySummary } from "@/lib/data/dashboard";
import { listTransactions } from "@/lib/data/transactions";
import { TransactionsList } from "@/components/transactions/TransactionsList";
import {
  normalizeMonth,
  prevMonth,
  nextMonth,
  monthLabel,
  isCurrentOrFuture,
} from "@/lib/utils/month";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 2,
});

/** Dashboard lunar cu carry-over (UI.md §3.3, PLAN pasul 6). */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const [{ month: monthParam }, user, membership] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getCurrentMembership(),
  ]);

  if (!membership) redirect("/onboarding");

  // Generează „lazy" tranzacțiile scadente (idempotent) la deschiderea app-ului:
  // recurențe + rate din planuri de rate.
  const supabase = await createServerSupabaseClient();
  await Promise.all([
    supabase.rpc("generate_due_recurring"),
    supabase.rpc("generate_due_installments"),
  ]);

  const household = Array.isArray(membership.households)
    ? membership.households[0]
    : membership.households;

  const month = normalizeMonth(monthParam);
  const [summary, recent] = await Promise.all([
    getMonthlySummary(month),
    listTransactions({ month }, 20),
  ]);

  const atCurrent = isCurrentOrFuture(month);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">Gospodărie</p>
          <h1 className="text-2xl font-bold">{household?.name ?? "—"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdminEmail(user?.email) ? (
            <Link
              href="/admin"
              className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-background"
            >
              ⚙️
            </Link>
          ) : null}
          <Link
            href="/settings"
            className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-background"
          >
            Setări
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-background"
            >
              Ieși
            </button>
          </form>
        </div>
      </header>

      {/* Selector de lună */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-2">
        <Link
          href={`/?month=${prevMonth(month)}`}
          aria-label="Luna anterioară"
          className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ←
        </Link>
        <span className="font-semibold capitalize">{monthLabel(month)}</span>
        {atCurrent ? (
          <span aria-hidden className="px-3 py-1.5 text-sm text-muted opacity-40">
            →
          </span>
        ) : (
          <Link
            href={`/?month=${nextMonth(month)}`}
            aria-label="Luna următoare"
            className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-background"
          >
            →
          </Link>
        )}
      </div>

      {/* Carduri sumar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-muted">Venituri</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-income">
            {ron.format(summary.income)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-muted">Cheltuieli</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-expense">
            {ron.format(summary.expense)}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-muted">Sold la finalul lunii</p>
            <p
              className={`text-2xl font-bold tabular-nums ${
                summary.balance < 0 ? "text-expense" : "text-foreground"
              }`}
            >
              {ron.format(summary.balance)}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted">
            Report din lunile anterioare: {ron.format(summary.carryOver)} · flux lună:{" "}
            <span className={summary.net < 0 ? "text-expense" : "text-income"}>
              {summary.net >= 0 ? "+" : ""}
              {ron.format(summary.net)}
            </span>
          </p>
        </div>
      </div>

      {/* Navigare rapidă */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/recurring"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm font-medium shadow-sm transition-colors hover:bg-background"
        >
          <span>🔁 Recurențe</span>
          <span aria-hidden className="text-muted">→</span>
        </Link>
        <Link
          href="/installments"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm font-medium shadow-sm transition-colors hover:bg-background"
        >
          <span>💳 Rate</span>
          <span aria-hidden className="text-muted">→</span>
        </Link>
        <Link
          href="/budgets"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm font-medium shadow-sm transition-colors hover:bg-background"
        >
          <span>🎯 Bugete</span>
          <span aria-hidden className="text-muted">→</span>
        </Link>
        <Link
          href="/reports"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm font-medium shadow-sm transition-colors hover:bg-background"
        >
          <span>📊 Grafice</span>
          <span aria-hidden className="text-muted">→</span>
        </Link>
        <Link
          href="/savings"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm font-medium shadow-sm transition-colors hover:bg-background"
        >
          <span>🐷 Obiective</span>
          <span aria-hidden className="text-muted">→</span>
        </Link>
      </div>

      {/* Tranzacții recente ale lunii */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Tranzacții</h2>
          <Link href="/transactions" className="text-sm font-medium text-primary">
            Vezi toate →
          </Link>
        </div>
        <TransactionsList
          items={recent}
          currentUserId={user?.id ?? ""}
          currentUserEmail={user?.email ?? ""}
        />
      </section>

      <Link
        href="/transactions/new"
        className="fixed bottom-6 right-1/2 z-40 translate-x-[min(13rem,50vw-1.5rem)] rounded-full bg-primary px-5 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-primary-hover"
      >
        + Adaugă
      </Link>
    </main>
  );
}
