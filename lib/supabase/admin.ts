import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Client Supabase cu cheia `service_role` — OCOLEȘTE RLS și are acces de admin la
 * `auth.users`. Se folosește DOAR în cod de server strict controlat:
 *  - înregistrarea pe bază de cod (creare cont fără signup public),
 *  - panoul de admin (`/admin`, protejat prin `requireAdmin`).
 *
 * Niciodată importat în cod de client. Fiecare apel îl folosește după ce a verificat
 * autorizarea (cod valid sau utilizator admin).
 */
export function createAdminClient() {
  return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
