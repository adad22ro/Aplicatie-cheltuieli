# Status proiect: Gospodărie — gestiune financiară
Ultima actualizare: 2026-07-05

## Profil și decizii de bază
- Profil: **B** (multi-tenant pe gospodărie) | Auth: **Supabase Auth** (RLS pe `auth.uid()`)
- Structură: **flat** (fără `src/`) | Plăți: **nu** | Cheia de tenant: `household_id` via `household_members`
- Stack: Next.js 16.2 + React 19.2 + TS strict + Tailwind v4 + Supabase (Postgres 17)
- ⚠️ Next 16 și Tailwind v4 diferă de training — verifică `node_modules/next/dist/docs/` înainte de cod Next.

## Model de date (aplicat în DB — migrare 20260704150519)
10 tabele (PLAN §5), toate cu RLS activat + soft delete (`deleted_at`):
- `households`, `household_members` (rol owner/member), `household_invites`
- `categories`, `payment_methods`, `transactions` (inima app)
- `recurring_transactions`, `installment_plans`, `budgets`, `savings_goals`
- Enum-uri: `household_role`, `entry_type`, `transaction_source`, `recurring_frequency`
- **RLS:** helper `is_household_member(hid)` / `is_household_owner(hid)` SECURITY DEFINER (evită recursiune). Membru → CRUD pe date; owner → gestiune membri/invitații/redenumire.
- **RPC `create_household(name)`** SECURITY DEFINER = bootstrap atomic owner. `households` NU are politică INSERT (creare doar prin RPC).

