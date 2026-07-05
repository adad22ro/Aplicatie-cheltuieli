import { createAdminClient } from "@/lib/supabase/admin";
import {
  getRlsStatus,
  getIntegrityChecks,
  getConfigOverview,
} from "@/lib/data/security";

const TABLES = [
  "households",
  "household_members",
  "categories",
  "payment_methods",
  "transactions",
  "recurring_transactions",
  "installment_plans",
  "budgets",
  "savings_goals",
  "signup_codes",
  "admin_audit",
];

export default async function AdminDebugPage() {
  const admin = createAdminClient();

  const counts = await Promise.all(
    TABLES.map(async (t) => {
      const { count, error } = await admin
        .from(t)
        .select("*", { count: "exact", head: true });
      return { table: t, count: error ? `EROARE: ${error.message}` : String(count ?? 0) };
    }),
  );

  const { data: usersRes } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const { data: audit } = await admin
    .from("admin_audit")
    .select("action, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const [rls, integrity, config] = await Promise.all([
    getRlsStatus(),
    getIntegrityChecks(),
    Promise.resolve(getConfigOverview()),
  ]);
  const rlsProblems = rls.filter((r) => !r.rls_enabled || r.policy_count === 0);
  const integrityRows: { label: string; value: number; bad: boolean }[] = [
    { label: "Useri fără gospodărie", value: integrity.usersWithoutHousehold, bad: integrity.usersWithoutHousehold > 0 },
    { label: "Membri orfani (gospodărie ștearsă)", value: integrity.orphanMembers, bad: integrity.orphanMembers > 0 },
    { label: "Coduri expirate nefolosite", value: integrity.expiredUnusedCodes, bad: false },
    { label: "Tranzacții șterse (soft-delete)", value: integrity.transactionsSoftDeleted, bad: false },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Verificator acoperire RLS */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Acoperire RLS</h2>
        {rls.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
            Nu am putut citi starea RLS (rulează migrarea de securitate).
          </p>
        ) : rlsProblems.length === 0 ? (
          <p className="rounded-lg border border-income/40 bg-income/5 px-3 py-2 text-sm font-medium text-income">
            ✅ Toate cele {rls.length} tabele au RLS activ și cel puțin o politică.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <p className="rounded-lg border border-expense/40 bg-expense/5 px-3 py-2 text-sm font-medium text-expense">
              ⚠️ {rlsProblems.length} tabel(e) fără RLS sau fără politici:
            </p>
            <ul className="flex flex-col gap-1">
              {rlsProblems.map((r) => (
                <li
                  key={r.table_name}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs">{r.table_name}</span>
                  <span className="text-xs text-expense">
                    {!r.rls_enabled ? "RLS dezactivat" : "0 politici"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Integritate date */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Integritate date</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {integrityRows.map((r) => (
                <tr key={r.label} className="border-b border-border last:border-0 bg-surface">
                  <td className="px-3 py-2">{r.label}</td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums font-semibold ${
                      r.bad && r.value > 0 ? "text-expense" : "text-foreground"
                    }`}
                  >
                    {r.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Config / env */}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Configurare (env)</h2>
        <ul className="flex flex-col gap-1.5">
          {config.map((c) => (
            <li
              key={c.key}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="font-mono text-xs">{c.key}</span>
                {c.hint ? <span className="ml-2 text-xs text-muted">{c.hint}</span> : null}
              </span>
              <span className={c.present ? "text-income" : "text-expense"}>
                {c.present ? "✅ setat" : "✗ lipsă"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Snapshot bază de date</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border bg-surface">
                <td className="px-3 py-2 font-medium">auth.users</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {usersRes?.users?.length ?? 0}
                </td>
              </tr>
              {counts.map((c) => (
                <tr key={c.table} className="border-b border-border last:border-0 bg-surface">
                  <td className="px-3 py-2 font-mono text-xs">{c.table}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Jurnal acțiuni admin (ultimele 10)</h2>
        {audit && audit.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {audit.map((a, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs">{a.action}</span>
                <span className="shrink-0 text-xs text-muted">
                  {new Date(a.created_at as string).toLocaleString("ro-RO")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nicio acțiune încă.</p>
        )}
      </section>
    </div>
  );
}
