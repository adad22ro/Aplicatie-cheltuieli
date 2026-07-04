import { z } from "zod";

/** Credențiale pentru login/register. Validate pe server, în interiorul action-ului. */
export const credentialsSchema = z.object({
  email: z.string().trim().email("Adresă de email invalidă"),
  password: z.string().min(6, "Parola trebuie să aibă minim 6 caractere"),
});

export type Credentials = z.infer<typeof credentialsSchema>;

/** Nume gospodărie la onboarding. */
export const householdNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Numele gospodăriei este obligatoriu")
    .max(80, "Numele e prea lung (max 80 de caractere)"),
});
