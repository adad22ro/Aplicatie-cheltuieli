import Link from "next/link";

import { requireAdmin } from "@/lib/auth/admin";
import { listHouseholdsDetailed } from "@/lib/data/admin";
import { HouseholdRow } from "@/components/admin/HouseholdRow";

export default async function AdminHouseholdsPage() {
  const [, households] = await Promise.all([requireAdmin(), listHouseholdsDetailed()]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Gospodării ({households.length})</h2>
        <Link
          href="/admin/export"
          prefetch={false}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface"
        >
          ⬇ Export tranzacții (CSV)
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {households.map((h) => (
          <HouseholdRow key={h.id} household={h} />
        ))}
      </ul>
    </div>
  );
}
