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

// --- Securitate: loguri, audit, RLS, integritate -----------------------------
async function security() {
  header("SECURITATE — loguri & verificări");
  if (!URL || !SERVICE) { line("URL sau SERVICE_ROLE lipsește — sar peste."); return; }
  const sb = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1) security_events: contoare pe 24h + ultimele 15
  try {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const kinds = ["login_failed", "login_success", "register_failed", "register_success", "admin_access_denied", "rate_limited"];
    line("Evenimente securitate (ultimele 24h):");
    for (const k of kinds) {
      const { count } = await sb.from("security_events").select("*", { count: "exact", head: true }).eq("event_type", k).gte("created_at", since);
      const flag = (["login_failed", "admin_access_denied", "rate_limited"].includes(k) && (count ?? 0) > 0) ? "  ⚠️" : "";
      line(`  ${k.padEnd(20)} ${count ?? 0}${flag}`);
    }
    const { data: recent } = await sb.from("security_events").select("event_type, email, ip, created_at").order("created_at", { ascending: false }).limit(15);
    if (recent?.length) {
      line("Ultimele evenimente:");
      for (const e of recent) line(`  [${e.event_type}] ${e.email ?? "—"} ${e.ip ?? ""} · ${new Date(e.created_at).toLocaleString("ro-RO")}`);
    } else {
      line("  (niciun eveniment încă)");
    }
  } catch (e) { line(`security_events EROARE: ${e.message ?? e} (ai rulat migrarea de securitate?)`); }

  // 2) admin_audit: ultimele acțiuni de admin
  try {
    const { data: audit } = await sb.from("admin_audit").select("action, created_at").order("created_at", { ascending: false }).limit(8);
    line("Ultimele acțiuni admin:");
    if (audit?.length) for (const a of audit) line(`  ${a.action} · ${new Date(a.created_at).toLocaleString("ro-RO")}`);
    else line("  (niciuna)");
  } catch (e) { line(`admin_audit EROARE: ${e.message ?? e}`); }

  // 3) Acoperire RLS: semnalează tabele fără RLS sau fără politici
  try {
    const { data: rls, error } = await sb.rpc("rls_status");
    if (error) throw error;
    // Problemă reală = RLS DEZACTIVAT. RLS activ + 0 politici = deny-all intenționat
    // (tabele doar-service_role: admin_audit, security_events, signup_codes).
    const bad = (rls ?? []).filter((r) => !r.rls_enabled);
    const denyAll = (rls ?? []).filter((r) => r.rls_enabled && r.policy_count === 0);
    if (bad.length === 0) line(`RLS: ✅ toate cele ${rls.length} tabele au RLS activ`);
    else {
      line(`RLS: ⚠️ ${bad.length} tabel(e) cu RLS DEZACTIVAT:`);
      for (const r of bad) line(`  ${r.table_name}: RLS DEZACTIVAT`);
    }
    if (denyAll.length) line(`  (deny-all, doar service_role: ${denyAll.map((r) => r.table_name).join(", ")})`);
  } catch (e) { line(`rls_status EROARE: ${e.message ?? e} (rulează migrarea de securitate)`); }

  // 4) Integritate rapidă
  try {
    const now = new Date().toISOString();
    const { data: users } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const { data: members } = await sb.from("household_members").select("user_id, household_id");
    const { data: households } = await sb.from("households").select("id").is("deleted_at", null);
    const memberIds = new Set((members ?? []).map((m) => m.user_id));
    const liveHh = new Set((households ?? []).map((h) => h.id));
    const noHousehold = (users?.users ?? []).filter((u) => !memberIds.has(u.id)).length;
    const orphanMembers = (members ?? []).filter((m) => !liveHh.has(m.household_id)).length;
    const { count: expiredCodes } = await sb.from("signup_codes").select("*", { count: "exact", head: true }).is("used_at", null).not("expires_at", "is", null).lt("expires_at", now);
    line("Integritate:");
    line(`  useri fără gospodărie: ${noHousehold}${noHousehold > 0 ? "  ⚠️" : ""}`);
    line(`  membri orfani (gospodărie ștearsă): ${orphanMembers}${orphanMembers > 0 ? "  ⚠️" : ""}`);
    line(`  coduri expirate nefolosite: ${expiredCodes ?? 0}`);
  } catch (e) { line(`integritate EROARE: ${e.message ?? e}`); }
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
await security();
await vercel();
line();
