import { redirect } from "next/navigation";

import { getCurrentMembership } from "@/lib/auth/current-user";
import { OnboardingForm } from "@/components/OnboardingForm";
import { JoinForm } from "@/components/JoinForm";

/**
 * Onboarding: userul fără gospodărie își creează una. Cine sosește printr-un link de
 * invitație (`?invite=COD`) vede în schimb formularul de alăturare (cu creare ca opțiune
 * secundară). Fără link, ecranul e curat — doar crearea. Dacă are deja gospodărie → dashboard.
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
            : "Creează-ți gospodăria ca să începi."}
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
          <OnboardingForm />
        )}
      </div>
    </main>
  );
}
