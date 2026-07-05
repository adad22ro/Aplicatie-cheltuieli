import { z } from "zod";

const amount = z.preprocess(
  (v) => (typeof v === "string" ? Number(v.replace(",", ".").trim()) : v),
  z
    .number({ error: "Suma este obligatorie" })
    .positive("Suma trebuie să fie mai mare ca 0")
    .max(1_000_000_000, "Sumă prea mare"),
);

/** Setează/actualizează bugetul lunar al unei categorii. */
export const setBudgetSchema = z.object({
  category_id: z.string().uuid("Alege o categorie"),
  amount,
});

export const budgetIdSchema = z.object({ id: z.string().uuid("ID invalid") });
