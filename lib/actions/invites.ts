"use server";

import { randomInt } from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser, getActiveHouseholdId } from "@/lib/auth/current-user";
import { createInviteSchema, redeemInviteSchema } from "@/lib/schemas/invites";

export type InviteActionState = { error: string } | undefined;

const HOUSEHOLD_PATH = "/settings/household";

// Alfabet fără caractere ambigue (0/O, 1/I/L) pentru coduri ușor de citit/tastat.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(len = 8): string {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** Owner generează o invitație (cod unic, expirare opțională). */
export async function createInviteAction(
  _prev: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = createInviteSchema.safeParse({
    expiresInDays: formData.get("expiresInDays"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const expiresAt = parsed.data.expiresInDays
    ? new Date(Date.now() + parsed.data.expiresInDays * 86_400_000).toISOString()
    : null;

  const supabase = await createServerSupabaseClient();

  // Reîncearcă la coliziune de cod (foarte improbabil, dar codul e unique în DB).
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from("household_invites").insert({
      household_id: householdId,
      code: generateCode(),
      created_by: user.id,
      expires_at: expiresAt,
    });
    if (!error) {
      revalidatePath(HOUSEHOLD_PATH);
      return undefined;
    }
    if (error.code !== "23505") {
      // altă eroare decât unique violation → oprim
      return { error: "Nu am putut genera invitația. Încearcă din nou." };
    }
  }
  return { error: "Nu am putut genera un cod unic. Încearcă din nou." };
}

/** Owner revocă (șterge) o invitație. */
export async function revokeInviteAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const supabase = await createServerSupabaseClient();
  await supabase.from("household_invites").delete().eq("id", id);
  revalidatePath(HOUSEHOLD_PATH);
}

/** Un user fără gospodărie (sau nu) acceptă o invitație prin cod → devine membru. */
export async function redeemInviteAction(
  _prev: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = redeemInviteSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Cod invalid" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("redeem_invite", { p_code: parsed.data.code });
  if (error) {
    // Mesajele din funcție sunt deja prietenoase (RO); le afișăm dacă există.
    return { error: error.message || "Nu am putut folosi invitația." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
