import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Health check pentru monitoare externe (Better Stack / UptimeRobot) sau un cron.
 * Verifică că PostgREST + baza de date răspund (query HEAD cu cheia anon — RLS întoarce 0
 * rânduri, dar absența erorii confirmă că lanțul e viu). 200 = ok, 503 = degradat.
 */
export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbError: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("households")
      .select("*", { count: "exact", head: true });
    if (error) dbError = error.message;
    else dbOk = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : "unknown";
  }

  const ok = dbOk;
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      checks: { database: dbOk ? "ok" : "fail", ...(dbError ? { dbError } : {}) },
      latencyMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
