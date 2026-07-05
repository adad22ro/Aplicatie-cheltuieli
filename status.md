# Status proiect: Gospodărie — gestiune financiară
Ultima actualizare: 2026-07-05

## Profil și decizii de bază
- Profil: **B** (multi-tenant pe gospodărie) | Auth: **Supabase Auth** (RLS pe `auth.uid()`)
- Structură: **flat** (fără `src/`) | Plăți: **nu** | Cheia de tenant: `household_id` via `household_members`
- Stack: Next.js 16.2 + React 19.2 + TS strict + Tailwind v4 + Supabase (Postgres 17)
- ⚠️ Next 16 și Tailwind v4 diferă de training — verifică `node_modules/next/dist/docs/` înainte de cod Next.

## Model de date (aplicat în DB)
10 tabele de bază (PLAN §5, migrare `20260704150519`), toate cu RLS + soft delete (`deleted_at`):
- `households`, `household_members` (rol owner/member), `household_invites`
- `categories`, `payment_methods`, `transactions` (inima app)
- `recurring_transactions`, `installment_plans`, `budgets`, `savings_goals`
- Tabele adăugate ulterior: `signup_codes` + `admin_audit` (RLS deny, doar service_role), `profiles` (nume, RLS co-membri via `shares_household`)
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
- ✅ Profiluri (2026-07-05) — tabel `profiles` (nume afișat), migrare `20260705200000` + helper `shares_household` SECURITY DEFINER + RLS (vezi numele co-membrilor, editezi doar al tău). Nume cerut la înregistrare; `/settings/profile` editare; autor pe tranzacții = nume real (`authorMap`); filtru „persoană" pe `/transactions`; membri cu nume. Test 8/8.
- ✅ PWA (2026-07-05) — `app/manifest.ts` + iconițe PNG (casă+„lei" pe teal, generate cu sharp din `public/icon.svg` via `scripts/generate-icons.mjs`), `public/sw.js` (network-first + offline.html), `ServiceWorkerRegister` în layout, theme-color/appleWebApp. Instalabilă „Add to Home Screen".
- ✅ Admin + înregistrare pe bază de cod (2026-07-05) — signup public DEZACTIVAT (`disable_signup`); conturi doar prin `registerAction` (service_role) cu cod din `signup_codes` (migrare `20260705180000`), cod poate ținti o gospodărie (auto-join). Panou `/admin` (guard `ADMIN_EMAIL`): statistici, generator+listă coduri, useri (reset parolă/ștergere), activitate, debug, audit. Env noi obligatorii: `SUPABASE_SERVICE_ROLE_KEY` + `ADMIN_EMAIL` (local + **Vercel**). Test funcțional 13/13.
- ✅ Obiective de economisire (Faza 2, pasul 13) — CRUD `/savings`, progres, contribuții add/withdraw (clamp la 0), „atins". Test 10/10. **capăt Faza 2**
- ✅ Grafice (Faza 2, pasul 12) — `/reports`: donut cheltuieli pe categorie (SVG) + bare evoluție 6 luni (CSS), selector lună, fără dependențe (Recharts se poate adăuga). Test 7/7.
- ✅ Bugete (Faza 2, pasul 11) — `/budgets`: limită lunară/categorie, progres, alertă depășire. Test 8/8.
- ✅ Rate / angajamente (Faza 2, pasul 10) — CRUD `/installments` (total + nr. rate → rata calculată, carduri cu bară de progres + rest de plată, secțiune Finalizate). RPC `generate_due_installments` (migrare `20260705160000`): backfill scadent, `paid_installments` recalculat, **auto-dezactivare** la ultima rată, index unic parțial (source_id,date). Generare la dashboard alături de recurențe. Test funcțional 10/10.
- ✅ Recurențe (Faza 2, pasul 9) — CRUD `/recurring` (formular cu ziua lunii, toggle activ/inactiv, secțiune Oprite). Generare „lazy" idempotentă prin RPC `generate_due_recurring` (SECURITY DEFINER, migrare `20260705140000`) apelat la deschiderea dashboard-ului: backfill pe lunile lipsă, plafonare zi 31, index unic parțial (source_id,date), nu regenerează cele șterse. Test funcțional 9/9.
- ✅ Invitații în gospodărie (Faza 2, pasul 8) — RPC `redeem_invite` SECURITY DEFINER (migrare `20260705120000`), generare cod (owner) + expirare, `/settings/household` (membri + invitații, copiază cod/link, revocare), onboarding cu alăturare prin cod (`?invite=`). Test funcțional: redeem OK, refolosit/invalid/expirat respinse, RLS blochează non-owner.
- ✅ Dashboard lunar: sold cu carry-over + selector lună + filtrări (pasul 6) — **capăt Faza 1**. `app/(app)/page.tsx` (carduri venituri/cheltuieli/sold, report cumulat din luni anterioare, nav pe luni, tranzacții recente), filtre pe `/transactions` (lună/tip/categorie/metodă, form GET). `lib/data/dashboard.ts`, `lib/utils/month.ts`. Test funcțional 10/10 (carry-over pe 3 luni + filtre).

## Stare curentă (handoff)
- **Faza 1 + Faza 2 COMPLETE**, plus sistem de admin + PWA + profiluri. Toate live pe Vercel (branch `main`, auto-deploy la push).
- **Auth model**: signup public DEZACTIVAT (`disable_signup: true`). Conturi doar prin `registerAction` (service_role, `admin.createUser({email_confirm:true})`) după cod valid din `signup_codes`. Codul poate ținti o gospodărie (auto-join). Confirmarea email NU mai contează pentru signup (createUser confirmă direct) → SMTP custom nu mai e necesar pentru fluxul actual.
- **Admin** (`/admin`, guard `ADMIN_EMAIL=gabirusu2000@gmail.com`, service_role): statistici, generator+listă coduri, useri (reset parolă/ștergere), activitate, debug, audit. Buton ⚙️ pe dashboard doar pentru admin.
- **Conturi reale în DB**: `gabirusu2000@gmail.com` (admin/owner) + `cristea.jiaco02@gmail.com` (înregistrat prin cod). NU șterge aceste conturi/date — sunt reale.
- **Env obligatorii** (local `.env.local` + **Vercel**): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`. Local mai există `SUPABASE_ACCESS_TOKEN` (Management API, pt. schimbări config auth).

## Convenții importante
- Migrări: `supabase db push` cere confirmarea userului (blocat în auto mode) — cere-i userului să ruleze `npm run db:push`, apoi regenerează tipuri (`npm run db:types`).
- Config auth Supabase se schimbă prin Management API (PATCH `/config/auth` cu `SUPABASE_ACCESS_TOKEN`) — vezi memoria.
- Testare RLS/funcțională: scripturi Node ESM temporare în rădăcină (rezolvă node_modules), rulate apoi șterse; useri de test creați cu service_role `admin.createUser({email_confirm:true})`, șterși la final (⚠️ ordine FK: șterge signup_codes/date înainte de useri). `npm run debug` = raport stare.
- Generare recurențe/rate: „lazy" la deschiderea dashboard-ului prin RPC-uri SECURITY DEFINER (fără cron).

## Migrări aplicate (remote)
`20260704150519` schema+RLS · `20260705120000` redeem_invite · `20260705140000` generate_due_recurring · `20260705160000` generate_due_installments · `20260705180000` signup_codes+admin_audit · `20260705200000` profiles+shares_household

## ✅ „Plan lunar" (alocare venit + planificare lună viitoare) — implementat 2026-07-06
Concept unificat: pagină `/plan` cu selector de lună. Luna curentă = aloci venitul intrat; luna viitoare = planifici.
- **Model „Plan + confirmi «plătit»"**: alocarea NU devine cheltuială reală până nu bifezi „plătit" → abia atunci se creează o `transactions` (source='plan', source_id=alocare) legată prin `paid_transaction_id`. Debifare/ștergere alocare → soft-delete tranzacția.
- **Migrare aplicată**: `20260706100000_monthly_plans.sql` — `monthly_plans`, `plan_incomes`, `plan_allocations` (RLS is_household_member + soft delete) + enum `transaction_source += 'plan'`.
- **Fișiere**: `lib/schemas/plan.ts`, `lib/data/plan.ts`, `lib/plan/ensure-plan.ts` (ensurePlan seedează din recurențe active + linkIncomeToPlan), `lib/actions/plan.ts`, `app/(app)/plan/page.tsx`, `components/plan/PlanEditor.tsx`. Card pe dashboard + `createTransactionAction` la venit → linkează în plan și redirect la `/plan`.
- **Surse de venit recurente**: bifa „recurent" pe un venit din plan creează o recurență de tip venit (gestionată din `/recurring`).
  - ✅ **DECIS**: venit recurent = doar sursă de precompletare a planului (fără tranzacție auto). Migrare `20260706110000_recurring_expense_only.sql` filtrează `type='expense'` în `generate_due_recurring`. **Aplicată** (db:push + db:types rulate 2026-07-06).
- ✅ Test funcțional DB + RLS: 15/15 OK (seed din recurență, totaluri Venit/Alocat/Nealocat, enum source='plan', toggle plătit→tranzacție legată, izolare RLS cross-tenant, cascade delete). Useri/date de test șterși după.
- ✅ **Extinderi plan (2026-07-06)** — 4 grupuri, toate live:
  - **A (polish)**: prioritizare alocări cu ↑/↓ (sort_order), bară de progres, „rest de plătit", alerte (deficit/„tot venitul alocat"/procent).
  - **B (rollover & 2 venituri)**: report din luna anterioară → „disponibil"=venit+report; `plan_incomes.user_id` (migrare `20260706120000`) = contribuitor, breakdown pe persoană. Test 6/6.
  - **C (șabloane)**: `allocation_templates`+`template_lines`+enum `allocation_mode` (migrare `20260706130000`). Linii sumă-fixă/procent-din-disponibil. Pagină `/plan/templates` + bară „Aplică șablon" pe `/plan`. Test 5/5.
  - **D (admin & onboarding)**: `/admin/households` (redenumire + membri/tranzacții, audit), export CSV `/admin/export` (BOM Excel). Onboarding simplificat: ecran curat doar creare; alăturare doar prin link `?invite=`. Fără migrare.
- ✅ **Vizualizare săptămânală (2026-07-06)** — toggle lunar/săptămânal pe dashboard (`?view=weekly`). Luna spartă în blocuri fixe de 7 zile (1–7, 8–14, …); fiecare săptămână: venituri/cheltuieli/sold + tranzacții desfășurabile (`<details>`, refolosește `TransactionsList`). `lib/data/weekly.ts` (grupare pură pe date, fără migrare) + `components/WeeklyView.tsx`.
  - Idee viitoare discutată: alocare a planului pe săptămâni (pas 2, mai complex) — neînceput.
- ✅ **Funcții utile — grupuri E/F/G (2026-07-06)**, toate live:
  - **E**: căutare liberă tranzacții (notă ilike + sumă) pe `/transactions`; adăugare rapidă „la fel ca data trecută" (chips din combinații recente → prefill) pe `/transactions/new`. Test 4/4.
  - **F**: top 3 categorii/săptămână în vizualizarea săptămânală; comparație lună-la-lună pe `/reports` (`getCategoryComparison`, delta + %).
  - **G**: alocare din plan către un obiectiv de economisire (`plan_allocations.savings_goal_id`, migrare `20260706140000`). Bifat „plătit" → crește obiectivul (fără tranzacție); debifat/șters → scade. ⚠️ testat doar build/tsc, nu runtime cu script.
- ✅ **Grup I — #2 digest în-app pe dashboard (2026-07-06)**: card pe luna curentă „Ți-au intrat X · mai ai Y de plătit (N recurențe/rate rămase scadente) · sold Z". `getMonthDigest(month, summary)` în `lib/data/dashboard.ts` (refolosește sumarul + 2 query-uri: recurring active expense cu day_of_month>azi + installment plans neterminate). Build OK. (push real = ulterior)
- ✅ **Grup H — #8 plan pe săptămâni (2026-07-06)**: coloană `plan_allocations.week` (smallint 1..6, null=„oricând"), migrare `20260706150000_plan_allocation_week.sql`. `/plan`: toggle Listă/Săptămâni; selector S1..Sn pe fiecare alocare; vizualizarea pe săptămâni grupează + arată buget disponibil/săptămână (available împărțit egal) cu alertă de depășire. `ensurePlan` presetează săptămâna din ziua recurenței. Helperi `weekBlocksInMonth`/`weekRange` în `lib/utils/month.ts`, acțiune `setAllocationWeekAction`. Typecheck+build OK. ⚠️ testat doar build/tsc; migrarea trebuie aplicată (db:push) înainte de push cod.

- **Ajustările userului** la ce s-a construit (le va comunica).
- **Grafică / design** (o va face ulterior — direcție vizuală, polish UI).
- Idei opționale rămase: extinderi admin (redenumire gospodării, export), simplificare onboarding (scoate „join cu cod gospodărie" redundant cu codurile de admin).

## Git / versiune
- Branch de lucru: `main` (direct, fără PR — solo, testare locală). Auto-deploy Vercel.
- Ultim commit relevant: `241601c` profiluri.
- Faza 1 + Faza 2 livrate. Pre-v1.0 (funcțional complet pentru uz privat 2 persoane).
