import Link from "next/link";

import { getAdminStats } from "@/lib/data/admin";

const ron = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  maximumFractionDigits: 0,
});

function Stat({ label, value, tone }: { label: string; value: string; tone?: "income" | "expense" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={`mt-1 text-xl font-bold tabular-nums ${
          tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function AdminHome() {
  const stats = await getAdminStats();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Utilizatori" value={String(stats.users)} />
        <Stat label="Gospodării" value={String(stats.households)} />
        <Stat label="Tranzacții" value={String(stats.transactions)} />
        <Stat label="Venituri totale" value={ron.format(stats.totalIncome)} tone="income" />
        <Stat label="Cheltuieli totale" value={ron.format(stats.totalExpense)} tone="expense" />
        <Stat label="Coduri active" value={String(stats.activeCodes)} />
      </div>

      <Link
        href="/admin/codes"
        className="rounded-2xl bg-primary p-4 text-center font-semibold text-white hover:bg-primary-hover"
      >
        + Generează cod de invitație
      </Link>
    </div>
  );
}
