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
    // Câmpul nu e randat când venitul nu e recurent → poate sosi null/"" (îl tratăm ca absent).
    day_of_month: z.preprocess(
      (v) => (v === null || v === undefined || v === "" ? undefined : v),
      z.coerce.number().int().min(1).max(31).optional(),
    ),
  })
  .refine((d) => !d.is_recurring || d.category_id, {
    message: "Alege o categorie de venit pentru sursa recurentă",
    path: ["category_id"],
  });

/** Adaugă o alocare ad-hoc: fie o cheltuială (categorie), fie o economie (obiectiv). */
export const addAllocationSchema = z
  .object({
    month,
    category_id: optionalUuid,
    savings_goal_id: optionalUuid,
    label: shortText.optional().transform((v) => (v && v.length > 0 ? v : null)),
    planned_amount: amount,
  })
  .refine((d) => d.category_id || d.savings_goal_id, {
    message: "Alege o categorie sau un obiectiv de economisire",
    path: ["category_id"],
  });
