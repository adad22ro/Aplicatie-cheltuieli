import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Userul autentificat curent (sau null). Validează sesiunea cu serverul Supabase.
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Apartenența la gospodărie a userului curent (prima găsită) + numele gospodăriei.
 * Întoarce null dacă userul nu e membru al niciunei gospodării → trebuie trimis la
 * onboarding. RLS garantează că vede doar apartenențele proprii.
 *
 * Nota: un user poate fi în mai multe gospodării (PLAN §12); selectorul de gospodărie
 * activă vine ulterior. Deocamdată luăm prima.
 */
export async function getCurrentMembership() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("household_members")
    .select("household_id, role, households(name)")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}
