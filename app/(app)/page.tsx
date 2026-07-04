import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentMembership, getCurrentUser } from "@/lib/auth/current-user";
import { signOutAction } from "@/lib/actions/auth";

/**
 * Dashboard (placeholder). Deocamdată confirmă doar fluxul de auth + gospodărie:
 * dacă userul nu are gospodărie → onboarding. Sumarul lunar cu carry-over vine la pasul 6.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/onboarding");
  }

  // households vine ca relație; poate fi obiect sau array în funcție de inferență.
  const household = Array.isArray(membership.households)
    ? membership.households[0]
    : membership.households;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">Gospodărie</p>
          <h1 className="text-2xl font-bold">{household?.name ?? "—"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-background"
          >
            Setări
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-background"
            >
              Ieși
            </button>
          </form>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-sm text-muted">Autentificat ca</p>
        <p className="font-semibold">{user?.email}</p>
        <p className="mt-3 text-sm text-muted">
          Rol: <span className="font-medium text-foreground">{membership.role}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
        Dashboard-ul cu venituri, cheltuieli și sold vine în curând.
      </div>
    </main>
  );
}
