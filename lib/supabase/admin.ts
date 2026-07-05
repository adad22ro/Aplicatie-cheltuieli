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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY lipsește — necesară pentru înregistrare și panoul de admin. Adaug-o în .env.local și în Vercel.",
    );
  }
  return createClient(env.supabase.url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
