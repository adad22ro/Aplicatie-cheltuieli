// Raport de debug consolidat — stare + erori pentru acest proiect (Supabase + Vercel).
// Rulare: npm run debug   (încarcă automat .env.local)
//
// Scop: când apare o eroare, acest script oferă o imagine completă într-un singur loc,
// ca diagnoza să fie rapidă (inclusiv pentru asistentul AI care depanează).
// Stack: Next.js + Supabase (Auth + Postgres, RLS). Fără Clerk/Stripe.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- Încărcare .env.local (fără dependențe) ----------------------------------
try {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    if (!l || l.startsWith("#") || !l.includes("=")) continue;
    const i = l.indexOf("=");
    const k = l.slice(0, i).trim();
    if (!(k in process.env)) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
} catch {
  // .env.local lipsește — ne bazăm pe env-ul deja setat.
}

const line = (s = "") => console.log(s);
const header = (s) => { line(); line(`=== ${s} ===`); };
const mask = (v) => (v ? v.slice(0, 6) + "…" + v.slice(-4) + ` (len ${v.length})` : "LIPSEȘTE");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

// --- Env: ce e configurat ----------------------------------------------------
function envCheck() {
  header("ENV (.env.local)");
  line(`NEXT_PUBLIC_SUPABASE_URL:      ${URL ?? "LIPSEȘTE"}`);
  line(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${mask(ANON)}`);
  line(`SUPABASE_SERVICE_ROLE_KEY:     ${mask(SERVICE)}`);
  line(`VERCEL_API_TOKEN:              ${process.env.VERCEL_API_TOKEN ? "prezent" : "lipsește"}`);
}

// --- Supabase: date + auth ---------------------------------------------------
async function supabase() {
  header("SUPABASE — date");
  if (!URL || !SERVICE) { line("URL sau SERVICE_ROLE lipsește — sar peste."); return; }
  const sb = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

  // Utilizatori auth
  try {
    const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) throw error;
    const users = data.users ?? [];
    line(`auth.users: ${users.length} conturi`);
    for (const u of users.slice(0, 8)) {
      const conf = u.email_confirmed_at ? "confirmat" : "NECONFIRMAT";
      line(`  ${u.email ?? u.id}  [${conf}]  ${new Date(u.created_at).toLocaleString("ro-RO")}`);
    }
  } catch (e) { line(`auth.users EROARE: ${e.message ?? e}`); }

  // Numărători pe tabelele de date
  const tables = ["households", "household_members", "categories", "payment_methods", "transactions"];
  for (const t of tables) {
    const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
    line(`  ${t}: ${error ? "EROARE " + error.message : count + " rânduri"}`);
  }
}

// --- Auth probe: reproduce eroarea reală de signup ---------------------------
async function authProbe() {
  header("SUPABASE — probă signup (anon, ca aplicația)");
  if (!URL || !ANON) { line("URL sau ANON lipsește — sar peste."); return; }
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const email = `debug-probe-${Date.now()}@gmail.com`;
  const { data, error } = await c.auth.signUp({ email, password: "Parola-Debug-123!" });
  line(`email test: ${email}`);
  if (error) {
    line(`❌ signUp EROARE: [${error.code ?? error.status}] ${error.message}`);
    if (error.code === "over_email_send_rate_limit") {
      line("   → Supabase încearcă să trimită email de confirmare și a atins rate limit-ul.");
      line("   → Fix: dezactivează 'Confirm email' SAU configurează SMTP custom (Resend).");
    }
  } else {
    line(`✅ signUp OK — session: ${!!data.session}, user: ${data.user?.id ?? "?"}`);
    line(data.session ? "   → Confirmare email OFF (sesiune instant)." : "   → Confirmare email ON (fără sesiune; user așteaptă confirmarea).");
    // curăță userul de probă dacă avem service_role
    if (SERVICE && data.user?.id) {
      const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
      await admin.auth.admin.deleteUser(data.user.id);
      line("   (user de probă șters)");
    }
  }
}

// --- Vercel: deploys + loguri deploy eșuat -----------------------------------
async function vercel() {
  header("VERCEL");
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) { line("VERCEL_API_TOKEN lipsește — sar peste. (opțional; adaugă-l pentru loguri de deploy)"); return; }
  const team = process.env.VERCEL_TEAM_ID ? `&teamId=${process.env.VERCEL_TEAM_ID}` : "";
  const app = process.env.VERCEL_PROJECT_NAME ?? "aplicatie-cheltuieli";
  try {
    const res = await fetch(`https://api.vercel.com/v6/deployments?app=${app}&limit=6${team}`,
      { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const { deployments = [] } = await res.json();
    line(`Ultimele ${deployments.length} deploy-uri:`);
    let firstError = null;
    for (const d of deployments) {
      const state = d.state ?? d.readyState;
      if (state === "ERROR" && !firstError) firstError = d;
      line(`  [${state}] ${d.meta?.githubCommitMessage ?? d.url}`);
    }
    if (firstError) {
      header("VERCEL — LOGURI DEPLOY EȘUAT");
      const ev = await fetch(`https://api.vercel.com/v3/deployments/${firstError.uid}/events?limit=100${team}`,
        { headers: { Authorization: `Bearer ${token}` } });
      if (ev.ok) {
        const json = await ev.json();
        const events = Array.isArray(json) ? json : json.events ?? [];
        for (const e of events) {
          const text = (e.payload?.text ?? e.text ?? "").trim();
          if (text) line(`  ${text}`);
        }
      }
    }
  } catch (e) { line(`EROARE: ${e.message ?? e}`); }
}

line("RAPORT DEBUG — " + new Date().toLocaleString("ro-RO"));
envCheck();
await supabase();
await authProbe();
await vercel();
line();
