"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { credentialsSchema } from "@/lib/schemas/auth";

/** Starea întoarsă de action-uri către formular (mesaj de eroare sau nimic la succes). */
export type AuthActionState = { error: string } | undefined;

/**
 * Login cu email + parolă. Validează inputul cu Zod (nu se bazează pe formularul din
 * client), autentifică prin Supabase, apoi redirect la dashboard. Middleware-ul decide
 * mai departe onboarding vs. dashboard.
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
 * Înregistrare cont nou. La succes, dacă sesiunea e activă imediat (fără confirmare de
 * email), trimite la onboarding pentru crearea gospodăriei.
 */
export async function signUpAction(
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
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) {
    return {
      error: error.message.includes("already")
        ? "Există deja un cont cu acest email"
        : "Nu am putut crea contul. Încearcă din nou.",
    };
  }

  // Fără sesiune activă = e nevoie de confirmare pe email.
  if (!data.session) {
    return { error: "Verifică emailul pentru a confirma contul, apoi autentifică-te." };
  }

  redirect("/onboarding");
}

/** Delogare + redirect la login. */
export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
