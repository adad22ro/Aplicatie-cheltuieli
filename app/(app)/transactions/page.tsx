import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId, getCurrentUser } from "@/lib/auth/current-user";
import { listCategories, listPaymentMethods } from "@/lib/data/settings";
import { listTransactions, type TransactionFilters } from "@/lib/data/transactions";
import { listMemberProfiles, authorMap } from "@/lib/data/profiles";
import { TransactionsList } from "@/components/transactions/TransactionsList";
import { monthLabel, currentMonth, prevMonth } from "@/lib/utils/month";

/** Ultimele 12 luni ca opțiuni de filtru. */
function recentMonths(): string[] {
  const out: string[] = [];
  let m = currentMonth();
  for (let i = 0; i < 12; i++) {
    out.push(m);
    m = prevMonth(m);
  }
  return out;
}

/** Listă tranzacții cu filtrări (UI.md §3.4). */
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    type?: string;
    category?: string;
    method?: string;
    person?: string;
    q?: string;
  }>;
}) {
  const [sp, householdId, user] = await Promise.all([
    searchParams,
    getActiveHouseholdId(),
    getCurrentUser(),
  ]);
  if (!user) redirect("/login");
  if (!householdId) redirect("/onboarding");

  const filters: TransactionFilters = {
    month: sp.month || undefined,
    type: sp.type === "income" || sp.type === "expense" ? sp.type : undefined,
    categoryId: sp.category || undefined,
    paymentMethodId: sp.method || undefined,
    userId: sp.person || undefined,
    search: sp.q || undefined,
  };
  const hasFilters = Boolean(
    sp.month || sp.type || sp.category || sp.method || sp.person || sp.q,
  );

  const [items, categories, methods, members, authors] = await Promise.all([
    listTransactions(filters),
    listCategories(),
    listPaymentMethods(),
    listMemberProfiles(),
    authorMap(),
  ]);

  const selectCls =
    "rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold">Tranzacții</h1>
      </header>

      {/* Filtre — form GET nativ */}
      <form method="GET" className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
        <input
          name="q"
          type="search"
          defaultValue={sp.q ?? ""}
          placeholder="Caută în notă sau după sumă…"
          aria-label="Caută"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <div className="grid grid-cols-2 gap-2">
          <select name="month" defaultValue={sp.month ?? ""} aria-label="Lună" className={selectCls}>
            <option value="">Toate lunile</option>
            {recentMonths().map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
          <select name="type" defaultValue={sp.type ?? ""} aria-label="Tip" className={selectCls}>
            <option value="">Venit + cheltuială</option>
            <option value="expense">Doar cheltuieli</option>
            <option value="income">Doar venituri</option>
          </select>
          <select name="category" defaultValue={sp.category ?? ""} aria-label="Categorie" className={selectCls}>
            <option value="">Toate categoriile</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
          <select name="method" defaultValue={sp.method ?? ""} aria-label="Metodă" className={selectCls}>
            <option value="">Toate metodele</option>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {members.length > 1 ? (
            <select name="person" defaultValue={sp.person ?? ""} aria-label="Persoană" className={`${selectCls} col-span-2`}>
              <option value="">Toți membrii</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name ?? "Membru"}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Filtrează
          </button>
          {hasFilters ? (
            <Link
              href="/transactions"
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
            >
              Resetează
            </Link>
          ) : null}
        </div>
      </form>

      <TransactionsList items={items} currentUserId={user.id} authors={authors} />
    </main>
  );
}
