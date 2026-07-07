"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const KEY = "due-gen-day";

/** Declanșează generarea tranzacțiilor scadente în fundal, cel mult o dată pe zi
 *  per browser. Nu blochează randarea; dacă s-a generat ceva, reîmprospătează. */
export function GenerateDueOnLoad() {
  const router = useRouter();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(KEY) === today) return;
    } catch {
      // localStorage indisponibil — rulăm oricum
    }

    let cancelled = false;
    fetch("/api/generate-due", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then(() => {
        if (cancelled) return;
        try {
          localStorage.setItem(KEY, today);
        } catch {
          // ignorăm
        }
        // Actualizează datele serverului (eventualele tranzacții nou generate).
        router.refresh();
      })
      .catch(() => {
        // eșec silențios — se reîncearcă la următoarea încărcare
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
