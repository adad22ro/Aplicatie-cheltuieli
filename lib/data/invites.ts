import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type InviteStatus = "active" | "used" | "expired";

export type Invite = {
  id: string;
  code: string;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
  status: InviteStatus;
};

function statusOf(row: { used_at: string | null; expires_at: string | null }): InviteStatus {
  if (row.used_at) return "used";
  if (row.expires_at && new Date(row.expires_at) <= new Date()) return "expired";
  return "active";
}

/** Invitațiile gospodăriei (RLS scoped), cele mai noi întâi, cu status derivat. */
export async function listInvites(): Promise<Invite[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("household_invites")
    .select("id, code, expires_at, used_at, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({ ...row, status: statusOf(row) }));
}
