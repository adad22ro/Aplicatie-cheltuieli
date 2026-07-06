import { z } from "zod";

/**
 * Paletă de culori pentru categorii (aliniată tokenilor din design). Valoarea stocată
 * în DB e hex-ul. UI-ul alege dintre acestea; schema validează că e una permisă.
 */
export const CATEGORY_COLORS = [
  "#FF6B4A", // mâncare
  "#3B82F6", // transport
  "#A855F7", // distracție
  "#EC4899", // sănătate
  "#14B8A6", // facturi
  "#F59E0B", // cumpărături
  "#B45309", // cafea
  "#22C55E", // salariu (venit)
  "#7C3AED", // violet (primar)
  "#DC2626", // roșu
] as const;

const entryType = z.enum(["income", "expense"]);

/** Câmpuri comune la creare/editare categorie. */
const categoryFields = {
  name: z
    .string()
    .trim()
    .min(1, "Numele categoriei este obligatoriu")
    .max(40, "Numele e prea lung (max 40 de caractere)"),
  type: entryType,
  // Emoji/icon opțional; input scurt (1-2 grapheme). Gol → null.
  icon: z
    .string()
    .trim()
    .max(8, "Iconul e prea lung")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  // Culoare opțională; dacă e prezentă trebuie să fie un hex valid (#RGB/#RRGGBB).
  // Acceptăm orice hex (nu doar paleta curentă) ca să nu rupem categoriile vechi la editare.
  color: z
    .union([
      z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Culoare invalidă"),
      z.literal(""),
      z.undefined(),
      z.null(),
    ])
    .transform((v) => (v ? v : null)),
};

export const createCategorySchema = z.object(categoryFields);
export const updateCategorySchema = z.object({
  id: z.string().uuid("ID invalid"),
  ...categoryFields,
});

/** Doar id pentru ștergere (soft delete). */
export const idSchema = z.object({ id: z.string().uuid("ID invalid") });

/** Metodă de plată: doar nume. */
const paymentMethodFields = {
  name: z
    .string()
    .trim()
    .min(1, "Numele metodei este obligatoriu")
    .max(40, "Numele e prea lung (max 40 de caractere)"),
};

export const createPaymentMethodSchema = z.object(paymentMethodFields);
export const updatePaymentMethodSchema = z.object({
  id: z.string().uuid("ID invalid"),
  ...paymentMethodFields,
});
