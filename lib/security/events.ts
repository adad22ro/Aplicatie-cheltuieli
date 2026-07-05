import "server-only";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";

export type SecurityEventType =
  | "login_failed"
  | "login_success"
  | "register_failed"
  | "register_success"
  | "admin_access_denied"
  | "rate_limited"
  | "password_reset";

type EventInput = {
  type: SecurityEventType;
  email?: string | null;
  userId?: string | null;
  ip?: string | null;
  detail?: unknown;
};

/** IP-ul clientului din antetele de proxy (Vercel setează x-forwarded-for). Best-effort. */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? null;
}

/** Scrie un eveniment de securitate (append-only). Nu aruncă — logarea nu blochează fluxul. */
export async function logSecurityEvent(e: EventInput): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("security_events").insert({
      event_type: e.type,
      email: e.email ?? null,
      user_id: e.userId ?? null,
      ip: e.ip ?? null,
      detail: e.detail ?? null,
    });
  } catch {
    // Nu propaga erori de logare.
  }
}

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5; // eșecuri per email SAU per IP în fereastră înainte de blocare

export type RateLimitResult = { blocked: boolean; failures: number };

/**
 * Verifică dacă (email, ip) e limitat: numără eșecurile de login/register din ultimele
 * `WINDOW_MINUTES` minute; ≥ `MAX_FAILURES` pe oricare cheie → blocat. Fail-open la eroare
 * (nu blocăm login-uri legitime dacă tabelul e indisponibil).
 */
export async function checkAuthRateLimit(
  email: string | null,
  ip: string | null,
): Promise<RateLimitResult> {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

    const orParts: string[] = [];
    if (email) orParts.push(`email.eq.${email}`);
    if (ip) orParts.push(`ip.eq.${ip}`);
    if (orParts.length === 0) return { blocked: false, failures: 0 };

    const { count } = await admin
      .from("security_events")
      .select("*", { count: "exact", head: true })
      .in("event_type", ["login_failed", "register_failed"])
      .gte("created_at", since)
      .or(orParts.join(","));

    const failures = count ?? 0;
    return { blocked: failures >= MAX_FAILURES, failures };
  } catch {
    return { blocked: false, failures: 0 };
  }
}
