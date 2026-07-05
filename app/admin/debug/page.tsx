import { createAdminClient } from "@/lib/supabase/admin";

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

  return (
    <div className="flex flex-col gap-6">
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
