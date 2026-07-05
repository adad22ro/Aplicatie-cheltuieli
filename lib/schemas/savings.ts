import { z } from "zod";

const money = (msg: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? Number(v.replace(",", ".").trim()) : v),
    z.number({ error: msg }).positive(msg).max(1_000_000_000, "Sumă prea mare"),
  );

const fields = {
  name: z
    .string()
    .trim()
    .min(1, "Numele este obligatoriu")
    .max(60, "Numele e prea lung (max 60)"),
  target_amount: money("Ținta este obligatorie"),
  deadline: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(""), z.null(), z.undefined()])
    .transform((v) => (v ? v : null)),
};

export const createGoalSchema = z.object(fields);
export const updateGoalSchema = z.object({ id: z.string().uuid("ID invalid"), ...fields });
export const goalIdSchema = z.object({ id: z.string().uuid("ID invalid") });

export const contributeSchema = z.object({
  id: z.string().uuid("ID invalid"),
  amount: money("Suma este obligatorie"),
  direction: z.enum(["add", "withdraw"]),
});
