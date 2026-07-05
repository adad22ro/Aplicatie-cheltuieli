import { z } from "zod";

/** Cod de invitație introdus la alăturare. Normalizat la majuscule, fără spații. */
export const redeemInviteSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, "Cod invalid")
    .max(20, "Cod invalid"),
});

/** Opțiuni la generarea unei invitații (owner). Deocamdată doar expirare opțională. */
export const createInviteSchema = z.object({
  // număr de zile până la expirare; gol/0 → fără expirare
  expiresInDays: z
    .union([z.coerce.number().int().min(1).max(365), z.literal(""), z.undefined(), z.null()])
    .transform((v) => (typeof v === "number" ? v : null)),
});
