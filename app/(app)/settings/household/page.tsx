import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getCurrentMembership,
  getCurrentUser,
} from "@/lib/auth/current-user";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listInvites } from "@/lib/data/invites";
import { InviteManager } from "@/components/settings/InviteManager";

/** Gospodărie: nume, membri, invitații (UI.md §3.6 + §4.1). Invitații doar pentru owner. */
export default async function HouseholdPage() {
  const [membership, user] = await Promise.all([
    getCurrentMembership(),
    getCurrentUser(),
  ]);
  if (!membership) redirect("/onboarding");

  const household = Array.isArray(membership.households)
    ? membership.households[0]
    : membership.households;
  const isOwner = membership.role === "owner";

  const supabase = await createServerSupabaseClient();
  const { data: members } = await supabase
    .from("household_members")
    .select("user_id, role, joined_at")
    .order("joined_at", { ascending: true });

  const invites = isOwner ? await listInvites() : [];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/settings"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Setări
        </Link>
        <h1 className="text-2xl font-bold">Gospodărie</h1>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-sm text-muted">Nume</p>
        <p className="text-lg font-semibold">{household?.name ?? "—"}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Membri ({members?.length ?? 0})</h2>
        <ul className="flex flex-col gap-2">
          {(members ?? []).map((m) => {
            const isMe = m.user_id === user?.id;
            return (
              <li
                key={m.user_id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-3"
              >
                <span className="font-medium">
                  {isMe ? user?.email ?? "Tu" : "Membru"}
                  {isMe ? " (tu)" : ""}
                </span>
                <span className="text-xs font-medium text-muted">
                  {m.role === "owner" ? "Owner" : "Membru"}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted">
          Numele membrilor apar după ce adăugăm profilurile (în curând).
        </p>
      </section>

      {isOwner ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Invitații</h2>
          <p className="text-sm text-muted">
            Generează un cod și trimite-l cuiva ca să se alăture gospodăriei.
          </p>
          <InviteManager invites={invites} />
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted">
          Doar owner-ul gospodăriei poate genera invitații.
        </p>
      )}
    </main>
  );
}
