import { z } from "zod";

/**
 * Validare centralizată a variabilelor de mediu (fail-fast).
 *
 * Codul citește variabilele DOAR prin obiectul `env` exportat aici, niciodată direct
 * din `process.env`. Dacă lipsește ceva obligatoriu, aplicația crapă imediat la boot
 * cu mesaj clar (vezi `instrumentation.ts`), nu cu un 500 obscur la runtime.
 *
 * La adăugarea unei variabile noi: o adaugi în schema de mai jos ȘI în `.env.example`.
 */

const envSchema = z.object({
  // Supabase — publice (ajung în browser). Izolarea datelor se face prin RLS.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "NEXT_PUBLIC_SUPABASE_URL trebuie să fie URL-ul de bază al proiectului Supabase (ex: https://xxxx.supabase.co)",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY lipsește"),
  // Server-only (NU ajung în browser). Necesare pentru înregistrarea controlată de
  // admin și pentru panoul de admin.
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY lipsește (cheia secretă service_role)"),
  ADMIN_EMAIL: z
    .string()
    .email("ADMIN_EMAIL trebuie să fie un email valid (contul de administrator)"),
});

/**
 * Validează `process.env` și întoarce configul tipizat.
 * Aruncă o eroare descriptivă (listă de câmpuri) dacă validarea eșuează.
 */
function loadEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Variabile de mediu invalide sau lipsă:\n${issues}\n\nCompletează-le în .env.local (vezi .env.example).`,
    );
  }

  return parsed.data;
}

const raw = loadEnv();

/** Config validat, grupat pe domenii pentru citire ergonomică. */
export const env = {
  supabase: {
    url: raw.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: raw.SUPABASE_SERVICE_ROLE_KEY,
  },
  adminEmail: raw.ADMIN_EMAIL,
} as const;
