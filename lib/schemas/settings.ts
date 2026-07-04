import { z } from "zod";

/**
 * Paletă de culori pentru categorii (aliniată tokenilor din design). Valoarea stocată
 * în DB e hex-ul. UI-ul alege dintre acestea; schema validează că e una permisă.
 */
export const CATEGORY_COLORS = [
  "#16a34a", // verde (income-friendly)
  "#dc2626", // roșu (expense)
  "#ea580c", // portocaliu
  "#d97706", // ambră
  "#ca8a04", // galben-auriu
  "#0891b2", // cyan
  "#2563eb", // albastru
  "#7c3aed", // violet
  "#db2777", // roz
  "#475569", // gri-ardezie
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
    .max(4, "Iconul e prea lung")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  // Culoare opțională; dacă e prezentă trebuie să fie din paletă.
  color: z
    .union([z.enum(CATEGORY_COLORS), z.literal(""), z.undefined(), z.null()])
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
