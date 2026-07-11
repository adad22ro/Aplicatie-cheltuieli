import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentMembership, getCurrentUser } from "@/lib/auth/current-user";
import { isAdminEmail } from "@/lib/auth/admin";
import { getMonthlySummary, getMonthDigest } from "@/lib/data/dashboard";
import { listTransactions } from "@/lib/data/transactions";
import { getWeeklyBreakdown } from "@/lib/data/weekly";
import { authorMap } from "@/lib/data/profiles";
import { TransactionsList } from "@/components/transactions/TransactionsList";
import { WeeklyView } from "@/components/WeeklyView";
import { InstallButton } from "@/components/InstallButton";
import { GenerateDueOnLoad } from "@/components/GenerateDueOnLoad";
import { DueVariable } from "@/components/DueVariable";
import { listDueVariable } from "@/lib/data/variable-due";
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
  searchParams: Promise<{ month?: string; view?: string }>;
}) {
  const [{ month: monthParam, view: viewParam }, user, membership] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getCurrentMembership(),
  ]);
  const weekly = viewParam === "weekly";

  if (!membership) redirect("/onboarding");

  const household = Array.isArray(membership.households)
    ? membership.households[0]
    : membership.households;

  const month = normalizeMonth(monthParam);
  const [summary, recent, authors, weeks] = await Promise.all([
    getMonthlySummary(month),
    weekly ? Promise.resolve([]) : listTransactions({ month }, 20),
    authorMap(),
    weekly ? getWeeklyBreakdown(month) : Promise.resolve([]),
  ]);
  const digest = await getMonthDigest(month, summary);
  const dueVariable = digest.isCurrentMonth ? await listDueVariable() : [];

  const atCurrent = isCurrentOrFuture(month);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <GenerateDueOnLoad />

      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">Gospodărie</p>
          <h1 className="text-2xl font-bold">{household?.name ?? "—"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdminEmail(user?.email) ? (
            <Link
              href="/admin"
              aria-label="Administrare"
              className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-background"
            >
              ⚙️
            </Link>
          ) : null}
          <Link
            href="/help"
            aria-label="Ghid de utilizare"
            className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-background"
          >
            Ghid
          </Link>
        </div>
      </header>

      {/* Selector de lună */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-2">
        <Link
          href={`/?month=${prevMonth(month)}${weekly ? "&view=weekly" : ""}`}
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
            href={`/?month=${nextMonth(month)}${weekly ? "&view=weekly" : ""}`}
            aria-label="Luna următoare"
            className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-background"
          >
            →
          </Link>
        )}
      </div>

      {/* Buton instalare PWA (se ascunde dacă e deja instalată) */}
      <InstallButton />

      {/* Toggle lunar / săptămânal */}
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1 text-sm">
        <Link
          href={`/?month=${month}`}
          className={`rounded-lg py-1.5 text-center font-medium ${
            weekly ? "text-muted hover:bg-background" : "bg-primary text-white"
          }`}
        >
          Lunar
        </Link>
        <Link
          href={`/?month=${month}&view=weekly`}
          className={`rounded-lg py-1.5 text-center font-medium ${
            weekly ? "bg-primary text-white" : "text-muted hover:bg-background"
          }`}
        >
          Săptămânal
        </Link>
      </div>

      {/* Carduri sumar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="tint-income rounded-2xl border p-4">
          <p className="text-xs font-semibold text-income/80">Venituri</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-income">
            {ron.format(summary.income)}
          </p>
        </div>
        <div className="tint-expense rounded-2xl border p-4">
          <p className="text-xs font-semibold text-expense/80">Cheltuieli</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-expense">
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

      {/* Digest luna curentă — pe scurt: ce a intrat, ce mai ai de plătit, sold */}
      {digest.isCurrentMonth ? (
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm leading-relaxed">
            Ți-au intrat{" "}
            <span className="font-semibold tabular-nums text-income">
              {ron.format(digest.income)}
            </span>{" "}
            luna asta.{" "}
            {digest.upcomingCount > 0 ? (
              <>
                Mai ai{" "}
                <span className="font-semibold tabular-nums text-expense">
                  {ron.format(digest.upcomingAmount)}
                </span>{" "}
                de plătit ({digest.upcomingCount}{" "}
                {digest.upcomingCount === 1 ? "recurență/rată" : "recurențe/rate"}) până la
                finalul lunii.
              </>
            ) : (
              <>Nu mai ai recurențe sau rate scadente luna asta. ✅</>
            )}{" "}
            Sold curent:{" "}
            <span
              className={`font-semibold tabular-nums ${
                digest.balance < 0 ? "text-expense" : "text-foreground"
              }`}
            >
              {ron.format(digest.balance)}
            </span>
            .
          </p>
        </div>
      ) : null}

      {/* Reamintire: plăți scadente în următoarele 7 zile */}
      {digest.isCurrentMonth && digest.weekCount > 0 ? (
        <div className="tint-warning flex items-center gap-3 rounded-2xl border p-4">
          <span aria-hidden className="text-2xl">⏰</span>
          <p className="text-sm">
            Săptămâna asta mai ai de plătit{" "}
            <span className="font-bold tabular-nums text-foreground">
              {ron.format(digest.weekAmount)}
            </span>{" "}
            ({digest.weekCount} {digest.weekCount === 1 ? "plată" : "plăți"} din
            recurențe/rate).
          </p>
        </div>
      ) : null}

      {/* De completat: facturi/rate cu sumă variabilă ajunse la scadență */}
      <DueVariable items={dueVariable} />

      {/* Scurtături — rând compact de pastile scrollabile (varianta 1a) */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { href: "/plan", icon: "🗓️", label: "Plan", tint: "tint-primary" },
          { href: "/recurring", icon: "🔁", label: "Recurențe", tint: "tint-accent" },
          { href: "/installments", icon: "💳", label: "Rate", tint: "tint-warning" },
          { href: "/reports", icon: "📊", label: "Grafice", tint: "tint-income" },
          { href: "/savings", icon: "🐷", label: "Obiective", tint: "tint-expense" },
          { href: "/debts", icon: "🤝", label: "Datorii", tint: "tint-accent" },
        ].map(({ href, icon, label, tint }) => (
          <Link
            key={href}
            href={href}
            className={`${tint} flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-transform active:scale-95`}
          >
            <span aria-hidden>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Tranzacții — vizualizare lunară sau săptămânală */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{weekly ? "Pe săptămâni" : "Tranzacții"}</h2>
          <Link href="/transactions" className="text-sm font-medium text-primary">
            Vezi toate →
          </Link>
        </div>
        {weekly ? (
          <WeeklyView
            weeks={weeks}
            currentUserId={user?.id ?? ""}
            authors={authors}
          />
        ) : (
          <TransactionsList
            items={recent}
            currentUserId={user?.id ?? ""}
            authors={authors}
          />
        )}
      </section>
    </main>
  );
}
