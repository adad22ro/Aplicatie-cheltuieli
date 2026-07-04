# DEVLOG.md — Jurnal de dezvoltare

> Jurnal de decizii și progres. Aici se notează DE CE s-a ales o abordare (nu doar ce s-a făcut), ce a rămas de făcut și ce e de reținut între sesiuni. Complementar cu CHANGELOG.md (care spune CE s-a schimbat) și ERRORS.md (care documentează erori).

## Cum se folosește
- La fiecare sesiune importantă de lucru, adaugă o intrare cu data.
- Notează decizii tehnice și motivația lor, ca să nu fie regândite inutil mai târziu.
- Ține o secțiune vie **"De făcut"** și **"Întrebări deschise"**.

---

## Decizii de arhitectură (stabilite în faza de planificare)

- **PWA, nu aplicație nativă** — distribuție prin link privat, fără magazin de aplicații. Rămâne în stack-ul web.
- **Supabase Auth, nu Clerk** — RLS funcționează nativ cu `auth.uid()`; Clerk ar complica exact partea de securitate fără beneficiu la acest volum.
- **Multi-tenancy de la început** — `household_id` pe fiecare entitate + `household_members`. Foarte greu de adăugat ulterior, deci se face acum.
- **RLS obligatoriu** — izolarea între gospodării se face în baza de date, nu doar în cod.
- **Soft delete peste tot** — permite undo și păstrează istoricul; decizie de arhitectură luată de la început.
- **Ratele = entitate separată** (`installment_plans`), NU o subvariantă de recurență — pentru a păstra totalul, restul de plată și rate rămase, nu doar un contor.
- **Roluri minimale** (`owner` / `member`) — câmp pus de la început chiar dacă logica se aplică mai târziu; evită refactor dureros când vin invitațiile.
- **Recharts pentru grafice** — declarativ, se pliază pe modelul de componente React.

## Scope respins conștient (ca să nu fie readus fără motiv)

- **OCR bonuri + citire PDF** — SUSPENDAT la cererea utilizatorului. Se revine dacă e cazul.
- **Notificări push** — complicat pe PWA/iOS, inutil la acest volum. Alertele se arată în interfață.
- **Multi-valută** — doar RON.
- **Decontare între membri** — banii sunt comuni, nu are sens.
- **Audit log / istoric modificări** — overkill la 2-5 utilizatori de încredere.
- **Atașamente/poze la tranzacție** — amânat; vine oricum la pachet cu OCR dacă se reia.

---

## Jurnal

### 2026-01-01 — Planificare inițială
- Stabilit stack-ul, arhitectura, modelul de date complet și fazarea.
- Creată documentația de bază (7 fișiere).
- Următorul pas: setup proiect Next.js + Tailwind + conexiune Supabase, apoi schema DB cu RLS.

### 2026-07-04 — Setup proiect (branch `setup-proiect`)
- Creat `CLAUDE.md` scurt (Profil B, decizii de bază) — deciziile de auth/tenancy sunt acum fixate într-un loc citit automat, nu doar în documentele lungi.
- Scaffold Next.js 16.2 + React 19.2 + Tailwind v4 + TS strict, structură **flat** (fără `src/`), conform DOCS.md secțiunea 2. Reținut: **Next 16 și Tailwind v4 diferă de training** — se verifică `node_modules/next/dist/docs/` înainte de cod Next.
- Config aliniat la regulile de bază: `noUncheckedIndexedAccess` în tsconfig, `.env.example` (cu `service_role` marcat rezervat faza 2, NU se folosește pe Profil B în faza 1), excepție `!.env.example` în `.gitignore`, script `typecheck`.
- **De făcut imediat:** `lib/env.ts` (validare fail-fast, cu Zod) + clienți Supabase (`@supabase/ssr`), după ce sunt disponibile URL-ul și cheia anon din proiectul Supabase.

