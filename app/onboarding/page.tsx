import { redirect } from "next/navigation";

import { getCurrentMembership } from "@/lib/auth/current-user";
import { OnboardingForm } from "@/components/OnboardingForm";
import { JoinForm } from "@/components/JoinForm";

/**
 * Onboarding: userul fără gospodărie fie își creează una, fie se alătură uneia existente
 * printr-un cod de invitație. Dacă are deja gospodărie → dashboard. Un link de invitație
 * (`?invite=COD`) precompletează codul și deschide direct pe tab-ul de alăturare.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const [{ invite }, membership] = await Promise.all([
    searchParams,
    getCurrentMembership(),
  ]);
  if (membership) redirect("/");

  const hasInvite = Boolean(invite);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Bun venit! 👋</h1>
        <p className="mb-6 text-sm text-muted">
          {hasInvite
            ? "Ai fost invitat într-o gospodărie. Confirmă codul ca să te alături."
            : "Creează-ți gospodăria sau alătură-te uneia existente cu un cod de invitație."}
        </p>

        {hasInvite ? (
          <div className="flex flex-col gap-6">
            <JoinForm initialCode={invite} />
            <details className="text-sm">
              <summary className="cursor-pointer text-muted">
                Vrei să creezi o gospodărie nouă?
              </summary>
              <div className="mt-4">
                <OnboardingForm />
              </div>
            </details>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <OnboardingForm />
            <details className="text-sm">
              <summary className="cursor-pointer text-muted">
                Ai un cod de invitație?
              </summary>
              <div className="mt-4">
                <JoinForm />
              </div>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}
