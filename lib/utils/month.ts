/**
 * Utilitare pentru luna curentă în format `YYYY-MM`. Pure (folosibile client + server).
 * Datele tranzacțiilor sunt `YYYY-MM-DD`, deci comparațiile pe lună se fac pe string.
 */

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Luna curentă locală ca `YYYY-MM`. */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Validează un input de lună; dacă e invalid, întoarce luna curentă. */
export function normalizeMonth(input: string | undefined | null): string {
  return input && MONTH_RE.test(input) ? input : currentMonth();
}

/** Luna anterioară (`YYYY-MM`). */
export function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y!, m! - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Luna următoare (`YYYY-MM`). */
export function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y!, m!, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Prima zi a lunii ca `YYYY-MM-DD` (folosit la comparații pe interval). */
export function monthStart(month: string): string {
  return `${month}-01`;
}

/** Prima zi a lunii următoare ca `YYYY-MM-DD` (limită superioară exclusivă). */
export function nextMonthStart(month: string): string {
  return monthStart(nextMonth(month));
}

const labelFmt = new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric" });

/** Etichetă lizibilă, ex: „iulie 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return labelFmt.format(new Date(y!, m! - 1, 1));
}

/** True dacă luna dată e luna curentă sau în viitor (pentru a bloca navigarea înainte). */
export function isCurrentOrFuture(month: string): boolean {
  return month >= currentMonth();
}

/** Câte zile are luna `YYYY-MM`. */
export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y!, m!, 0).getDate();
}

/**
 * Câte blocuri de 7 zile (săptămâni) are luna — aliniat cu vizualizarea săptămânală:
 * 1–7, 8–14, … Ultimul bloc poate fi mai scurt. Ex: 31 de zile → 5.
 */
export function weekBlocksInMonth(month: string): number {
  return Math.ceil(daysInMonth(month) / 7);
}

/** Eticheta intervalului de zile al săptămânii `w` (1-based) din lună, ex: „8–14". */
export function weekRange(month: string, w: number): string {
  const total = daysInMonth(month);
  const from = (w - 1) * 7 + 1;
  const to = Math.min(from + 6, total);
  return `${from}–${to}`;
}