## Fișiere: ✅ gata / 🔶 în lucru / ⬜ de făcut
- ✅ Setup Next.js + config (tsconfig strict + noUncheckedIndexedAccess, `.env.example`, `.env.local`)
- ✅ `lib/env.ts` (fail-fast Zod) + `instrumentation.ts` (validare la boot)
- ✅ `lib/supabase/server.ts` + `client.ts` (anon, @supabase/ssr, server-only)
- ✅ `supabase/migrations/20260704150519_schema_initial.sql` (aplicat pe remote)
- ✅ `types/database.ts` (generat)
- ✅ `CLAUDE.md` + docs actualizate (DEVLOG, DEVELOPER, CHANGELOG)
- ✅ Design tokens (`globals.css`) + dark mode class strategy + layout RO/Nunito
- ✅ Sesiune: `proxy.ts` + `lib/supabase/proxy.ts` (protecție rute, refresh token)
- ✅ Auth: `lib/actions/auth.ts`, `lib/schemas/auth.ts`, `lib/auth/current-user.ts`, `components/AuthForm.tsx`, pagini `(auth)/login` + `(auth)/register`
- ✅ Onboarding: `lib/actions/household.ts`, `components/OnboardingForm.tsx`, `app/onboarding/`
- ✅ Dashboard placeholder `app/(app)/page.tsx` (verificat: /→/login, /login & /register 200)
- ✅ Test izolare RLS (2 conturi, script anon+service_role) — 10/10 OK (izolare select/insert cross-tenant, auto-adăugare membru blocată, INSERT direct households blocat). Useri de test șterși după.
- ✅ CRUD categorii + metode de plată (pasul 4) — `/settings` hub + `/settings/categories` (income/expense, icon emoji + culoare din paletă) + `/settings/payment-methods`. Server Actions cu Zod, soft delete, revalidatePath. Test funcțional 13/13 OK.
- ✅ Tranzacții manuale CRUD + UX rapid (pasul 5) — `/transactions` (listă grupată pe zile, sume colorate, autor), `/transactions/new` (formular rapid: focus sumă, tastatură numerică, toggle venit/cheltuială filtrează categoriile, dată=azi), `/transactions/[id]/edit`. Undo la ștergere (soft-delete + restore), duplică, FAB + linkuri din dashboard. Test funcțional 14/14 OK (inclusiv RLS user_id + izolare).
- ✅ Admin + înregistrare pe bază de cod (2026-07-05) — signup public DEZACTIVAT (`disable_signup`); conturi doar prin `registerAction` (service_role) cu cod din `signup_codes` (migrare `20260705180000`), cod poate ținti o gospodărie (auto-join). Panou `/admin` (guard `ADMIN_EMAIL`): statistici, generator+listă coduri, useri (reset parolă/ștergere), activitate, debug, audit. Env noi obligatorii: `SUPABASE_SERVICE_ROLE_KEY` + `ADMIN_EMAIL` (local + **Vercel**). Test funcțional 13/13.
- ✅ Obiective de economisire (Faza 2, pasul 13) — CRUD `/savings`, progres, contribuții add/withdraw (clamp la 0), „atins". Test 10/10. **capăt Faza 2**
- ✅ Grafice (Faza 2, pasul 12) — `/reports`: donut cheltuieli pe categorie (SVG) + bare evoluție 6 luni (CSS), selector lună, fără dependențe (Recharts se poate adăuga). Test 7/7.
- ✅ Bugete (Faza 2, pasul 11) — `/budgets`: limită lunară/categorie, progres, alertă depășire. Test 8/8.
- ✅ Rate / angajamente (Faza 2, pasul 10) — CRUD `/installments` (total + nr. rate → rata calculată, carduri cu bară de progres + rest de plată, secțiune Finalizate). RPC `generate_due_installments` (migrare `20260705160000`): backfill scadent, `paid_installments` recalculat, **auto-dezactivare** la ultima rată, index unic parțial (source_id,date). Generare la dashboard alături de recurențe. Test funcțional 10/10.
- ✅ Recurențe (Faza 2, pasul 9) — CRUD `/recurring` (formular cu ziua lunii, toggle activ/inactiv, secțiune Oprite). Generare „lazy" idempotentă prin RPC `generate_due_recurring` (SECURITY DEFINER, migrare `20260705140000`) apelat la deschiderea dashboard-ului: backfill pe lunile lipsă, plafonare zi 31, index unic parțial (source_id,date), nu regenerează cele șterse. Test funcțional 9/9.
- ✅ Invitații în gospodărie (Faza 2, pasul 8) — RPC `redeem_invite` SECURITY DEFINER (migrare `20260705120000`), generare cod (owner) + expirare, `/settings/household` (membri + invitații, copiază cod/link, revocare), onboarding cu alăturare prin cod (`?invite=`). Test funcțional: redeem OK, refolosit/invalid/expirat respinse, RLS blochează non-owner.
- ✅ Dashboard lunar: sold cu carry-over + selector lună + filtrări (pasul 6) — **capăt Faza 1**. `app/(app)/page.tsx` (carduri venituri/cheltuieli/sold, report cumulat din luni anterioare, nav pe luni, tranzacții recente), filtre pe `/transactions` (lună/tip/categorie/metodă, form GET). `lib/data/dashboard.ts`, `lib/utils/month.ts`. Test funcțional 10/10 (carry-over pe 3 luni + filtre).

## Punct de decizie deschis
- Confirmarea email Supabase = **ON** (`mailer_autoconfirm: false`, reactivat 2026-07-05). ⚠️ Mai lipsește **SMTP custom (Resend)** — built-in are limită 2 emailuri/oră, blochează signup-urile reale >2/oră. De configurat înainte ca partenera să se înregistreze / înainte de lansare. Codul suportă ambele fluxuri.
- Deploy live pe Vercel (branch `main`, PR #1). Auth + onboarding testate live: register → onboarding → dashboard OK.
- Unealtă nouă: `npm run debug` (raport erori Supabase/Vercel).

## Probleme cunoscute / de rezolvat
- Nimic blocant. `supabase db push` necesită confirmare manuală a userului (blocat în auto mode) — normal.
- Lipsesc încă: middleware sesiune (`proxy.ts` / `middleware.ts`) pentru refresh token — se adaugă la auth.

## Ce urmează (în ordine)
1. Test izolare RLS cu 2 conturi.
2. Auth (login/register Supabase) + middleware sesiune.
3. Onboarding: apel `create_household` + redirect după apartenență.
4. CRUD categorii (tipizate) + metode de plată.

## Git
- Branch: `setup-proiect` (nu s-a făcut încă PR în `main`).
- Ultimele commituri: `6bf17f2` schema+RLS, `cc607d5` setup.

## Versiune / ultima livrare
Pre-v0.1.0 — încă pe branch de setup, nelivrat.
