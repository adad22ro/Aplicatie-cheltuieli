import { z } from "zod";

const value = z.preprocess(
  (v) => (typeof v === "string" ? Number(v.replace(",", ".").trim()) : v),
  z.number({ error: "Valoarea e obligatorie" }).min(0, "Nu poate fi negativ").max(1_000_000_000),
);

export const idSchema = z.object({ id: z.string().uuid("ID invalid") });

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1, "Denumirea e obligatorie").max(60, "Prea lung"),
});

export const addLineSchema = z
  .object({
    template_id: z.string().uuid("Șablon invalid"),
    category_id: z.union([z.string().uuid(), z.literal("")]).transform((v) => (v ? v : null)),
    label: z.string().trim().max(100).optional().transform((v) => (v && v.length > 0 ? v : null)),
    mode: z.enum(["fixed", "percent"]),
    value,
  })
  .refine((d) => d.category_id || d.label, {
    message: "Alege o categorie sau scrie un nume",
    path: ["category_id"],
  })
  .refine((d) => d.mode !== "percent" || d.value <= 100, {
    message: "Procentul nu poate depăși 100",
    path: ["value"],
  });

export const applyTemplateSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Lună invalidă"),
  template_id: z.string().uuid("Șablon invalid"),
});
