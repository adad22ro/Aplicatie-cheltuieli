import { z } from "zod";

const amount = z.preprocess(
  (v) => (typeof v === "string" ? Number(v.replace(",", ".").trim()) : v),
  z
    .number({ error: "Suma este obligatorie" })
    .positive("Suma trebuie să fie mai mare ca 0")
    .max(1_000_000_000, "Sumă prea mare"),
);

const optionalUuid = z
  .union([z.string().uuid(), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v ? v : null));

const fields = {
  amount,
  type: z.enum(["income", "expense"]),
  category_id: z.string().uuid("Alege o categorie"),
  payment_method_id: optionalUuid,
  day_of_month: z.coerce
    .number({ error: "Ziua este obligatorie" })
    .int("Zi invalidă")
    .min(1, "Ziua trebuie să fie între 1 și 31")
    .max(31, "Ziua trebuie să fie între 1 și 31"),
  note: z
    .string()
    .trim()
    .max(200, "Nota e prea lungă (max 200)")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  // Sumă variabilă (ex: factură curent): nu se generează automat, se completează la scadență.
  is_variable: z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.boolean(),
  ),
  // Confirmare manuală: nu se generează automat, o marchezi tu plătită/încasată la scadență.
  manual_confirm: z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.boolean(),
  ),
};

export const createRecurringSchema = z.object(fields);
export const updateRecurringSchema = z.object({
  id: z.string().uuid("ID invalid"),
  ...fields,
});
export const recurringIdSchema = z.object({ id: z.string().uuid("ID invalid") });
