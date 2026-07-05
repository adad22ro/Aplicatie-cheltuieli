"use server";

import { randomInt } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminActionState = { error: string } | { ok: true } | undefined;

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generateCode(len = 8): string {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function audit(admin: any, adminId: string, action: string, detail: unknown) {
  await admin.from("admin_audit").insert({ admin_id: adminId, action, detail });
}

const genSchema = z.object({
  label: z.string().trim().max(60).optional().transform((v) => (v ? v : null)),
  household_id: z
    .union([z.string().uuid(), z.literal(""), z.undefined(), z.null()])
    .transform((v) => (v ? v : null)),
  role: z.enum(["owner", "member"]).default("member"),
  expiresInDays: z
    .union([z.coerce.number().int().min(1).max(365), z.literal(""), z.undefined(), z.null()])
    .transform((v) => (typeof v === "number" ? v : null)),
});

/** Admin generează un cod de înregistrare (opțional cu gospodărie țintă + expirare). */
export async function generateSignupCodeAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const adminUser = await requireAdmin();

  const parsed = genSchema.safeParse({
    label: formData.get("label"),
    household_id: formData.get("household_id"),
    role: formData.get("role") ?? "member",
    expiresInDays: formData.get("expiresInDays"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }

  const expiresAt = parsed.data.expiresInDays
    ? new Date(Date.now() + parsed.data.expiresInDays * 86_400_000).toISOString()
    : null;

  const admin = createAdminClient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await admin.from("signup_codes").insert({
      code,
      label: parsed.data.label,
      household_id: parsed.data.household_id,
      role: parsed.data.role,
      expires_at: expiresAt,
      created_by: adminUser.id,
    });
    if (!error) {
      await audit(admin, adminUser.id, "generate_code", {
        code,
        household_id: parsed.data.household_id,
        role: parsed.data.role,
      });
      revalidatePath("/admin/codes");
      return { ok: true };
    }
    if (error.code !== "23505") {
      return { error: "Nu am putut genera codul. Încearcă din nou." };
    }
  }
  return { error: "Nu am putut genera un cod unic. Încearcă din nou." };
}

/** Admin revocă (șterge) un cod. */
export async function revokeSignupCodeAction(formData: FormData): Promise<void> {
  const adminUser = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const admin = createAdminClient();
  await admin.from("signup_codes").delete().eq("id", id);
  await audit(admin, adminUser.id, "revoke_code", { id });
  revalidatePath("/admin/codes");
}

/** Admin redenumește o gospodărie. */
export async function renameHouseholdAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const adminUser = await requireAdmin();
  const id = formData.get("id");
  const name = formData.get("name");
  if (typeof id !== "string" || typeof name !== "string" || name.trim().length === 0) {
    return { error: "Nume invalid" };
  }
  if (name.trim().length > 60) return { error: "Nume prea lung (max 60)" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("households")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) return { error: "Nu am putut redenumi gospodăria." };

  await audit(admin, adminUser.id, "rename_household", { id, name: name.trim() });
  revalidatePath("/admin/households");
  return { ok: true };
}

/** Admin resetează parola unui user. */
export async function resetPasswordAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const adminUser = await requireAdmin();
  const userId = formData.get("userId");
  const password = formData.get("password");
  if (typeof userId !== "string" || typeof password !== "string" || password.length < 6) {
    return { error: "Parola trebuie să aibă minim 6 caractere" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: "Nu am putut reseta parola." };

  await audit(admin, adminUser.id, "reset_password", { userId });
  return { ok: true };
}

/** Admin șterge un user (nu se poate șterge pe el însuși). */
export async function deleteUserAction(formData: FormData): Promise<void> {
  const adminUser = await requireAdmin();
  const userId = formData.get("userId");
  if (typeof userId !== "string" || userId === adminUser.id) return;

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
  await audit(admin, adminUser.id, "delete_user", { userId });
  revalidatePath("/admin/users");
}
