import Link from "next/link";

import { requireAdmin } from "@/lib/auth/admin";

const NAV = [
  { href: "/admin", label: "Sumar" },
  { href: "/admin/codes", label: "Coduri" },
  { href: "/admin/users", label: "Useri" },
  { href: "/admin/activity", label: "Activitate" },
  { href: "/admin/debug", label: "Debug" },
];

/** Layout protejat: doar ADMIN_EMAIL trece de `requireAdmin`. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">⚙️ Admin</h1>
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Aplicație
        </Link>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
          >
            {n.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
