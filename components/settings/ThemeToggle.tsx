"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";

const OPTIONS: { mode: Mode; label: string; icon: string }[] = [
  { mode: "light", label: "Luminos", icon: "☀️" },
  { mode: "dark", label: "Întunecat", icon: "🌙" },
  { mode: "system", label: "Sistem", icon: "💻" },
];

/** Aplică tema pe <html> și o ține minte în localStorage (cheia „theme"),
 *  la fel cum citește scriptul anti-flash din layout. */
function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === "dark") {
    localStorage.setItem("theme", "dark");
    root.classList.add("dark");
  } else if (mode === "light") {
    localStorage.setItem("theme", "light");
    root.classList.remove("dark");
  } else {
    localStorage.removeItem("theme");
    const sys = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", sys);
  }
}

/** Comutator Luminos / Întunecat / Sistem. */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  // Citește preferința salvată la montare (sincronizare cu un sistem extern —
  // stocarea browserului). Un singur set, nu buclă de randări.
  useEffect(() => {
    let saved: Mode = "system";
    try {
      const v = localStorage.getItem("theme");
      if (v === "dark" || v === "light") saved = v;
    } catch {
      // ignorăm
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(saved);
  }, []);

  // Când e pe „Sistem", urmărește schimbarea temei telefonului.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const choose = (m: Mode) => {
    setMode(m);
    apply(m);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Temă"
      className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1"
    >
      {OPTIONS.map((o) => {
        const active = mode === o.mode;
        return (
          <button
            key={o.mode}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(o.mode)}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
              active ? "bg-primary text-white" : "text-muted hover:bg-background"
            }`}
          >
            <span aria-hidden>{o.icon}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
