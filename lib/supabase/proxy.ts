import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

/**
 * Reîmprospătează sesiunea Supabase la fiecare request și întoarce răspunsul cu
 * cookie-urile actualizate + userul curent. Apelat din `proxy.ts` (middleware Next 16).
 *
 * Pattern-ul cu request/response cookies e cerut de @supabase/ssr ca token-ul reîmprospătat
 * să fie propagat atât spre server (request), cât și spre browser (response).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser() validează sesiunea cu serverul Supabase (nu doar citește cookie-ul).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
