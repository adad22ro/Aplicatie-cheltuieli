import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Rute publice (accesibile fără sesiune). Restul cer autentificare.
// - /auth/callback: finalizează OAuth (setează sesiunea) — nu poate cere deja sesiune.
// - /api/health: sondat de monitoare externe fără cont.
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/auth/callback",
  "/auth/reset",
  "/api/health",
];

/**
 * Proxy (middleware Next 16): reîmprospătează sesiunea și protejează rutele.
 * - User neautentificat pe rută privată → redirect la /login.
 * - User autentificat pe /login sau /register → redirect la / (dashboard).
 *
 * Nota: verificarea „are gospodărie?" NU se face aici (ar interoga DB la fiecare
 * request), ci în layout-ul zonei protejate.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Rulează pe toate rutele mai puțin asset-uri statice și imagini.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
