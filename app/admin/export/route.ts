import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

/** Escape CSV: pune între ghilimele și dublează ghilimelele interne. */
function csv(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function one(v: { name: string } | { name: string }[] | null): string {
  if (!v) return "—";
  return Array.isArray(v) ? (v[0]?.name ?? "—") : v.name;
}

/** Export CSV al tuturor tranzacțiilor (toate gospodăriile). Doar admin. */
export async function GET() {
  await requireAdmin();

  const admin = createAdminClient();
  const { data } = await admin
    .from("transactions")
    .select("date, amount, type, source, note, created_at, households(name), categories(name)")
    .is("deleted_at", null)
    .order("date", { ascending: false });

  const header = ["Data", "Gospodărie", "Tip", "Categorie", "Sumă", "Sursă", "Notă", "Creat la"];
  const rows = (data ?? []).map((r: Record<string, unknown>) =>
    [
      r.date,
      one(r.households as { name: string } | { name: string }[] | null),
      r.type === "income" ? "venit" : "cheltuială",
      one(r.categories as { name: string } | { name: string }[] | null),
      typeof r.amount === "string" ? r.amount : String(r.amount),
      r.source,
      r.note ?? "",
      r.created_at,
    ]
      .map(csv)
      .join(","),
  );

  // BOM pentru diacritice corecte în Excel.
  const body = "﻿" + [header.map(csv).join(","), ...rows].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tranzactii-${stamp}.csv"`,
    },
  });
}
