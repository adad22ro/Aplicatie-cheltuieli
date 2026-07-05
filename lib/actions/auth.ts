"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { credentialsSchema, registerSchema } from "@/lib/schemas/auth";

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

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Email sau parolă greșite" };
  }

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

  const admin = createAdminClient();

  // 1) Validează codul.
  const { data: codeRow } = await admin
    .from("signup_codes")
    .select("id, household_id, role, used_at, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (!codeRow) return { error: "Cod de invitație invalid" };
  if (codeRow.used_at) return { error: "Codul a fost deja folosit" };
  if (codeRow.expires_at && new Date(codeRow.expires_at) <= new Date()) {
    return { error: "Codul a expirat" };
  }

  // 2) Creează contul (confirmat, fără email — signup public e închis).
  const { data: created, error: eCreate } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (eCreate || !created?.user) {
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
  if (codeRow.household_id) {
    await admin.from("household_members").insert({
      household_id: codeRow.household_id,
      user_id: userId,
      role: codeRow.role,
    });
  }

  // 5) Marchează codul folosit.
  await admin
    .from("signup_codes")
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq("id", codeRow.id);

  // 6) Autentifică userul (setează cookie-urile de sesiune).
  const supabase = await createServerSupabaseClient();
  const { error: eSignIn } = await supabase.auth.signInWithPassword({ email, password });
  if (eSignIn) {
    // Contul există, dar login-ul automat a eșuat — trimite la login manual.
    redirect("/login");
  }

  // Cu gospodărie țintă → direct la dashboard; altfel → onboarding (își creează una).
  redirect(codeRow.household_id ? "/" : "/onboarding");
}

/** Delogare + redirect la login. */
export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
