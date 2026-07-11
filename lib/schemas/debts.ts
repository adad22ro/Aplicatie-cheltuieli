import { z } from "zod";

const money = (msg: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? Number(v.replace(",", ".").trim()) : v),
    z.number({ error: msg }).positive(msg).max(1_000_000_000, "Sumă prea mare"),
  );

const shortText = (max: number, msg: string) =>
  z.string().trim().max(max, msg);

const optionalNote = z
  .string()
  .trim()
  .max(200, "Nota e prea lungă (max 200)")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const optionalDate = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă"), z.literal(""), z.undefined()])
  .transform((v) => (v ? v : undefined));

const fields = {
  person: shortText(80, "Numele e prea lung (max 80)").pipe(
    z.string().min(1, "Persoana este obligatorie"),
  ),
  direction: z.enum(["borrowed", "lent"]).default("borrowed"),
  amount: money("Suma este obligatorie"),
  note: optionalNote,
  borrowed_date: optionalDate,
};

export const createDebtSchema = z.object(fields);
export const updateDebtSchema = z.object({
  id: z.string().uuid("ID invalid"),
  ...fields,
});
export const debtIdSchema = z.object({ id: z.string().uuid("ID invalid") });

/** O restituire (plată) pe o datorie. `amount` gol → se restituie tot restul (în acțiune). */
export const debtPaymentSchema = z.object({
  debt_id: z.string().uuid("ID invalid"),
  amount: money("Suma este obligatorie"),
  paid_date: optionalDate,
  note: optionalNote,
});

export const debtPaymentIdSchema = z.object({ id: z.string().uuid("ID invalid") });
