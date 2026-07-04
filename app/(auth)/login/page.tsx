import { AuthForm } from "@/components/AuthForm";
import { signInAction } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Bine ai revenit</h1>
        <p className="mb-6 text-sm text-muted">
          Autentifică-te ca să vezi finanțele gospodăriei.
        </p>
        <AuthForm
          action={signInAction}
          submitLabel="Intră în cont"
          altText="Nu ai cont?"
          altHref="/register"
          altLinkLabel="Creează unul"
        />
      </div>
    </main>
  );
}
