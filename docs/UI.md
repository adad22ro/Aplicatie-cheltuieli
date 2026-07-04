# UI.md — Pagini, ecrane și componente

> Fișierul de lucru pentru partea de UI cu Claude Code. Descrie fiecare pagină, ce conține, navigația, componentele reutilizabile și stările fiecărui ecran. Referință de model de date: `PLAN.md` secțiunea 5.

---

## 1. Principii de UI

- **Mobile-first.** Aplicația se folosește preponderent pe telefon ca PWA. Design-ul pornește de la ecran îngust și se extinde spre desktop.
- **Navigație de jos (bottom navigation)** pe mobil — acces la un tap la secțiunile principale.
- **Adăugarea de tranzacții e acțiunea centrală** — buton flotant (FAB) prezent pe ecranele principale.
- Fiecare ecran are trei stări definite: **loading**, **empty**, **error**.
- Tailwind CSS pentru stilizare. Recharts pentru grafice.

## 2. Structura de navigație

Bottom navigation (mobil), sidebar (desktop):

1. **Acasă / Dashboard**
2. **Tranzacții**
3. **[FAB central: Adaugă]**
4. **Bugete & Analiză**
5. **Setări**

Autentificarea și onboarding-ul (alegere/creare gospodărie) sunt în afara navigației principale.

## 3. Pagini — faza 1

### 3.1. Autentificare (`/login`, `/register`)
- Formular email + parolă (Supabase Auth).
- Comutare între login și register.
- **Loading:** buton cu spinner la submit.
- **Error:** mesaj sub formular (credențiale greșite, email deja folosit).
- Redirect după succes: dacă utilizatorul nu are gospodărie → onboarding; altfel → dashboard.

### 3.2. Onboarding gospodărie (`/onboarding`)
- Două opțiuni: **Creează o gospodărie** (introduce nume) sau **Intră cu un cod de invitație** (faza 2 — în faza 1 doar creare).
- La creare, utilizatorul devine automat `owner`.
- **Empty:** ecran de bun venit explicativ.

### 3.3. Dashboard (`/`)
Ecranul principal. Sumar financiar al lunii curente.
- Selector de lună (navigare înainte/înapoi).
- Carduri: **Venituri**, **Cheltuieli**, **Sold** (cu carry-over din luna precedentă).
- Listă scurtă cu ultimele tranzacții.
- FAB "Adaugă tranzacție".
- **Loading:** skeleton pe carduri.
- **Empty:** "Nicio tranzacție luna asta. Adaugă prima?"
- **Error:** mesaj cu buton de reîncercare.

### 3.4. Listă tranzacții (`/transactions`)
- Listă cronologică grupată pe zile.
- Fiecare rând: sumă (colorată income/expense), categorie (icon+nume), metodă de plată, indicator "cine a adăugat" (inițială/avatar).
- **Filtrare:** lună, categorie, persoană, metodă de plată.
- Tap pe tranzacție → detaliu/editare.
- Long-press sau meniu → **Duplică**, **Editează**, **Șterge** (cu undo).
- **Empty:** mesaj + buton adăugare.

### 3.5. Adaugă/Editează tranzacție (`/transactions/new`, `/transactions/[id]/edit`)
Ecranul cel mai folosit — trebuie să fie rapid.
- Câmp **sumă** cu focus automat și tastatură numerică.
- Selector tip (venit/cheltuială) — filtrează categoriile afișate după `type`.
- Selector categorie.
- Selector metodă de plată.
- Dată (default = azi).
- Notă (opțional).
- Pre-completare: ultima categorie/metodă folosită.
- La editare: câmpuri populate.
- **Error:** validare inline (sumă obligatorie > 0, categorie obligatorie).

### 3.6. Setări (`/settings`)
Hub cu sub-pagini:
- **Categorii** (`/settings/categories`) — CRUD, tipizate income/expense, icon + culoare.
- **Metode de plată** (`/settings/payment-methods`) — CRUD.
- **Gospodărie** (`/settings/household`) — nume, membri, rolul fiecăruia. Doar `owner` vede gestiunea membrilor și ștergerea gospodăriei.
- **Cont** (`/settings/account`) — schimbare parolă, logout.

## 4. Pagini — faza 2

### 4.1. Invitații (`/settings/household/invite`)
- Generare cod/link de invitație (doar `owner`).
- Listă invitații active cu status (folosită/expirată).
- Ecran de intrare cu cod în onboarding.

### 4.2. Recurențe (`/recurring`)
- Listă recurențe active/inactive.
- Adăugare/editare: sumă, tip, categorie, metodă, ziua lunii, frecvență.
- Toggle activ/inactiv.

### 4.3. Rate / Angajamente (`/installments`)
- Listă angajamente cu **bară de progres**: rate plătite / total, rest de plată afișat clar.
- Card per angajament: nume, sumă rată, rate rămase, rest de plată.
- Adăugare: nume, total, sumă rată SAU număr rate (calcul reciproc), categorie, metodă, ziua lunii, dată start.
- Angajamentele finalizate apar dezactivate automat (secțiune separată "Finalizate").

### 4.4. Bugete & Analiză (`/budgets`)
- **Bugete:** listă categorii cu buget, bară de progres (cheltuit/limită), alertă vizuală la depășire.
- **Grafice (Recharts):**
  - Pie/donut — cheltuieli pe categorie (luna curentă).
  - Bar/line — evoluție venituri/cheltuieli pe ultimele luni.
- Selector de lună/perioadă.

### 4.5. Obiective de economisire (`/savings`)
- Listă obiective cu bară de progres (curent/țintă).
- Adăugare: nume, sumă țintă, deadline opțional.
- Acțiune de a adăuga sumă la un obiectiv.

## 5. Componente reutilizabile

- **`TransactionRow`** — un rând de tranzacție (sumă, categorie, metodă, autor).
- **`AmountInput`** — câmp de sumă cu tastatură numerică și focus automat.
- **`CategoryPicker`** — selector filtrat după tip.
- **`PaymentMethodPicker`** — selector metodă de plată.
- **`MonthSelector`** — navigare între luni.
- **`SummaryCard`** — card de sumar (venituri/cheltuieli/sold).
- **`ProgressBar`** — bară de progres (bugete, rate, obiective).
- **`EmptyState`** — mesaj + acțiune pentru ecrane goale.
- **`ConfirmDeleteToast`** — toast cu undo la ștergere.
- **`FAB`** — buton flotant de adăugare.
- **`BottomNav`** — navigația de jos (mobil).
- **`RoleGuard`** — ascunde/dezactivează acțiuni permise doar `owner`.

## 6. Stări globale de tratat pe fiecare ecran

- **Loading** — skeletons/spinnere, nu ecran gol.
- **Empty** — mesaj util + acțiune, niciodată tabel/listă goală fără explicație.
- **Error** — mesaj clar + buton de reîncercare.
- **Fără gospodărie** — redirect la onboarding.
- **Fără permisiune** (acțiune de owner accesată de member) — acțiunea nici nu apare (via `RoleGuard`).
