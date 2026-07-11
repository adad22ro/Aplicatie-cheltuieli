"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser, getActiveHouseholdId } from "@/lib/auth/current-user";
import {
  createDebtSchema,
  updateDebtSchema,
  debtIdSchema,
  debtPaymentSchema,
  debtPaymentIdSchema,
} from "@/lib/schemas/debts";

export type DebtActionState = { error: string } | undefined;

type Supabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type Direction = "borrowed" | "lent";

const PATH = "/debts";
const today = () => new Date().toISOString().slice(0, 10);

function revalidate() {
  revalidatePath(PATH);
  revalidatePath("/");
  revalidatePath("/transactions");
}

/** Găsește (sau creează) categoria „Datorii" a gospodăriei — folosită pe tranzacțiile de datorii. */
async function ensureDebtCategory(
  supabase: Supabase,
  householdId: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("household_id", householdId)
    .eq("name", "Datorii")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("categories")
    .insert({
      household_id: householdId,
      name: "Datorii",
      type: "expense",
      icon: "🤝",
      color: "#94a3b8",
    })
    .select("id")
    .single();
  return created?.id ?? null;
}

/** Creează o tranzacție de datorie (source='debt') și întoarce id-ul ei. */
async function createDebtTx(
  supabase: Supabase,
  args: {
    householdId: string;
    userId: string;
    amount: number;
    type: "income" | "expense";
    date: string;
    note: string;
    sourceId: string;
  },
): Promise<string | null> {
  const categoryId = await ensureDebtCategory(supabase, args.householdId);
  if (!categoryId) return null;
  const { data } = await supabase
    .from("transactions")
    .insert({
      household_id: args.householdId,
      user_id: args.userId,
      amount: args.amount,
      type: args.type,
      category_id: categoryId,
      date: args.date,
      note: args.note,
      source: "debt",
      source_id: args.sourceId,
    })
    .select("id")
    .single();
  return data?.id ?? null;
}

async function softDeleteTx(supabase: Supabase, txId: string | null): Promise<void> {
  if (!txId) return;
  await supabase
    .from("transactions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", txId);
}

/** Tipul tranzacției pentru împrumutul inițial. borrowed = primesc bani (venit); lent = dau bani (cheltuială). */
const initialType = (d: Direction): "income" | "expense" =>
  d === "borrowed" ? "income" : "expense";
/** Restituirea e mișcarea inversă împrumutului. */
const repayType = (d: Direction): "income" | "expense" =>
  d === "borrowed" ? "expense" : "income";

