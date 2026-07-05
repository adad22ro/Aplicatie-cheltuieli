import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveHouseholdId } from "@/lib/auth/current-user";

/** Hub de setări cu sub-pagini (UI.md §3.6). Faza 1: categorii + metode de plată. */
export default async function SettingsPage() {
  const householdId = await getActiveHouseholdId();
  if (!householdId) redirect("/onboarding");

  const items = [
    { href: "/settings/categories", title: "Categorii", desc: "Venituri și cheltuieli, cu icon și culoare" },
    { href: "/settings/payment-methods", title: "Metode de plată", desc: "Cash, card, Revolut etc." },
    { href: "/settings/household", title: "Gospodărie", desc: "Membri și invitații" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold">Setări</h1>
      </header>

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:bg-background"
            >
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
              <span aria-hidden className="text-muted">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
