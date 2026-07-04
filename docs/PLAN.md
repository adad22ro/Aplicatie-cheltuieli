# PLAN.md — Aplicație de gestiune financiară pentru gospodărie

> Document principal de planificare. Îl citești primul. Descrie viziunea, stack-ul, arhitectura, modelul de date și ordinea de implementare pe etape.

---

## 1. Viziune

Aplicație de centralizare și supraveghere a veniturilor și cheltuielilor unei gospodării, folosită inițial de un cuplu, extensibilă ulterior la familie și prieteni. Fiecare utilizator se conectează la o **gospodărie** (household) în care încarcă și vizualizează date financiare comune. Datele sunt partajate în interiorul gospodăriei, dar izolate complet față de alte gospodării.

Aplicația se distribuie ca link privat (fără magazin de aplicații), instalabilă pe telefon ca PWA.

## 2. Principii de proiectare

- **Simplu de folosit zilnic.** Adăugarea unei tranzacții trebuie să fie extrem de rapidă. Dacă e greoaie, nimeni nu ține evidența constant și aplicația moare.
- **Multi-tenancy de la început.** Structura suportă mai multe gospodării chiar dacă la lansare există una singură.
- **Securitate la nivel de date.** Izolarea între gospodării se face în baza de date (RLS), nu doar în cod.
- **Construcție pe etape.** Nu se construiește tot deodată. Fiecare etapă livrează ceva funcțional.

## 3. Stack tehnologic

| Componentă | Tehnologie | Rol |
|---|---|---|
| Framework | Next.js (App Router) | Frontend + backend în același proiect |
| Limbaj | TypeScript | Tot codul |
| UI | React + Tailwind CSS | Componente și stilizare |
| Bază de date | Supabase (PostgreSQL) | Stocare date |
| Autentificare | Supabase Auth | Login/register, sesiuni |
| Stocare fișiere | Supabase Storage | Rezervat pentru faza 2 (atașamente/OCR) |
| Grafice | Recharts | Vizualizări (declarativ, se pliază pe React) |
| Hosting | Vercel | Deploy gratuit, PWA |

### De ce PWA și nu aplicație nativă
Nu se dorește publicarea în App Store / Play Store. Aplicația se distribuie prin link, iar utilizatorii o adaugă pe ecranul principal ("Add to Home Screen"). Arată și se comportă ca o aplicație, fără cont de developer, fără taxe, fără procese de review. Rămâne în stack-ul web deja folosit.

### De ce Supabase Auth și nu Clerk
Securitatea aplicației se bazează pe **Row Level Security (RLS)** din PostgreSQL, care citește direct `auth.uid()` (id-ul utilizatorului logat) din contextul Supabase. Cu Supabase Auth acest lucru funcționează nativ. Clerk ar necesita integrare suplimentară (JWT custom) exact pe partea cea mai sensibilă, fără beneficiu real la volumul acestei aplicații.

## 4. Concepte cheie explicate

Termeni care apar peste tot în documentație. Dacă vii din programare generală dar nu din stack-ul Next.js/Supabase, citește aici întâi.

- **Multi-tenancy** — o singură aplicație și o singură bază de date deservesc mai multe grupuri izolate (gospodării). Fiecare grup e un "tenant". Datele unui tenant nu sunt vizibile altuia.
- **Row Level Security (RLS)** — mecanism PostgreSQL prin care se scriu reguli la nivel de rând: un utilizator poate citi/modifica un rând doar dacă îndeplinește o condiție. Fără RLS, cheia publică Supabase (care ajunge în browser) ar permite citirea datelor tuturor gospodăriilor. **RLS nu e opțional aici.**
- **Route Handler / Server Action** — cod care rulează pe server în cadrul proiectului Next.js (nu în browser). Se folosește pentru operațiuni care nu trebuie expuse clientului. Echivalentul unui controller de API, dar în același proiect.
- **Soft delete** — "ștergerea" nu elimină fizic rândul, ci îl marchează ca șters (`deleted_at`). Permite undo și păstrează istoricul. Rapoartele filtrează automat rândurile șterse.
- **Carry-over (sold reportat)** — soldul de la finalul unei luni devine soldul de start al lunii următoare, astfel încât dashboard-ul arată banii reali, nu doar fluxul lunii curente.

## 5. Modelul de date (complet)

Structura de tabele. Utilizatorii sunt gestionați de Supabase în `auth.users` — nu se creează manual.

### `households` — gospodăriile
- `id` (uuid, PK)
- `name` (text)
- `created_by` (uuid → auth.users)
- `created_at` (timestamp)
- `deleted_at` (timestamp, nullable) — soft delete

