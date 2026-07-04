import { AuthForm } from "@/components/AuthForm";
import { signUpAction } from "@/lib/actions/auth";

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Cont nou</h1>
        <p className="mb-6 text-sm text-muted">
          Creează-ți contul, apoi îți faci gospodăria.
        </p>
        <AuthForm
          action={signUpAction}
          submitLabel="Creează cont"
          altText="Ai deja cont?"
          altHref="/login"
          altLinkLabel="Autentifică-te"
        />
      </div>
    </main>
  );
}
