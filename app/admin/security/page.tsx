import { listSecurityEvents, getSecuritySummary } from "@/lib/data/security";

const LABELS: Record<string, string> = {
  login_failed: "Login eșuat",
  login_success: "Login reușit",
  register_failed: "Înregistrare eșuată",
  register_success: "Înregistrare reușită",
  admin_access_denied: "Acces admin refuzat",
  rate_limited: "Limitat (rate-limit)",
  password_reset: "Resetare parolă",
};

const TONE: Record<string, string> = {
  login_failed: "text-expense",
  register_failed: "text-expense",
  admin_access_denied: "text-expense",
  rate_limited: "text-amber-600",
  login_success: "text-muted",
  register_success: "text-income",
};

export default async function AdminSecurityPage() {
  const [events, summary] = await Promise.all([
    listSecurityEvents(80),
    getSecuritySummary(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Contoare 24h */}
      <section className="grid grid-cols-3 gap-2">
        {[
          { label: "Login-uri eșuate", value: summary.failedLogins24h },
          { label: "Rate-limited", value: summary.rateLimited24h },
          { label: "Acces admin refuzat", value: summary.adminDenied24h },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-surface p-3 text-center">
            <p className={`text-2xl font-bold tabular-nums ${c.value > 0 ? "text-expense" : "text-foreground"}`}>
              {c.value}
            </p>
            <p className="mt-1 text-[11px] text-muted">{c.label}</p>
          </div>
        ))}
      </section>
      <p className="-mt-4 text-xs text-muted">Ultimele 24 de ore.</p>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Jurnal evenimente (ultimele 80)</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted">Niciun eveniment încă.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 flex-col">
                  <span className={`font-medium ${TONE[e.event_type] ?? "text-foreground"}`}>
                    {LABELS[e.event_type] ?? e.event_type}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {e.email ?? "—"}
                    {e.ip ? ` · ${e.ip}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {new Date(e.created_at).toLocaleString("ro-RO")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