/** Adaugă o datorie + tranzacția împrumutului inițial (intră în soldul lunii). */
export async function createDebtAction(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const [user, householdId] = await Promise.all([
    getCurrentUser(),
    getActiveHouseholdId(),
  ]);
  if (!householdId) redirect("/onboarding");
  if (!user) return { error: "Sesiune expirată. Reautentifică-te." };

  const parsed = createDebtSchema.safeParse({
    person: formData.get("person"),
    direction: formData.get("direction"),
    amount: formData.get("amount"),
    note: formData.get("note"),
    borrowed_date: formData.get("borrowed_date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { person, direction, amount, note, borrowed_date } = parsed.data;
  const date = borrowed_date ?? today();

  const supabase = await createServerSupabaseClient();
  const { data: debt, error } = await supabase
    .from("debts")
    .insert({
      household_id: householdId,
      user_id: user.id,
      person,
      direction,
      amount,
      note,
      borrowed_date: date,
    })
    .select("id")
    .single();
  if (error || !debt) return { error: "Nu am putut salva datoria. Încearcă din nou." };

  const txNote =
    direction === "borrowed" ? `Împrumut de la ${person}` : `Împrumut către ${person}`;
  const txId = await createDebtTx(supabase, {
    householdId,
    userId: user.id,
    amount,
    type: initialType(direction),
    date,
    note: txNote,
    sourceId: debt.id,
  });
  if (txId) {
    await supabase.from("debts").update({ transaction_id: txId }).eq("id", debt.id);
  }

  revalidate();
  return undefined;
}

/** Editează o datorie și sincronizează tranzacția împrumutului inițial. */
export async function updateDebtAction(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const parsed = updateDebtSchema.safeParse({
    id: formData.get("id"),
    person: formData.get("person"),
    direction: formData.get("direction"),
    amount: formData.get("amount"),
    note: formData.get("note"),
    borrowed_date: formData.get("borrowed_date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { id, person, direction, amount, note, borrowed_date } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: current } = await supabase
    .from("debts")
    .select("transaction_id, borrowed_date")
    .eq("id", id)
    .maybeSingle();

  const date = borrowed_date ?? current?.borrowed_date ?? today();
  const { error } = await supabase
    .from("debts")
    .update({ person, direction, amount, note, borrowed_date: date })
    .eq("id", id);
  if (error) return { error: "Nu am putut actualiza datoria." };

  // Sincronizează tranzacția inițială (sumă, tip, dată, notă).
  if (current?.transaction_id) {
    const txNote =
      direction === "borrowed" ? `Împrumut de la ${person}` : `Împrumut către ${person}`;
    await supabase
      .from("transactions")
      .update({ amount, type: initialType(direction), date, note: txNote })
      .eq("id", current.transaction_id);
  }

  revalidate();
  redirect(PATH);
}

/** Șterge (soft) o datorie + tranzacția inițială + tranzacțiile tuturor restituirilor. */
export async function deleteDebtAction(formData: FormData): Promise<void> {
  const parsed = debtIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const id = parsed.data.id;

  const supabase = await createServerSupabaseClient();
  const [{ data: debt }, { data: payments }] = await Promise.all([
    supabase.from("debts").select("transaction_id").eq("id", id).maybeSingle(),
    supabase.from("debt_payments").select("transaction_id").eq("debt_id", id),
  ]);

  await softDeleteTx(supabase, debt?.transaction_id ?? null);
  for (const p of payments ?? []) {
    await softDeleteTx(supabase, p.transaction_id ?? null);
  }
  await supabase
    .from("debts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  revalidate();
}

/** Înregistrează o restituire + tranzacția ei (mișcarea inversă a împrumutului). */
export async function addDebtPaymentAction(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const [user, householdId] = await Promise.all([
    getCurrentUser(),
    getActiveHouseholdId(),
  ]);
  if (!householdId) redirect("/onboarding");
  if (!user) return { error: "Sesiune expirată. Reautentifică-te." };

  const parsed = debtPaymentSchema.safeParse({
    debt_id: formData.get("debt_id"),
    amount: formData.get("amount"),
    paid_date: formData.get("paid_date"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { debt_id, amount, paid_date, note } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: debt } = await supabase
    .from("debts")
    .select("direction, person")
    .eq("id", debt_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!debt) return { error: "Datoria nu există." };

  const result = await recordPayment(supabase, {
    householdId,
    userId: user.id,
    debtId: debt_id,
    direction: debt.direction as Direction,
    person: debt.person,
    amount,
    date: paid_date ?? today(),
    note,
  });
  if (!result) return { error: "Nu am putut salva restituirea." };

  revalidate();
  return undefined;
}

/** Inserează o restituire și tranzacția ei legată. Refolosit de addDebtPayment și settle. */
async function recordPayment(
  supabase: Supabase,
  args: {
    householdId: string;
    userId: string;
    debtId: string;
    direction: Direction;
    person: string;
    amount: number;
    date: string;
    note: string | null;
  },
): Promise<boolean> {
  const { data: payment, error } = await supabase
    .from("debt_payments")
    .insert({
      debt_id: args.debtId,
      household_id: args.householdId,
      user_id: args.userId,
      amount: args.amount,
      note: args.note,
      paid_date: args.date,
    })
    .select("id")
    .single();
  if (error || !payment) return false;

  const txNote =
    args.direction === "borrowed"
      ? `Restituire către ${args.person}`
      : `Restituire de la ${args.person}`;
  const txId = await createDebtTx(supabase, {
    householdId: args.householdId,
    userId: args.userId,
    amount: args.amount,
    type: repayType(args.direction),
    date: args.date,
    note: txNote,
    sourceId: payment.id,
  });
  if (txId) {
    await supabase
      .from("debt_payments")
      .update({ transaction_id: txId })
      .eq("id", payment.id);
  }
  return true;
}

/** Șterge (soft) o restituire + tranzacția ei. */
export async function deleteDebtPaymentAction(formData: FormData): Promise<void> {
  const parsed = debtPaymentIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  const { data: payment } = await supabase
    .from("debt_payments")
    .select("transaction_id")
    .eq("id", parsed.data.id)
    .maybeSingle();

  await softDeleteTx(supabase, payment?.transaction_id ?? null);
  await supabase
    .from("debt_payments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id);

  revalidate();
}

/**
 * „Am înapoiat tot" — restul rămas devine o restituire (cu tranzacție) și se marchează închiderea.
 */
export async function settleDebtAction(formData: FormData): Promise<void> {
  const parsed = debtIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const id = parsed.data.id;

  const [user, householdId] = await Promise.all([
    getCurrentUser(),
    getActiveHouseholdId(),
  ]);
  if (!householdId || !user) return;

  const supabase = await createServerSupabaseClient();
  const { data: debt } = await supabase
    .from("debts")
    .select("amount, direction, person, payments:debt_payments(amount, deleted_at)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!debt) return;

  const amount = typeof debt.amount === "string" ? Number(debt.amount) : debt.amount;
  const paid = ((debt.payments ?? []) as Array<{ amount: number | string; deleted_at: string | null }>)
    .filter((p) => p.deleted_at === null)
    .reduce((s, p) => s + (typeof p.amount === "string" ? Number(p.amount) : p.amount), 0);
  const remaining = Math.round((amount - paid) * 100) / 100;

  if (remaining > 0) {
    await recordPayment(supabase, {
      householdId,
      userId: user.id,
      debtId: id,
      direction: debt.direction as Direction,
      person: debt.person,
      amount: remaining,
      date: today(),
      note: "Restituit integral",
    });
  }
  await supabase
    .from("debts")
    .update({ settled_at: new Date().toISOString() })
    .eq("id", id);

  revalidate();
}

/** Redeschide o datorie închisă (scoate marcajul `settled_at`). Tranzacțiile rămân. */
export async function reopenDebtAction(formData: FormData): Promise<void> {
  const parsed = debtIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase.from("debts").update({ settled_at: null }).eq("id", parsed.data.id);

  revalidate();
}
