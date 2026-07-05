# Handoff: Machetă colorată mobile-first (varianta 1a "Indigo + categorii vii")

## Overview
Redesign vizual pentru aplicația de cheltuieli (Next.js + Tailwind + Supabase, repo `Aplicatie-cheltuieli`). Scopul: aplicația actuală (teal `#2DB3A6` + coral discret, culoare folosită sobru) devine mult mai colorată și mai intuitivă, păstrând structura de ecrane și componentele existente. Optimizat exclusiv pentru mobil — desktop nu e prioritate.

## Despre fișierele de design
Fișierul `mockup.dc.html` din acest folder este un **prototip HTML de referință** (interactiv — poți schimba tab-urile și modul light/dark direct în el), NU cod de producție. Sarcina e să **recreezi acest design în codebase-ul existent** — componentele React/Tailwind din `app/` și `components/`, folosind convențiile deja stabilite acolo (tokeni CSS semantici din `globals.css`, componente reutilizabile din `UI.md`).

## Fidelitate
**High-fidelity.** Culori exacte, tipografie, spațiere și structură de layout sunt definitive și pot fi implementate ca atare. Micro-interacțiile (hover/press states) urmează convenția existentă din `page.tsx` (hover:bg-background etc.) — extinde-le cu noile culori.

## 1. Ce se schimbă vs. ce rămâne

**Rămâne neschimbat:**
- Toată logica, rutele, structura de date, `lib/actions`, `lib/data`, schema DB.
- Structura de ecrane și navigație descrisă în `docs/UI.md` (bottom nav, FAB central, cele 3 stări loading/empty/error).
- Regula mod luminos/întunecat obligatoriu comutabil, cu tokeni semantici (nu culori hardcodate în componente).

**Se schimbă (vezi Design Tokens):**
- Paleta de culori — de la teal/coral discret la un sistem mult mai colorat: indigo/violet ca accent principal, plus o **paletă dedicată de 8 culori de categorie** (mâncare, transport, distracție, sănătate, facturi, cumpărături, cafea, salariu) afișate ca cercuri/cipsuri colorate — element vizual recurent pe toate ecranele.
- Cardurile de sumar (Venituri/Cheltuieli) devin **tonuri (tinted)** — fundal colorat discret + text în culoarea semantică, nu doar text colorat pe fundal alb.
- Bara de tab-uri principale (Acasă/Tranzacții/Adaugă/Bugete) — folosită ca pattern de navigație secundară vizibilă, cu segment activ plin în culoarea primară.

## 2. Design Tokens

Actualizează `app/globals.css` — păstrează exact aceiași **nume de tokeni** (nu le redenumi, ca să nu rupă restul codului), doar valorile:

```css
:root {
  --background: #FBF8FF;
  --surface:    #FFFFFF;
  --border:     #EAE3F7;
  --foreground: #241B33;
  --muted:      #7A7186;

  --primary:       #7C3AED;  /* indigo/violet, în loc de teal */
  --primary-hover: #6D28D9;
  --accent:        #F97316;  /* portocaliu cald, opțional pt. highlight-uri secundare */

  --income:  #16A34A;
  --expense: #DC2626;
  --warning: #F59E0B;
}

.dark {
  --background: #171220;
  --surface:    #231A32;
  --border:     #382A4B;
  --foreground: #F3EEFA;
  --muted:      #A99CBC;

  --primary:       #7C3AED;
  --primary-hover: #8B5CF6;
  --accent:        #FB923C;

  --income:  #4ADE80;
  --expense: #FB7185;
  --warning: #F5B54A;
}
```

### Paletă de categorii (NOU — nu exista în sistemul actual)
Adaugă un token nou pe categorie, gestionat unde sunt definite categoriile (`lib/data`, `CategoryManager.tsx`). Fiecare categorie primește o culoare din această listă (utilizatorul poate alege altă culoare la creare, dar acestea sunt valorile implicite propuse):

| Categorie      | Hex       | Icon (Lucide sugestie) |
|---|---|---|
| Mâncare        | `#FF6B4A` | Utensils |
| Transport      | `#3B82F6` | Car |
| Distracție     | `#A855F7` | PartyPopper |
| Sănătate       | `#EC4899` | HeartPulse |
| Facturi        | `#14B8A6` | Receipt |
| Cumpărături    | `#F59E0B` | ShoppingBag |
| Cafea          | `#B45309` | Coffee |
| Salariu (venit)| `#22C55E` | Wallet |

Aceste culori sunt independente de `--income`/`--expense` — ele colorează DOAR cercul iconiței categoriei, nu suma (suma rămâne verde/roșu după tipul income/expense, conform DESIGN.md §3 — regulă păstrată).

### Tipografie
- Font: **Nunito** (Google Fonts, weight-uri 400/600/700/800/900) — înlocuiește recomandarea Inter/Nunito nedecisă din DESIGN.md cu Nunito definitiv, pentru senzația rotundă/prietenoasă cerută.
- Sume: `font-variant-numeric: tabular-nums`, bold.
- Titlu ecran/header: 19px/800.
- Sumă mare (Add screen): 34px/900.
- Sumă card sumar: 19-24px/800.
- Text normal: 14-15px/700 pt. titluri de rând, 12-13px/600-700 pt. muted.

