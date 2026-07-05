"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ProfileActionState = { error: string } | { ok: true } | undefined;

const schema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Numele este obligatoriu")
    .max(40, "Numele e prea lung (max 40)"),
});

/** Setează/actualizează numele afișat al userului curent (upsert pe user_id). */
export async function saveProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = schema.safeParse({ display_name: formData.get("display_name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: user.id, display_name: parsed.data.display_name, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) {
    return { error: "Nu am putut salva numele. Încearcă din nou." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
