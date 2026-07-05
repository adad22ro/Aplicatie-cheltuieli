import { recentTransactionsAll, listAllUsers } from "@/lib/data/admin";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

export default async function AdminActivityPage() {
  const [txs, users] = await Promise.all([recentTransactionsAll(25), listAllUsers()]);
  const recentUsers = [...users]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Înregistrări recente</h2>
        <ul className="flex flex-col gap-1.5">
          {recentUsers.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate">{u.email ?? u.id}</span>
              <span className="shrink-0 text-xs text-muted">
                {new Date(u.created_at).toLocaleDateString("ro-RO")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Ultimele tranzacții (toate gospodăriile)</h2>
        <ul className="flex flex-col gap-1.5">
          {txs.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="min-w-0 truncate">
                <span className="text-muted">{t.household}</span> · {t.category}
              </span>
              <span
                className={`shrink-0 tabular-nums font-medium ${
                  t.type === "income" ? "text-income" : "text-expense"
                }`}
              >
                {t.type === "income" ? "+" : "−"}
                {ron.format(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
