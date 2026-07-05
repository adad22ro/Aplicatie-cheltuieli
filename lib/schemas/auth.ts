import { z } from "zod";

/** Credențiale pentru login/register. Validate pe server, în interiorul action-ului. */
export const credentialsSchema = z.object({
  email: z.string().trim().email("Adresă de email invalidă"),
  password: z.string().min(6, "Parola trebuie să aibă minim 6 caractere"),
});

export type Credentials = z.infer<typeof credentialsSchema>;

/** Înregistrare: credențiale + nume afișat + cod de invitație obligatoriu (gating). */
export const registerSchema = credentialsSchema.extend({
  name: z
    .string()
    .trim()
    .min(1, "Numele este obligatoriu")
    .max(40, "Numele e prea lung (max 40)"),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, "Cod de invitație invalid")
    .max(20, "Cod de invitație invalid"),
});

/** Nume gospodărie la onboarding. */
export const householdNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Numele gospodăriei este obligatoriu")
    .max(80, "Numele e prea lung (max 80 de caractere)"),
});
