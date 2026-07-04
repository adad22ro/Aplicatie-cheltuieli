# DEVELOPER.md — Manual al dezvoltatorului

> Referință granulară a codului: ce face fiecare **serviciu, funcție, componentă, endpoint și tabel**, concret. Cine vrea să înțeleagă cum e construită aplicația la nivel de cod începe de aici.
>
> **Relația cu celelalte fișiere:** `DOCS.md` explică arhitectura la nivel înalt (cum e gândit sistemul). Acest fișier coboară la nivel de cod (unde e funcția care face X, ce primește, ce întoarce). Nu repeta aici ce e deja în DOCS — trimite la el.

---

## ⚠️ Instrucțiune pentru Claude Code (citește la fiecare modificare de cod)

**Acest fișier se actualizează ca PARTE din orice modificare de cod, nu ca pas separat opțional.** Concret:

- Ai **adăugat** o funcție/componentă/endpoint/tabel? → adaugă intrarea corespunzătoare aici.
- Ai **modificat** semnătura, comportamentul sau parametrii a ceva documentat? → actualizează intrarea.
- Ai **eliminat** ceva? → șterge intrarea (sau marcheaz-o `@deprecated` dacă rămâne temporar).

**Regula de aur:** dacă acest fișier contrazice codul, **codul are dreptate** — corectează imediat fișierul. Documentația care minte e mai rea decât lipsa ei.

**Cum ții actualizarea mecanică (nu creativă):** folosește șabloanele de mai jos exact. Nu inventa structuri noi per intrare; completează câmpurile șablonului. O intrare corectă răspunde la: *ce face, ce primește, ce întoarce, unde e, ce atinge (DB/alte servicii), ce greșeli sunt de evitat.*

---

## Cum e organizat acest fișier

Oglindește structura de foldere din `DOCS.md` secțiunea 2. Secțiuni:

1. Tipuri partajate (`/types`)
2. Client Supabase (`/lib/supabase`)
3. Citiri de date (`/lib/queries`)
4. Scrieri de date / Server Actions (`/lib/actions`)
5. Helpere / utilitare (`/lib/utils`)
6. Route Handlers / API (`/app/api`)
7. Componente (`/components`)
8. Pagini (`/app`)
9. Schema bazei de date — referință de tabele și politici RLS

---

## Șabloane de intrare (folosește-le exact)

### Șablon pentru funcție / serviciu / query / action

```
#### `numeFuncție(parametri)`
- **Fișier:** cale/către/fișier.ts
- **Ce face:** o propoziție, la obiect.
- **Primește:** param1 (tip) — descriere; param2 (tip) — descriere.
- **Întoarce:** tip — descriere.
- **Atinge:** tabele DB citite/scrise, alte servicii apelate.
- **Efecte secundare:** (dacă există) ex. incrementează un contor, dezactivează un rând.
- **De evitat / capcane:** greșeli cunoscute, presupuneri periculoase.
```

### Șablon pentru componentă React

```
#### `<NumeComponentă />`
- **Fișier:** components/NumeComponentă.tsx
- **Tip:** client ("use client") | server.
- **Ce face:** rol în UI.
- **Props:** prop1 (tip) — rol; prop2 (tip) — rol.
- **Stare/hooks:** ce stare locală ține, ce hooks folosește.
- **Dependențe:** ce query-uri/actions apelează, ce alte componente compune.
- **De evitat / capcane:** (dacă există).
```

### Șablon pentru endpoint (Route Handler)

```
#### `METODĂ /app/api/cale/route.ts`
- **Ce face:** scopul endpointului.
- **Declanșat de:** cine îl apelează (cron, client, alt serviciu).
- **Primește:** body/params/query.
- **Întoarce:** status + formă răspuns.
- **Atinge:** tabele DB, alte servicii.
- **Autorizare:** ce verifică (sesiune, rol).
- **Idempotență:** dacă e relevant (ex. să nu genereze de două ori).
```

### Șablon pentru tabel DB

```
#### `nume_tabel`
- **Rol:** ce reprezintă.
- **Coloane cheie:** cele netriviale (restul în PLAN.md secțiunea 5).
- **RLS:** rezumatul politicilor (cine poate select/insert/update/delete).
- **Relații:** FK-uri spre/dinspre alte tabele.
- **Note:** soft delete, câmpuri derivate calculate la citire etc.
```

---

## 1. Tipuri partajate (`/types`)

> Se completează pe măsură ce sunt definite. Tipurile derivate din schema DB se documentează cu sursa lor.

*(gol deocamdată)*

## 2. Client Supabase (`/lib/supabase`)

> Vezi DOCS.md secțiunea 1 pentru distincția client browser vs. server. Aici se documentează funcțiile concrete de creare a clientului.

#### `createServerSupabaseClient()`
- **Fișier:** lib/supabase/server.ts
- **Ce face:** creează un client Supabase pentru cod de server, care propagă sesiunea userului prin cookie-uri (deci RLS pe `auth.uid()` merge nativ).
- **Primește:** nimic.
- **Întoarce:** `Promise<SupabaseClient>` — async pentru că `cookies()` e async în Next 16.
- **Atinge:** citește/scrie cookie-uri prin `next/headers`; cheia `anon` din `lib/env`.
- **De evitat / capcane:** marcat `import "server-only"` — nu se importă din cod client. NU folosi `service_role` aici (ar sări peste RLS). `setAll` prinde eroarea de scriere cookie în Server Components (normal — reîmprospătarea sesiunii se face din middleware).

