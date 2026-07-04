/**
 * Hook rulat de Next.js o singură dată la pornirea serverului.
 * Importăm `lib/env` aici ca validarea variabilelor de mediu să ruleze la BOOT
 * (fail-fast): dacă lipsește ceva obligatoriu, procesul crapă imediat cu mesaj clar,
 * nu la primul request cu un 500 obscur.
 */
export async function register() {
  // Doar pe runtime-ul Node (nu edge), unde validăm configul de server.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/env");
  }
}