### `household_members` — leagă utilizatorii de gospodării
- `id` (uuid, PK)
- `household_id` (uuid → households)
- `user_id` (uuid → auth.users)
- `role` (enum: `owner` | `member`) — sistem minimal de roluri
- `joined_at` (timestamp)

Reguli de rol:
- `owner` — poate șterge gospodăria, gestiona membrii (adăuga/elimina), genera invitații.
- `member` — poate adăuga/edita/șterge tranzacții, categorii, bugete. Nu poate șterge gospodăria sau da afară membri.

### `household_invites` — invitații în gospodărie
- `id` (uuid, PK)
- `household_id` (uuid → households)
- `code` (text, unic) — cod/link de invitație
- `created_by` (uuid → auth.users)
- `expires_at` (timestamp, nullable)
- `used_at` (timestamp, nullable)
- `created_at` (timestamp)

### `categories` — categorii de tranzacții
- `id` (uuid, PK)
- `household_id` (uuid → households)
- `name` (text)
- `type` (enum: `income` | `expense`) — o categorie e fie de venit, fie de cheltuială
- `icon` (text, nullable)
- `color` (text, nullable)
- `deleted_at` (timestamp, nullable)

### `payment_methods` — metode de plată
- `id` (uuid, PK)
- `household_id` (uuid → households)
- `name` (text) — ex: Cash, Card BT, Revolut
- `deleted_at` (timestamp, nullable)

### `transactions` — inima aplicației
- `id` (uuid, PK)
- `household_id` (uuid → households)
- `user_id` (uuid → auth.users) — cine a adăugat-o
- `amount` (numeric) — în RON
- `type` (enum: `income` | `expense`)
- `category_id` (uuid → categories)
- `payment_method_id` (uuid → payment_methods, nullable)
- `date` (date)
- `note` (text, nullable)
- `source` (enum: `manual` | `recurring` | `installment`) — de unde a venit tranzacția
- `source_id` (uuid, nullable) — id-ul recurenței sau al ratei care a generat-o
- `created_at` (timestamp)
- `deleted_at` (timestamp, nullable) — soft delete

### `recurring_transactions` — recurențe infinite (chirie, abonamente, salariu)
- `id` (uuid, PK)
- `household_id` (uuid → households)
- `amount` (numeric)
- `type` (enum: `income` | `expense`)
- `category_id` (uuid → categories)
- `payment_method_id` (uuid → payment_methods, nullable)
- `note` (text, nullable)
- `frequency` (enum: `monthly` — se poate extinde ulterior)
- `day_of_month` (int) — în ce zi se generează
- `is_active` (boolean)
- `created_at` (timestamp)
- `deleted_at` (timestamp, nullable)

### `installment_plans` — angajamente/rate (total finit)
Conceptul separat de recurențe, discutat explicit. O rată are un total finit și un rest de plată.
- `id` (uuid, PK)
- `household_id` (uuid → households)
- `name` (text) — ex: "Telefon Samsung"
- `total_amount` (numeric) — totalul de plată (ex: 3000)
- `installment_amount` (numeric) — cât e o rată (ex: 250)
- `total_installments` (int) — număr total de rate (ex: 12)
- `paid_installments` (int) — câte s-au plătit deja
- `category_id` (uuid → categories)
- `payment_method_id` (uuid → payment_methods, nullable)
- `day_of_month` (int) — ziua de generare lunară
- `start_date` (date)
- `is_active` (boolean) — devine `false` automat când `paid_installments == total_installments`
- `created_at` (timestamp)
- `deleted_at` (timestamp, nullable)

Câmpuri derivate (calculate, nu stocate):
- **rest de plată** = `total_amount - (paid_installments * installment_amount)`
- **rate rămase** = `total_installments - paid_installments`

Auto-dezactivare: la generarea ultimei rate, `paid_installments` ajunge egal cu `total_installments`, iar `is_active` devine `false`. Nu se mai generează tranzacții.

### `budgets` — bugete pe categorie
- `id` (uuid, PK)
- `household_id` (uuid → households)
- `category_id` (uuid → categories)
- `amount` (numeric) — limita lunară
- `month` (date) — luna pentru care e valabil (sau global, de decis la implementare)
- `created_at` (timestamp)
- `deleted_at` (timestamp, nullable)

### `savings_goals` — obiective de economisire
- `id` (uuid, PK)
- `household_id` (uuid → households)
- `name` (text) — ex: "Vacanță"
- `target_amount` (numeric)
- `current_amount` (numeric)
- `deadline` (date, nullable)
- `created_at` (timestamp)
- `deleted_at` (timestamp, nullable)

