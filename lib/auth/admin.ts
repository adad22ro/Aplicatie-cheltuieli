import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

/**
 * True dacă emailul dat e cel al administratorului (comparație case-insensitive).
 * `ADMIN_EMAIL` se citește lenevos: dacă lipsește, nimeni nu e admin (deny sigur).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  return !!adminEmail && !!email && email.toLowerCase() === adminEmail;
}

/**
 * Guard pentru rutele/action-urile de admin. Redirectează:
 *  - neautentificat → /login
 *  - autentificat dar non-admin → / (dashboard normal)
 * Întoarce userul admin la succes.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/");
  return user;
}
