import "server-only";

import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Userul autentificat curent (sau null). Validează sesiunea cu serverul Supabase.
 *
 * `cache()` dedupe apelul în cadrul aceluiași request: chiar dacă mai multe componente
 * cer userul, se face un singur apel `auth.getUser()` (de rețea) per randare.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Apartenența la gospodărie a userului curent (prima găsită) + numele gospodăriei.
 * Întoarce null dacă userul nu e membru al niciunei gospodării → trebuie trimis la
 * onboarding. RLS garantează că vede doar apartenențele proprii.
 *
 * Nota: un user poate fi în mai multe gospodării (PLAN §12); selectorul de gospodărie
 * activă vine ulterior. Deocamdată luăm prima.
 */
export const getCurrentMembership = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("household_members")
    .select("household_id, role, households(name)")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
});

/**
 * ID-ul gospodăriei active a userului curent (prima apartenență), sau null dacă nu e
 * membru al niciuneia. Folosit de Server Actions ca să știe pe ce gospodărie scriu.
 * RLS impune oricum izolarea; acesta doar evită un round-trip suplimentar.
 */
export async function getActiveHouseholdId() {
  const membership = await getCurrentMembership();
  return membership?.household_id ?? null;
}
