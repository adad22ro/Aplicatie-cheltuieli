import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AdminStats = {
  users: number;
  households: number;
  transactions: number;
  totalIncome: number;
  totalExpense: number;
  activeCodes: number;
};

export type SignupCodeRow = {
  id: string;
  code: string;
  label: string | null;
  household_id: string | null;
  household_name: string | null;
  role: string;
  expires_at: string | null;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
  status: "active" | "used" | "expired";
};

export type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null; // suspendat până la data asta (viitor = suspendat activ)
  households: { name: string; role: string }[];
};

function codeStatus(r: { used_at: string | null; expires_at: string | null }) {
  if (r.used_at) return "used" as const;
  if (r.expires_at && new Date(r.expires_at) <= new Date()) return "expired" as const;
  return "active" as const;
}

/** Statistici de ansamblu peste toate gospodăriile (service_role, ocolește RLS). */
export async function getAdminStats(): Promise<AdminStats> {
  const admin = createAdminClient();
  const [usersRes, households, txAgg, codes] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("households").select("*", { count: "exact", head: true }).is("deleted_at", null),
    admin.from("transactions").select("amount, type").is("deleted_at", null),
    admin.from("signup_codes").select("used_at, expires_at"),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of txAgg.data ?? []) {
    const amt = typeof t.amount === "string" ? Number(t.amount) : t.amount;
    if (t.type === "income") totalIncome += amt;
    else totalExpense += amt;
  }
  const activeCodes = (codes.data ?? []).filter((c) => codeStatus(c) === "active").length;

  return {
    users: usersRes.data?.users?.length ?? 0,
    households: households.count ?? 0,
    transactions: txAgg.data?.length ?? 0,
    totalIncome,
    totalExpense,
    activeCodes,
  };
}

/** Toate codurile de înregistrare, cu numele gospodăriei țintă și status. */
export async function listSignupCodes(): Promise<SignupCodeRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("signup_codes")
    .select("id, code, label, household_id, role, expires_at, used_at, used_by, created_at, households(name)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r: Record<string, unknown>) => {
    const hh = r.households as { name: string } | { name: string }[] | null;
    const household_name = Array.isArray(hh) ? (hh[0]?.name ?? null) : (hh?.name ?? null);
    return {
      id: r.id as string,
      code: r.code as string,
      label: (r.label as string) ?? null,
      household_id: (r.household_id as string) ?? null,
      household_name,
      role: r.role as string,
      expires_at: (r.expires_at as string) ?? null,
      used_at: (r.used_at as string) ?? null,
      used_by: (r.used_by as string) ?? null,
      created_at: r.created_at as string,
      status: codeStatus(r as { used_at: string | null; expires_at: string | null }),
    };
  });
}

export type AdminHousehold = {
  id: string;
  name: string;
  created_at: string;
  members: number;
  transactions: number;
};

/** Gospodăriile cu nr. de membri și tranzacții (pentru pagina de gestiune admin). */
export async function listHouseholdsDetailed(): Promise<AdminHousehold[]> {
  const admin = createAdminClient();
  const [households, members, txs] = await Promise.all([
    admin.from("households").select("id, name, created_at").is("deleted_at", null).order("name"),
    admin.from("household_members").select("household_id"),
    admin.from("transactions").select("household_id").is("deleted_at", null),
  ]);

  const countBy = (rows: { household_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.household_id, (m.get(r.household_id) ?? 0) + 1);
    return m;
  };
  const mCount = countBy(members.data as { household_id: string }[] | null);
  const tCount = countBy(txs.data as { household_id: string }[] | null);

  return (households.data ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    created_at: h.created_at,
    members: mCount.get(h.id) ?? 0,
    transactions: tCount.get(h.id) ?? 0,
  }));
}

/** Gospodăriile active (id + nume) pentru selectorul din generatorul de coduri. */
export async function listHouseholdsForSelect(): Promise<{ id: string; name: string }[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("households")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");
  return (data ?? []) as { id: string; name: string }[];
}

/** Toți utilizatorii cu gospodăriile din care fac parte. */
export async function listAllUsers(): Promise<AdminUser[]> {
  const admin = createAdminClient();
  const [usersRes, members] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("household_members").select("user_id, role, households(name)"),
  ]);

  const byUser = new Map<string, { name: string; role: string }[]>();
  for (const m of (members.data ?? []) as Record<string, unknown>[]) {
    const hh = m.households as { name: string } | { name: string }[] | null;
    const name = Array.isArray(hh) ? (hh[0]?.name ?? "—") : (hh?.name ?? "—");
    const arr = byUser.get(m.user_id as string) ?? [];
    arr.push({ name, role: m.role as string });
    byUser.set(m.user_id as string, arr);
  }

  return (usersRes.data?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    banned_until: (u as { banned_until?: string }).banned_until ?? null,
    households: byUser.get(u.id) ?? [],
  }));
}

/** Ultimele tranzacții din toate gospodăriile (supraveghere). */
export async function recentTransactionsAll(limit = 25) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("transactions")
    .select("id, amount, type, date, created_at, households(name), categories(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r: Record<string, unknown>) => {
    const hh = r.households as { name: string } | { name: string }[] | null;
    const cat = r.categories as { name: string } | { name: string }[] | null;
    return {
      id: r.id as string,
      amount: typeof r.amount === "string" ? Number(r.amount) : (r.amount as number),
      type: r.type as string,
      date: r.date as string,
      created_at: r.created_at as string,
      household: Array.isArray(hh) ? (hh[0]?.name ?? "—") : (hh?.name ?? "—"),
      category: Array.isArray(cat) ? (cat[0]?.name ?? "—") : (cat?.name ?? "—"),
    };
  });
}
