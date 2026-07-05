import "server-only";

import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/current-user";

/** True dacă emailul dat e cel al administratorului (comparație case-insensitive). */
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === env.adminEmail.toLowerCase();
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
