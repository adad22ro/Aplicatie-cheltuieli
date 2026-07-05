import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type SecurityEvent = {
  id: string;
  event_type: string;
  email: string | null;
  ip: string | null;
  detail: unknown;
  created_at: string;
};

/** Ultimele evenimente de securitate (service_role — tabelul e altfel inaccesibil). */
export async function listSecurityEvents(limit = 50): Promise<SecurityEvent[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("security_events")
    .select("id, event_type, email, ip, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as SecurityEvent[];
}

export type SecuritySummary = {
  failedLogins24h: number;
  rateLimited24h: number;
  adminDenied24h: number;
};

/** Contoare de securitate pe ultimele 24h. */
export async function getSecuritySummary(): Promise<SecuritySummary> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const countOf = async (type: string) => {
    const { count } = await admin
      .from("security_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", type)
      .gte("created_at", since);
    return count ?? 0;
  };
  const [failedLogins24h, rateLimited24h, adminDenied24h] = await Promise.all([
    countOf("login_failed"),
    countOf("rate_limited"),
    countOf("admin_access_denied"),
  ]);
  return { failedLogins24h, rateLimited24h, adminDenied24h };
}

export type RlsRow = { table_name: string; rls_enabled: boolean; policy_count: number };

/** Starea RLS pe fiecare tabel din schema public (via RPC SECURITY DEFINER). */
export async function getRlsStatus(): Promise<RlsRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("rls_status");
  if (error || !data) return [];
  return data as RlsRow[];
}

export type IntegrityChecks = {
  usersWithoutHousehold: number;
  transactionsSoftDeleted: number;
  expiredUnusedCodes: number;
  orphanMembers: number; // membri care trimit la o gospodărie ștearsă
};

/** Verificări rapide de integritate a datelor. */
export async function getIntegrityChecks(): Promise<IntegrityChecks> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const [usersRes, members, households, softDeleted, expiredCodes] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("household_members").select("user_id, household_id"),
    admin.from("households").select("id").is("deleted_at", null),
    admin
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .not("deleted_at", "is", null),
    admin
      .from("signup_codes")
      .select("*", { count: "exact", head: true })
      .is("used_at", null)
      .not("expires_at", "is", null)
      .lt("expires_at", nowIso),
  ]);

  const memberUserIds = new Set((members.data ?? []).map((m) => m.user_id));
  const liveHouseholds = new Set((households.data ?? []).map((h) => h.id));
  const usersWithoutHousehold = (usersRes.data?.users ?? []).filter(
    (u) => !memberUserIds.has(u.id),
  ).length;
  const orphanMembers = (members.data ?? []).filter(
    (m) => !liveHouseholds.has(m.household_id),
  ).length;

  return {
    usersWithoutHousehold,
    transactionsSoftDeleted: softDeleted.count ?? 0,
    expiredUnusedCodes: expiredCodes.count ?? 0,
    orphanMembers,
  };
}

export type ConfigCheck = { key: string; present: boolean; hint?: string };

/** Prezența variabilelor de mediu critice (fără a expune valorile). */
export function getConfigOverview(): ConfigCheck[] {
  const has = (v: string | undefined) => !!v && v.length > 0;
  return [
    { key: "NEXT_PUBLIC_SUPABASE_URL", present: has(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", present: has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      present: has(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hint: "necesară pentru admin & înregistrare",
    },
    { key: "ADMIN_EMAIL", present: has(process.env.ADMIN_EMAIL), hint: "guard-ul panoului /admin" },
  ];
}
