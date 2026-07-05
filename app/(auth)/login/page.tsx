import Link from "next/link";

import { AuthForm } from "@/components/AuthForm";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { signInAction } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Bine ai revenit</h1>
        <p className="mb-6 text-sm text-muted">
          Autentifică-te ca să vezi finanțele gospodăriei.
        </p>

        {error === "oauth" ? (
          <p role="alert" className="mb-4 rounded-lg border border-expense/40 bg-expense/5 px-3 py-2 text-sm text-expense">
            Autentificarea cu Google a eșuat. E permisă doar pentru conturi care există deja.
          </p>
        ) : null}

        <AuthForm
          action={signInAction}
          submitLabel="Intră în cont"
          altText="Nu ai cont?"
          altHref="/register"
          altLinkLabel="Creează unul"
        />

        <p className="mt-3 text-center text-sm">
          <Link href="/forgot-password" className="text-muted hover:text-primary">
            Ți-ai uitat parola?
          </Link>
        </p>

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          sau
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleSignInButton />
      </div>
    </main>
  );
}
