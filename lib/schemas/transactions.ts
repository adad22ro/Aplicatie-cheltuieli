import { z } from "zod";

/**
 * Sumă: acceptă virgulă sau punct (tastatură numerică RO), o convertește în număr.
 * Trebuie > 0 (aliniat cu check-ul din DB `amount > 0`).
 */
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

/** Câmpuri comune la creare/editare tranzacție. */
const fields = {
  amount,
  type: z.enum(["income", "expense"]),
  category_id: z.string().uuid("Alege o categorie"),
  payment_method_id: optionalUuid,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă"),
  note: z
    .string()
    .trim()
    .max(200, "Nota e prea lungă (max 200)")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
};

export const createTransactionSchema = z.object(fields);
export const updateTransactionSchema = z.object({
  id: z.string().uuid("ID invalid"),
  ...fields,
});

export const txIdSchema = z.object({ id: z.string().uuid("ID invalid") });
