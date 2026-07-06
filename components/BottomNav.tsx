"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Iconițe inline (stroke = currentColor) ca să nu adăugăm dependențe. */
const icons = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </>
  ),
  budgets: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v9l6.5 3.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 7l1.9 1.1M17.9 15.9l1.9 1.1M4.2 17l1.9-1.1M17.9 8.1 19.8 7M2.5 12h2.2M19.3 12h2.2" />
    </>
  ),
} as const;

type Item = { href: string; label: string; icon: keyof typeof icons };

const ITEMS: Item[] = [
  { href: "/", label: "Acasă", icon: "home" },
  { href: "/transactions", label: "Tranzacții", icon: "list" },
  { href: "/budgets", label: "Bugete", icon: "budgets" },
  { href: "/settings", label: "Setări", icon: "settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** Bară de navigare fixă jos + buton central „+" ridicat (varianta 1a). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigare principală"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-center px-2">
        {/* stânga: Acasă, Tranzacții */}
        {ITEMS.slice(0, 2).map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        {/* centru: FAB adaugă */}
        <div className="flex justify-center">
          <Link
            href="/transactions/new"
            aria-label="Adaugă tranzacție"
            className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-95"
            style={{ boxShadow: "0 6px 16px color-mix(in srgb, var(--primary) 45%, transparent)" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>

        {/* dreapta: Bugete, Setări */}
        {ITEMS.slice(2).map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
        active ? "text-primary" : "text-muted hover:text-foreground"
      }`}
    >
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icons[item.icon]}
      </svg>
      {item.label}
    </Link>
  );
}
