import { z } from "zod";

const money = (msg: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? Number(v.replace(",", ".").trim()) : v),
    z.number({ error: msg }).positive(msg).max(1_000_000_000, "Sumă prea mare"),
  );

const optionalUuid = z
  .union([z.string().uuid(), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v ? v : null));

const fields = {
  name: z
    .string()
    .trim()
    .min(1, "Numele este obligatoriu")
    .max(60, "Numele e prea lung (max 60)"),
  total_amount: money("Totalul este obligatoriu"),
  total_installments: z.coerce
    .number({ error: "Numărul de rate este obligatoriu" })
    .int("Număr invalid")
    .min(1, "Minim 1 rată")
    .max(600, "Prea multe rate"),
  category_id: z.string().uuid("Alege o categorie"),
  payment_method_id: optionalUuid,
  day_of_month: z.coerce
    .number({ error: "Ziua este obligatorie" })
    .int()
    .min(1, "Ziua trebuie să fie între 1 și 31")
    .max(31, "Ziua trebuie să fie între 1 și 31"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă"),
  // Rată variabilă (ex: credit cu dobândă variabilă): suma fiecărei rate o completezi la scadență.
  is_variable: z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.boolean(),
  ),
};

export const createInstallmentSchema = z.object(fields);
export const updateInstallmentSchema = z.object({
  id: z.string().uuid("ID invalid"),
  ...fields,
});
export const installmentIdSchema = z.object({ id: z.string().uuid("ID invalid") });

/** Rata lunară derivată din total și număr de rate (2 zecimale). */
export function installmentAmount(total: number, count: number): number {
  return Math.round((total / count) * 100) / 100;
}
