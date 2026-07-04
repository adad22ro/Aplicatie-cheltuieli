import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Client Supabase pentru cod de SERVER (Server Components, Route Handlers, Server
 * Actions). Propagă sesiunea utilizatorului prin cookie-uri, deci RLS pe `auth.uid()`
 * funcționează nativ.
 *
 * Folosește cheia `anon` — niciodată `service_role` (ar sări peste RLS și ar anula
 * izolarea între gospodării). Pe Profil B nu se folosește `service_role` pentru date.
 *
 * `cookies()` e async în Next 16, deci funcția e async.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Într-un Server Component pur, scrierea de cookie-uri aruncă — e normal:
        // reîmprospătarea sesiunii se face din middleware (`proxy.ts`). Prindem eroarea
        // ca să nu strice randarea.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // ignorat intenționat — vezi comentariul de mai sus.
        }
      },
    },
  });
}
