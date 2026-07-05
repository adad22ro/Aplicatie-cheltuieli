import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Cont nou</h1>
        <p className="mb-6 text-sm text-muted">
          Ai nevoie de un cod de invitație de la administrator.
        </p>
        <RegisterForm initialCode={code} />
      </div>
    </main>
  );
}