### Spațiere & forme
- Radius carduri mari: 16-18px. Radius chip-uri/butoane: 10-14px. Cercuri iconițe: 11-12px radius (squircle), 36-40px diametru.
- Padding card: 14-16px. Gap între carduri: 10-14px. Margine laterală ecran: 16px.
- Umbră: doar pe bara de tab-uri plutitoare (`0 1px 4px rgba(0,0,0,.06)`); restul cardurilor folosesc border 1px `--border`, fără umbră (păstrează regula "umbre subtile" din DESIGN.md).

## 3. Ecrane (conținut din prototip)

### 3.1 Acasă / Dashboard
- Header: nume gospodărie + buton toggle temă (☀️/🌙).
- Bară de tab-uri sub header: Acasă / Tranzacții / Adaugă / Bugete — segment activ = fundal `--primary`, text alb; inactiv = text `--muted`, fundal transparent. (Notă: aceasta e o adăugare vizuală față de bottom-nav-ul existent — poate înlocui sau completa bottom nav-ul curent, discutați cu echipa dacă păstrați ambele nivele de navigare sau doar unul.)
- Selector lună: rând cu ← / "Iulie 2026" / →, în card cu border.
- Carduri sumar Venituri/Cheltuieli: grid 2 coloane, fundal **tinted** (verde foarte deschis / roșu foarte deschis), text sumă în culoarea semantică plină.
- Card Sold: full-width, label + sumă mare + linie "Report: X RON".
- Grid rapid 4 coloane (Recurențe/Rate/Bugete/Obiective) — carduri cu fundal tinted alternat (roz/albastru deschis/mov deschis/verde deschis).
- Secțiune "Tranzacții recente": rânduri cu cerc colorat de categorie + icon, nume categorie, metodă+autor, sumă aliniată dreapta (verde/roșu).

### 3.2 Tranzacții
- Rând de filtre (chip-uri: lună, categorie, persoană, metodă) scrollabile orizontal.
- Listă grupată pe zile, header zi ("Azi, 5 iul") + rânduri identice cu cele de pe dashboard.

### 3.3 Adaugă tranzacție
- Toggle segmentat Cheltuială/Venit (2 coloane, activ = fundal plin culoare semantică).
- Card sumă mare, centrat, editabil (focus automat + tastatură numerică pe mobil).
- Grid 4 coloane cu chip-uri de categorie (cerc colorat + nume dedesubt) — selectat = border/scale accent.
- Rând metode de plată (3 segmente orizontale).
- Buton "Salvează tranzacția" — full width, fundal `--primary`, umbră colorată `0 6px 16px {primary}55`.

### 3.4 Bugete
- Donut chart (conic-gradient din culorile categoriilor) cu "Total cheltuit" în centru — poate fi Recharts PieChart cu aceleași culori de categorie.
- Listă carduri de buget per categorie: icon colorat + nume, "cheltuit / limită", bară de progres — verde/culoare categorie normal, portocaliu (`--warning`) peste 80%, roșu (`--expense`) la depășire.

## 4. Interacțiuni
- Tab switch (Acasă/Tranzacții/Adaugă/Bugete) — schimbare instant de conținut, fără animație de tranziție necesară (poate primi fade scurt 150ms opțional).
- Toggle dark mode — click pe buton ☀️/🌙, persistă în localStorage (`theme` — deja specificat în DESIGN.md §2, implementează cele 3 stări: Luminos/Întunecat/Sistem).
- Progress bar-uri buget: culoare se schimbă dinamic în funcție de procent (normal → warning la 80% → over la 100%+), fără animație, doar recalcul la fiecare render.
- Toate elementele touch (chip-uri, butoane, rânduri) trebuie să aibă zonă de atingere minimă 44px înălțime.

## 5. Assets
- Iconițe folosite în prototip sunt emoji ca placeholder (🍔🚗🎉💊💡🛍️☕💰🔁💳🎯🐷) — **înlocuiește cu Lucide** (`lucide-react`, deja recomandat în DESIGN.md §7) la implementare, păstrând aceeași mapare categorie→pictogramă din tabelul de mai sus.
- Fără alte imagini/assets externe.

## 6. Fișiere din acest pachet
- `mockup.dc.html` — prototipul HTML interactiv (deschide în browser; e self-contained, funcționează offline).

## Note finale
- Verifică toate perechile de culoare din tabel pentru contrast ≥4.5:1 în ambele moduri înainte de a le fixa în `tailwind.config`/`globals.css` — valorile de mai sus sunt un punct de plecare, la fel ca în `DESIGN.md` original.
- Nu introduce culori noi hardcodate în componente — toate valorile de mai sus trec prin tokenii CSS semantici existenți + noul token de "categorie" (mapat per-categorie, nu global).
