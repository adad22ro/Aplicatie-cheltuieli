import { redirect } from "next/navigation";

import { getCurrentMembership } from "@/lib/auth/current-user";
import { OnboardingForm } from "@/components/OnboardingForm";

/**
 * Onboarding: crearea primei gospodării. Dacă userul are deja o gospodărie, îl trimitem
 * direct la dashboard. (Intrarea cu cod de invitație e faza 2.)
 */
export default async function OnboardingPage() {
  const membership = await getCurrentMembership();
  if (membership) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Bun venit! 👋</h1>
        <p className="mb-6 text-sm text-muted">
          Creează-ți gospodăria ca să începeți să țineți evidența banilor împreună.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}
