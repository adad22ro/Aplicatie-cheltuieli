"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { credentialsSchema, registerSchema, resetRequestSchema } from "@/lib/schemas/auth";
import { headers } from "next/headers";
import {
  logSecurityEvent,
  checkAuthRateLimit,
  getClientIp,
} from "@/lib/security/events";

/** Starea întoarsă de action-uri către formular (mesaj de eroare sau nimic la succes). */
export type AuthActionState = { error: string } | undefined;

/**
 * Login cu email + parolă. Validează inputul cu Zod, autentifică prin Supabase, apoi
 * redirect la dashboard. Middleware-ul decide mai departe onboarding vs. dashboard.
 */
export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { email } = parsed.data;
  const ip = await getClientIp();

  // Rate-limiting: prea multe eșecuri recente (per email sau IP) → blocare temporară.
  const rl = await checkAuthRateLimit(email, ip);
  if (rl.blocked) {
    await logSecurityEvent({ type: "rate_limited", email, ip, detail: { action: "login" } });
    return { error: "Prea multe încercări. Reîncearcă peste câteva minute." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    await logSecurityEvent({ type: "login_failed", email, ip });
    return { error: "Email sau parolă greșite" };
  }

  await logSecurityEvent({ type: "login_success", email, ip });
  redirect("/");
}

/**
 * Înregistrare controlată prin cod de invitație. Signup-ul public Supabase e dezactivat;
 * conturile se creează DOAR aici, cu service_role, după validarea codului. Dacă codul are
 * o gospodărie țintă, userul e adăugat automat ca membru (nu vede alte gospodării).
 */
export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { email, password, name, code } = parsed.data;
  const ip = await getClientIp();

  // Rate-limiting (per email sau IP) contra ghicirii de coduri prin brute-force.
  const rl = await checkAuthRateLimit(email, ip);
  if (rl.blocked) {
    await logSecurityEvent({ type: "rate_limited", email, ip, detail: { action: "register" } });
    return { error: "Prea multe încercări. Reîncearcă peste câteva minute." };
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // 1) Redeem ATOMIC: marchează codul folosit doar dacă e valid, neexpirat și nefolosit.
  //    Un singur UPDATE condiționat → două cereri concurente nu pot folosi același cod
  //    (a doua vede used_at deja setat și nu întoarce niciun rând).
  const { data: claimed } = await admin
    .from("signup_codes")
    .update({ used_at: nowIso })
    .eq("code", code)
    .is("used_at", null)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .select("id, household_id, role")
    .maybeSingle();

  if (!claimed) {
    await logSecurityEvent({ type: "register_failed", email, ip, detail: { reason: "invalid_code" } });
    return { error: "Cod de invitație invalid, expirat sau deja folosit" };
  }

  // 2) Creează contul (confirmat, fără email — signup public e închis).
  const { data: created, error: eCreate } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (eCreate || !created?.user) {
    // Eliberează codul (revenim la nefolosit) ca să nu se piardă la o eroare de creare.
    await admin.from("signup_codes").update({ used_at: null }).eq("id", claimed.id);
    await logSecurityEvent({ type: "register_failed", email, ip, detail: { reason: "create_failed" } });
    const msg = eCreate?.message ?? "";
    return {
      error: /already|registered|exists/i.test(msg)
        ? "Există deja un cont cu acest email"
        : "Nu am putut crea contul. Încearcă din nou.",
    };
  }
  const userId = created.user.id;

  // 3) Creează profilul cu numele afișat.
  await admin.from("profiles").insert({ user_id: userId, display_name: name });

  // 4) Auto-join în gospodăria țintă (dacă e setată pe cod).
  if (claimed.household_id) {
    await admin.from("household_members").insert({
      household_id: claimed.household_id,
      user_id: userId,
      role: claimed.role,
    });
  }

  // 5) Finalizează codul: leagă-l de userul creat.
  await admin.from("signup_codes").update({ used_by: userId }).eq("id", claimed.id);
  await logSecurityEvent({ type: "register_success", email, ip, userId });

  // 6) Autentifică userul (setează cookie-urile de sesiune).
  const supabase = await createServerSupabaseClient();
  const { error: eSignIn } = await supabase.auth.signInWithPassword({ email, password });
  if (eSignIn) {
    // Contul există, dar login-ul automat a eșuat — trimite la login manual.
    redirect("/login");
  }

  // Cu gospodărie țintă → direct la dashboard; altfel → onboarding (își creează una).
  redirect(claimed.household_id ? "/" : "/onboarding");
}

export type ResetActionState = { error: string } | { ok: true } | undefined;

/**
 * Cerere de resetare parolă. Trimite emailul de recuperare (link către /auth/reset).
 * Răspuns GENERIC indiferent dacă emailul există (nu divulgăm ce conturi există).
 * Rate-limited ca restul fluxului de auth.
 */
export async function requestPasswordResetAction(
  _prev: ResetActionState,
  formData: FormData,
): Promise<ResetActionState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email invalid" };
  }
  const { email } = parsed.data;
  const ip = await getClientIp();

  const rl = await checkAuthRateLimit(email, ip);
  if (rl.blocked) {
    await logSecurityEvent({ type: "rate_limited", email, ip, detail: { action: "reset" } });
    return { error: "Prea multe încercări. Reîncearcă peste câteva minute." };
  }

  // Construiește originul public din antete (ex: https://domeniu.vercel.app).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  const supabase = await createServerSupabaseClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset`,
  });
  await logSecurityEvent({ type: "password_reset", email, ip, detail: { stage: "requested" } });

  return { ok: true };
}

/** Delogare + redirect la login. */
export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
