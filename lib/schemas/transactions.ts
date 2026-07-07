import { z } from "zod";

/**
 * Normalizează o sumă scrisă „ca omul": acceptă virgulă sau punct ca separator zecimal
 * și separatori de mii. Exemple corecte: „24,50", „24.50", „1.234,50", „1,234.50", „1 234,50".
 * Regula: dacă apar ambii separatori, ultimul e cel zecimal.
 */
export function parseAmount(v: unknown): unknown {
  if (typeof v !== "string") return v;
  let s = v.replace(/\s/g, "");
  if (s === "") return v;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    s =
      s.lastIndexOf(",") > s.lastIndexOf(".")
        ? s.replace(/\./g, "").replace(",", ".") // „1.234,50" → 1234.50
        : s.replace(/,/g, ""); // „1,234.50" → 1234.50
  } else if (hasComma) {
    s = s.replace(",", "."); // „24,50" → 24.50
  }
  return Number(s);
}

/**
 * Sumă: acceptă virgulă sau punct (tastatură numerică RO), o convertește în număr.
 * Trebuie > 0 (aliniat cu check-ul din DB `amount > 0`).
 */
const amount = z.preprocess(
  parseAmount,
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