## 6. Modelul de securitate (RLS)

Fiecare tabel cu `household_id` are politici RLS care permit accesul **doar dacă utilizatorul curent e membru al gospodăriei respective**. Regula, în esență:

> Un rând e vizibil/modificabil dacă `household_id`-ul lui apare printre gospodăriile din care face parte utilizatorul curent (verificat în `household_members` cu `auth.uid()`).

Excepții pe rol:
- Ștergerea unei gospodării și gestiunea membrilor: doar `owner`.
- Restul operațiunilor: orice membru.

Detaliile de implementare RLS (politici SQL concrete) intră în `DOCS.md`.

## 7. Funcționalități — grupate pe faze

### Faza 1 — Nucleu funcțional
- Autentificare (register/login) prin Supabase Auth
- Creare gospodărie + apartenență automată ca `owner`
- Sistem minimal de roluri (`owner` / `member`)
- Categorii personalizabile (tipizate income/expense)
- Metode de plată
- Tranzacții manuale (sumă, tip, categorie, dată, persoană, notă, metodă de plată)
- Dashboard lunar: total venituri / cheltuieli / sold, cu carry-over
- Filtrări: lună, categorie, persoană, metodă de plată
- UX rapid (vezi secțiunea 8)
- Soft delete peste tot

### Faza 2 — Automatizări și analiză
- Invitații în gospodărie (cod/link)
- Tranzacții recurente (infinite)
- Angajamente/rate (finite, cu auto-dezactivare)
- Bugete pe categorie cu progres vizual și alertă la depășire
- Grafice (Recharts): cheltuieli pe categorie, evoluție lunară
- Obiective de economisire

### Faza 3+ — Ulterior (nu se construiește acum)
- OCR bonuri + citire PDF (SUSPENDAT la cererea utilizatorului — se revine dacă e cazul)
- Export CSV/PDF
- Notificări push (respins conștient — complicat pe PWA/iOS, inutil la acest volum)
- Multi-valută (respins — doar RON)
- Decontare între membri (respins — banii sunt comuni)

## 8. Cerințe UX (obligatorii în faza 1)

- **Adăugare rapidă** — formular de tranzacție nouă la un tap, pre-completat inteligent (data = azi, ultima categorie/metodă folosită).
- **Tastatură numerică by default** — focus automat pe câmpul sumă, tastatură numerică pe mobil.
- **Editare/ștergere ușoară** — orice tranzacție se editează sau șterge din câteva tap-uri.
- **Duplică tranzacția** — un tap pe o tranzacție existentă creează una identică de ajustat.
- **Empty states clare** — mesaje utile când nu există date ("Nicio cheltuială luna asta. Adaugă prima?").
- **Confirmare + undo la ștergere** — mesaj "am șters — anulează" câteva secunde (facilitat de soft delete).
- **Indicator "cine a adăugat"** — avatar/inițială pe fiecare tranzacție.

## 9. Ordinea de implementare recomandată

1. Setup proiect Next.js + Tailwind + conexiune Supabase
2. Schema bază de date + politici RLS (toate tabelele, chiar dacă unele se folosesc în faza 2)
3. Autentificare + creare/alegere gospodărie
4. Categorii + metode de plată (CRUD)
5. Tranzacții manuale (CRUD) + cerințele UX
6. Dashboard lunar + carry-over + filtrări
7. **— capăt Faza 1 —**
8. Invitații în gospodărie
9. Recurențe
10. Rate (angajamente)
11. Bugete + alerte
12. Grafice
13. Obiective de economisire
14. **— capăt Faza 2 —**

## 10. Fișiere de documentație asociate

- `UI.md` — toate paginile/ecranele și componentele (fișierul de lucru pentru partea de UI)
- `DESIGN.md` — direcția vizuală și design system (culori, tipografie, stil; se dă împreună cu UI.md)
- `DOCS.md` — documentația tehnică de sistem (arhitectură, nivel înalt)
- `DEVELOPER.md` — manual al dezvoltatorului (referință granulară de cod: ce face fiecare funcție/serviciu/componentă/endpoint/tabel)
- `MANUAL.md` — manual de utilizare pentru utilizatorii finali
- `ERRORS.md` — bază de cunoștințe de erori (consultată la fiecare eroare nouă)
- `CHANGELOG.md` — istoricul modificărilor pe versiuni
- `DEVLOG.md` — jurnal de dezvoltare (decizii, motivații, de făcut)
