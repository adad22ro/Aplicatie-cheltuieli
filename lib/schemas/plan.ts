import { z } from "zod";

/** Sumă în RON, acceptă virgulă zecimală. Permite 0 (o alocare poate fi golită). */
const amount = z.preprocess(
  (v) => (typeof v === "string" ? Number(v.replace(",", ".").trim()) : v),
  z
    .number({ error: "Suma este obligatorie" })
    .min(0, "Suma nu poate fi negativă")
    .max(1_000_000_000, "Sumă prea mare"),
);

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Lună invalidă");
const optionalUuid = z
  .union([z.string().uuid(), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v ? v : null));
const shortText = z
  .string()
  .trim()
  .max(100, "Text prea lung (max 100)");

export const idSchema = z.object({ id: z.string().uuid("ID invalid") });

/** Adaugă un venit în planul unei luni. Bifa „recurent" → creează și o recurență. */
export const addIncomeSchema = z
  .object({
    month,
    label: shortText.min(1, "Denumirea e obligatorie"),
    amount,
    is_recurring: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
    // necesare doar dacă e recurent (recurring_transactions cere categorie + zi)
    category_id: optionalUuid,
    day_of_month: z.coerce.number().int().min(1).max(31).optional(),
  })
  .refine((d) => !d.is_recurring || d.category_id, {
    message: "Alege o categorie de venit pentru sursa recurentă",
    path: ["category_id"],
  });

/** Adaugă o cheltuială ad-hoc în plan („+ Adaugă altceva"). Categorie obligatorie. */
export const addAllocationSchema = z.object({
  month,
  category_id: z.string().uuid("Alege o categorie"),
  label: shortText.optional().transform((v) => (v && v.length > 0 ? v : null)),
  planned_amount: amount,
});
