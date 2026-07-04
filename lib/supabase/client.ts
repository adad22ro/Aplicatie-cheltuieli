import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Client Supabase pentru cod de BROWSER (Client Components).
 *
 * Se folosește doar când chiar e nevoie de acces direct din client (ex. abonamente
 * realtime, interacțiuni live). Pentru citiri/scrieri obișnuite, preferă clientul de
 * server (`lib/supabase/server.ts`).
 *
 * Folosește tot cheia publică `anon` — sigură de expus, izolarea se face prin RLS.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(env.supabase.url, env.supabase.anonKey);
}
