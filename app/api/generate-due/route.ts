import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Generează „lazy" tranzacțiile scadente (recurențe + rate) pentru userul curent.
 * Rulează cu sesiunea userului (RPC-urile sunt SECURITY DEFINER și folosesc `auth.uid()`),
 * deci middleware-ul de auth îl protejează oricum.
 *
 * Mutat de pe randarea dashboard-ului (unde bloca fiecare încărcare cu 2 dus-întorsuri)
 * — acum e apelat în fundal de client, cel mult o dată pe zi (vezi GenerateDueOnLoad).
 * RPC-urile sunt idempotente, deci re-apelurile sunt inofensive.
 */
export async function POST() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  await Promise.all([
    supabase.rpc("generate_due_recurring"),
    supabase.rpc("generate_due_installments"),
  ]);

  return NextResponse.json({ ok: true });
}