### 2026-07-04 — Schema DB + RLS aplicate
- Supabase CLI instalat (dev dep) + `supabase init` + proiect legat (`db push`/`db:types` funcționale).
- Migrarea `20260704150519_schema_initial.sql`: toate cele 10 tabele (PLAN §5) + enum-uri + indexuri + RLS pe toate + politici.
- **Decizie RLS:** funcții helper `is_household_member()` / `is_household_owner()` **SECURITY DEFINER** (ocolesc RLS pe `household_members` ca să evite recursiunea infinită în politici). Crearea gospodăriei prin RPC `create_household()` (SECURITY DEFINER) — bootstrap atomic al primului owner, care altfel ar fi blocat de politici. `households` NU are politică INSERT (creare doar prin RPC).
- Tipuri generate în `types/database.ts` (`npm run db:types`).
- **Urmează:** test de izolare RLS cu 2 conturi în gospodării diferite; apoi auth + onboarding (pasul 3).

### 2026-07-04 — Auth + onboarding (pasul 3)
- **Design system pus la punct:** tokeni semantici în `globals.css` (DESIGN.md §3), dark mode pe strategia `class` cu `@custom-variant` (Tailwind v4), script anti-flash în layout, font Nunito, `lang="ro"`. Componentele folosesc DOAR clase mapate pe tokeni (bg-surface, text-foreground, text-expense…), zero culori fixe.
- **Sesiune:** `proxy.ts` (Next 16 a redenumit `middleware`→`proxy`) + `lib/supabase/proxy.ts` (`updateSession`) — reîmprospătează token-ul și protejează rutele (neautentificat→/login, autentificat pe /login|/register→/).
- **Auth:** Server Actions `signInAction`/`signUpAction`/`signOutAction` (Zod pe server), pagini `(auth)/login` + `(auth)/register` cu `AuthForm` (client, `useActionState`).
- **Onboarding:** `createHouseholdAction` apelează RPC `create_household`; pagina `/onboarding` redirect dacă userul are deja gospodărie. Dashboard placeholder în `(app)/page.tsx` (redirect la /onboarding dacă nu e membru).
- **Structură rute:** grupuri `(app)` și `(auth)` (nu schimbă URL-ul). Verificat: `/`→307 `/login`, `/login` & `/register`→200.
- **Punct de decizie deschis:** confirmarea email Supabase e ON implicit → signup nu dă sesiune imediat. De decis dacă o dezactivăm pentru flux instant (aplicație de cuplu). Codul suportă ambele.
- **Urmează:** test izolare RLS cu 2 conturi (necesită conturi reale — acum posibil prin UI); apoi CRUD categorii + metode de plată (pasul 4).

---

## De făcut (viu — se actualizează)

### Faza 1
- [ ] Setup proiect Next.js + Tailwind + Supabase
- [ ] Schema DB completă + politici RLS (toate tabelele)
- [ ] Autentificare + onboarding gospodărie
- [ ] CRUD categorii (tipizate) + metode de plată
- [ ] CRUD tranzacții manuale + cerințe UX (adăugare rapidă, duplică, undo)
- [ ] Dashboard lunar + carry-over + filtrări
- [ ] Testare RLS cu două conturi în gospodării diferite
- [ ] La final de fiecare sesiune: verifică că DEVELOPER.md reflectă codul nou/modificat

### Faza 2
- [ ] Invitații în gospodărie
- [ ] Recurențe + job de generare
- [ ] Rate + job de generare + auto-dezactivare
- [ ] Bugete + alerte
- [ ] Grafice (Recharts)
- [ ] Obiective de economisire

---

## Întrebări deschise (de rezolvat la implementare)

- Bugetele sunt per lună (rând nou lunar) sau o singură limită globală reutilizată? — de decis la implementarea bugetelor.
- Generarea recurențelor/ratelor: cron real (Vercel Cron) sau declanșare la deschiderea aplicației? — de evaluat în faza 2 în funcție de fiabilitate.
- Curățarea fizică a rândurilor soft-deleted: necesară vreodată? Deocamdată nu.