#### `createBrowserSupabaseClient()`
- **Fișier:** lib/supabase/client.ts
- **Ce face:** creează un client Supabase pentru Client Components (browser).
- **Primește:** nimic.
- **Întoarce:** `SupabaseClient`.
- **Atinge:** cheia publică `anon` din `lib/env`.
- **De evitat / capcane:** folosește-l doar când chiar e nevoie de acces direct din client (realtime, interacțiuni live); altfel preferă clientul de server.

## 2b. Configurare mediu (`/lib/env.ts`, `/instrumentation.ts`)

#### `env` (obiect) + `loadEnv()`
- **Fișier:** lib/env.ts
- **Ce face:** validează `process.env` cu Zod (fail-fast) și expune configul tipizat grupat pe domenii (`env.supabase.url`, `env.supabase.anonKey`).
- **De evitat / capcane:** codul citește variabile DOAR prin `env`, niciodată direct din `process.env`. Variabilă nouă → se adaugă în schema Zod ȘI în `.env.example`.

#### `register()`
- **Fișier:** instrumentation.ts
- **Ce face:** hook Next rulat o dată la boot; importă `lib/env` pe runtime-ul Node ca validarea să ruleze la pornire (crapă imediat dacă lipsește o variabilă).

## 3. Citiri de date (`/lib/queries`)

> Toate funcțiile de citire. Fiecare respectă RLS (întoarce doar date ale gospodăriei utilizatorului).

*(gol deocamdată — ex. viitoare: `getMonthlyTransactions()`, `getDashboardSummary()`, `getCategories()`)*

## 3b. Auth / user curent (`/lib/auth`)

#### `getCurrentUser()` / `getCurrentMembership()`
- **Fișier:** lib/auth/current-user.ts (`server-only`)
- **Ce face:** `getCurrentUser` întoarce userul autentificat (validat cu serverul Supabase) sau null. `getCurrentMembership` întoarce prima apartenență la gospodărie (`household_id`, `role`, `households(name)`) sau null → semn că trebuie onboarding.
- **Atinge:** `auth.getUser()`; tabelul `household_members` (prin RLS).

## 4. Scrieri de date / Server Actions (`/lib/actions`)

> Toate operațiunile de scriere. Rulează pe server. Validează input și apartenența la gospodărie.

#### `signInAction` / `signUpAction` / `signOutAction`
- **Fișier:** lib/actions/auth.ts (`"use server"`)
- **Ce face:** login / register / logout prin Supabase Auth. Semnătură `(prevState, FormData) => AuthActionState` pentru `useActionState`. Validează credențialele cu Zod (`credentialsSchema`) în interiorul action-ului.
- **Întoarce:** `{ error }` la eșec, altfel `redirect` (login→`/`, signup cu sesiune→`/onboarding`, logout→`/login`).
- **De evitat / capcane:** signup fără sesiune (confirmare email ON) întoarce mesaj, nu redirect.

#### `createHouseholdAction`
- **Fișier:** lib/actions/household.ts (`"use server"`)
- **Ce face:** creează gospodăria + owner atomic prin RPC `create_household`. Reverifică userul (redirect /login dacă lipsește), validează numele (`householdNameSchema`).
- **Atinge:** RPC `create_household`. `revalidatePath("/", "layout")` apoi `redirect("/")`.

#### Scheme Zod
- **Fișier:** lib/schemas/auth.ts — `credentialsSchema` (email + parolă ≥6), `householdNameSchema` (1–80 caractere).

## 5. Helpere / utilitare (`/lib/utils`)

> Funcții pure fără efecte secundare: calcule financiare, formatare.

*(gol deocamdată — ex. viitoare: `formatRON()`, `calculateCarryOver()`, `installmentRemaining()`)*

## 6. Route Handlers / API (`/app/api`)

> Endpointuri server. Vezi DOCS.md secțiunea 5 pentru fluxurile de generare recurențe/rate.

*(gol deocamdată — ex. viitoare: `POST /api/recurring/generate`, `POST /api/installments/generate`)*

## 7. Componente (`/components`)

> Lista canonică a componentelor e în UI.md secțiunea 5. Aici se documentează implementarea concretă (props reale, stare, dependențe) pe măsură ce sunt scrise.

*(gol deocamdată)*

## 8. Pagini (`/app`)

> Rutele și ce randează fiecare. Structura de rute e în DOCS.md secțiunea 2 și UI.md. Aici se notează detalii de implementare per pagină (ce query-uri cheamă, ce e server vs. client).

*(gol deocamdată)*

## 9. Schema bazei de date — referință

> Definiția completă a coloanelor e în PLAN.md secțiunea 5. Aici se documentează, pe măsură ce sunt create, **politicile RLS reale** și orice logică de DB (triggere, funcții SQL, indexuri netriviale).

*(gol deocamdată — de completat cu politicile RLS efective per tabel după implementare)*

---

## Convenție de întreținere

- O intrare per unitate de cod (funcție/componentă/endpoint/tabel). Fără intrări „grup".
- Când muți/redenumești un fișier, actualizează câmpul **Fișier** al tuturor intrărilor afectate.
- Marchează cu `@deprecated` + dată ce urmează să dispară, în loc să ștergi brusc, dacă altceva încă depinde de el.
- La final de sesiune de dezvoltare: verifică rapid că intrările adăugate/modificate în cod au corespondent aici. Această verificare e și în DEVLOG.md la „De făcut".
