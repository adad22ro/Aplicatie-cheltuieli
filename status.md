# Status proiect: Gospodărie — gestiune financiară
Ultima actualizare: 2026-07-04

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
- ⬜ Test izolare RLS (2 conturi) — acum posibil prin UI
- ⬜ CRUD categorii + metode de plată (pasul 4)

## Punct de decizie deschis
- Confirmarea email Supabase e ON implicit → signup nu dă sesiune imediat (userul vede „verifică emailul"). De decis dacă o dezactivăm (Authentication → Providers → Email) pentru flux instant. Codul suportă ambele.

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
