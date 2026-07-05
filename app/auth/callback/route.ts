import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logSecurityEvent, getClientIp } from "@/lib/security/events";

/**
 * Callback OAuth (Google): schimbă `code` pe o sesiune și redirectează la dashboard.
 * Dacă providerul întoarce eroare sau schimbul eșuează (ex: emailul nu are cont și
 * signup-ul e dezactivat), trimite înapoi la /login cu un mesaj.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error");

  if (providerError || !code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    await logSecurityEvent({
      type: "login_failed",
      ip: await getClientIp(),
      detail: { provider: "google", reason: error?.message ?? "no_account" },
    });
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  await logSecurityEvent({
    type: "login_success",
    email: data.user.email ?? null,
    userId: data.user.id,
    ip: await getClientIp(),
    detail: { provider: "google" },
  });
  return NextResponse.redirect(`${origin}/`);
}
