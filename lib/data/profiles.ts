import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type Member = { user_id: string; name: string | null };

/** Numele afișat al userului curent (sau null dacă nu și-a setat profil). */
export async function getMyProfileName(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.display_name ?? null;
}

/**
 * Membrii gospodăriei active cu numele lor (RLS lasă vederea profilurilor co-membrilor).
 * `name` poate fi null dacă cineva nu și-a setat încă un profil.
 */
export async function listMemberProfiles(): Promise<Member[]> {
  const supabase = await createServerSupabaseClient();
  const { data: members } = await supabase
    .from("household_members")
    .select("user_id");
  const ids = (members ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", ids);

  const nameById = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));
  return ids.map((id) => ({ user_id: id, name: nameById.get(id) ?? null }));
}

/** Hartă user_id → nume, pentru afișarea autorului pe tranzacții. */
export async function authorMap(): Promise<Record<string, string>> {
  const members = await listMemberProfiles();
  const map: Record<string, string> = {};
  for (const m of members) if (m.name) map[m.user_id] = m.name;
  return map;
}
