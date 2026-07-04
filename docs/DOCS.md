# DOCS.md — Documentație tehnică de sistem

> Cum e construită aplicația tehnic, cum funcționează fluxurile, structura de foldere și modelul de securitate. Pentru planul de ansamblu vezi `PLAN.md`; pentru UI vezi `UI.md`.

---

## 1. Arhitectură generală

Aplicație full-stack construită în **Next.js (App Router)**, unde frontend și backend coexistă în același proiect. Datele, autentificarea și stocarea de fișiere sunt oferite de **Supabase**. Hosting pe **Vercel**.

```
Utilizator (browser/PWA)
        │
        ▼
Next.js (Vercel)
  ├── Componente client (React) — UI, interacțiuni
  ├── Server Components — randare pe server, citiri
  └── Route Handlers / Server Actions — operațiuni pe server
        │
        ▼
Supabase
  ├── PostgreSQL (date + RLS)
  ├── Auth (sesiuni, auth.users)
  └── Storage (faza 2)
```

### Client vs. server în Next.js
- **Server Components** (implicit în App Router) — rulează pe server, pot citi direct din Supabase, nu ajung în browser. Bune pentru citiri și randare inițială.
- **Client Components** (`"use client"`) — rulează în browser, gestionează interacțiuni (formulare, click-uri, stare locală).
- **Route Handlers / Server Actions** — logică sensibilă (ex: generare tranzacții din recurențe/rate) rulează pe server, niciodată în client. **Cheile secrete și operațiunile privilegiate nu ajung niciodată în browser.**

## 2. Structura de foldere (propusă)

```
/app
  /(auth)
    /login/page.tsx
    /register/page.tsx
  /(app)
    /page.tsx                    # dashboard
    /transactions/
      page.tsx
      new/page.tsx
      [id]/edit/page.tsx
    /recurring/page.tsx
    /installments/page.tsx
    /budgets/page.tsx
    /savings/page.tsx
    /settings/
      page.tsx
      categories/page.tsx
      payment-methods/page.tsx
      household/page.tsx
      account/page.tsx
  /onboarding/page.tsx
  /api/                          # Route Handlers
    /recurring/generate/route.ts
    /installments/generate/route.ts
/components                      # componente reutilizabile (vezi UI.md)
/lib
  /supabase/                     # client Supabase (server + browser)
  /queries/                      # funcții de citire date
  /actions/                      # Server Actions (scriere date)
  /utils/                        # helpere (calcule financiare, formatare)
/types                           # tipuri TypeScript partajate
/docs                            # documentația (aceste fișiere)
```

## 3. Autentificare și acces

1. Utilizatorul se autentifică prin Supabase Auth (email + parolă).
2. Supabase creează o sesiune; `auth.uid()` identifică utilizatorul în orice interogare.
3. La prima autentificare, dacă utilizatorul nu e membru al vreunei gospodării, e trimis la onboarding.
4. Apartenența la gospodărie (`household_members`) determină tot accesul la date.

## 4. Modelul de securitate — RLS

**Regula fundamentală:** fiecare tabel cu `household_id` are RLS activat. Un rând e accesibil doar dacă `household_id`-ul lui aparține unei gospodării în care `auth.uid()` e membru.

Logica de bază a politicilor (pseudo-SQL, de rafinat la implementare):

```sql
-- Activare RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Membrii gospodăriei pot citi
CREATE POLICY "select_own_household" ON transactions
FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid()
  )
);

-- Membrii pot insera în gospodăria lor
CREATE POLICY "insert_own_household" ON transactions
FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid()
  )
);

-- Update/delete: analog cu USING
```

Politici speciale pe rol (`owner`):
- Ștergerea unei gospodării și operațiile pe `household_members` verifică suplimentar ca `auth.uid()` să aibă `role = 'owner'` în acea gospodărie.

**Atenție:** RLS trebuie testat explicit cu două conturi în gospodării diferite, pentru a confirma izolarea. Vezi `MANUAL.md` / testare.

## 5. Fluxuri principale

### 5.1. Adăugare tranzacție manuală
1. Utilizatorul completează formularul (client).
2. Server Action validează (sumă > 0, categorie validă, `household_id` al utilizatorului).
3. Insert în `transactions` cu `source = 'manual'`, `user_id = auth.uid()`.
4. RLS confirmă apartenența. Dashboard-ul se reîmprospătează.

### 5.2. Generare tranzacții din recurențe (faza 2)
- Un Route Handler (`/api/recurring/generate`) rulează periodic (declanșat de un cron — ex. Vercel Cron sau apel la deschiderea aplicației).
- Pentru fiecare recurență activă a cărei zi a sosit și care nu a fost încă generată luna curentă → creează o tranzacție cu `source = 'recurring'`, `source_id = recurring.id`.
- Idempotență: se verifică să nu se genereze de două ori aceeași lună.

### 5.3. Generare rate din angajamente (faza 2)
- Similar cu recurențele, prin `/api/installments/generate`.
- La generare: creează tranzacție `source = 'installment'`, incrementează `paid_installments`.
- **Auto-dezactivare:** dacă `paid_installments == total_installments`, setează `is_active = false`.
- Câmpuri derivate (rest de plată, rate rămase) se calculează la citire, nu se stochează.

### 5.4. Calcul carry-over (sold reportat)
- Soldul la finalul lunii N = venituri − cheltuieli (cumulat până la finalul lunii N).
- Soldul de start al lunii N+1 = soldul final al lunii N.
- Se calculează la citire pe baza tranzacțiilor ne-șterse (`deleted_at IS NULL`).

## 6. Soft delete

Toate ștergerile setează `deleted_at = now()` în loc să elimine rândul. Toate interogările de citire filtrează `deleted_at IS NULL`. Undo = setare `deleted_at = NULL`. Curățarea fizică (dacă vreodată necesară) se face separat, manual.

## 7. Convenții de cod

- **TypeScript strict.** Tipuri partajate în `/types`, derivate din schema bazei de date unde posibil.
- **Citiri** în `/lib/queries`, **scrieri** în `/lib/actions`.
- **Sume în RON** stocate ca `numeric`. Formatarea afișării (2 zecimale, separator) într-un helper unic în `/lib/utils`.
- Nicio cheie secretă în cod client. Variabilele publice Supabase (`NEXT_PUBLIC_*`) sunt sigure de expus; cheia `service_role` NU se folosește în client, doar în Route Handlers.

## 8. Variabile de mediu

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # doar server, pentru joburi de generare
```

## 9. Deploy

- Push în repo → Vercel build & deploy automat.
- Configurare PWA (manifest + service worker) pentru "Add to Home Screen".
- Migrațiile bazei de date rulate în Supabase (SQL editor sau CLI de migrații).
