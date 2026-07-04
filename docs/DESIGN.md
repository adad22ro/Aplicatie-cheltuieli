# DESIGN.md — Direcție vizuală și design system

> Regulile vizuale ale aplicației: culori, tipografie, spațiere, stil de componente, ton. Claude Code citește acest fișier alături de `UI.md` ca să producă un aspect coerent și intenționat, nu unul generic. Nu conține mockup-uri — conține reguli care se aplică peste tot.

---

## 1. Direcție generală

**Senzație:** prietenoasă, caldă, colorată, relaxată — dar ordonată. O aplicație în care îți place să intri, nu una rece de contabilitate. Fără să devină haotică sau neserioasă: sunt bani la mijloc, deci claritatea bate decorul.

**Principii:**
- Colțuri rotunjite, spațiere generoasă, senzație „soft".
- Culoare folosită cu intenție, nu peste tot. Accentele colorate ghidează ochiul; nu inundă ecranul.
- Culorile cu semnificație financiară (venit/cheltuială) sunt **rezervate** și nu se folosesc decorativ (vezi secțiunea 3).
- Lizibilitate înainte de toate: contrast bun în ambele moduri.

## 2. Mod luminos + întunecat (obligatoriu comutabil)

**Regulă tehnică fundamentală:** NU se scriu culori fixe direct în componente. Se folosesc **variabile CSS semantice** (numite după rol, nu după culoare) + clasa `dark:` din Tailwind. Astfel comutarea între moduri schimbă valorile, nu codul.

Greșit: `text-black`, `bg-white` (se strică la comutare).
Corect: `text-[var(--color-text)]` / clase Tailwind mapate pe tokens semantici, cu variantă `dark:`.

Comutatorul de temă:
- Trei stări recomandate: **Luminos**, **Întunecat**, **După sistem** (urmează setarea telefonului).
- Alegerea se salvează (localStorage / preferință utilizator).
- Implementare Tailwind: strategia `class` (se adaugă/scoate clasa `dark` pe `<html>`).

## 3. Paletă de culori (semantică)

> Valorile hex de mai jos sunt un **punct de plecare** coerent cu direcția „prietenos + cald". Se pot rafina la implementare, dar rolurile (tokenii) rămân fixe.

### Culori de brand / accent (interfață)
Un accent cald și prietenos ca identitate principală (ex. un coral/portocaliu-cald sau un teal blând). Propunere:
- `--color-primary` — accent principal (butoane, elemente active). Ex. teal cald `#2DB3A6`.
- `--color-primary-hover` — varianta la hover/apăsare.
- `--color-accent` — accent secundar pentru evidențieri prietenoase. Ex. coral `#FF8A65`.

### Culori FUNCȚIONALE — REZERVATE (nu decorative)
Acestea au sens financiar și NU se folosesc în alte scopuri:
- `--color-income` — verde, pentru venituri și valori pozitive. Ex. `#2E9E5B`.
- `--color-expense` — roșu/corai-închis, pentru cheltuieli și valori negative. Ex. `#E5484D`.
- `--color-warning` — galben/ambră, pentru alerte de buget (aproape de limită). Ex. `#F5A623`.
- `--color-over-budget` — folosește `--color-expense` sau o nuanță mai intensă la depășire.

### Culori neutre / structură (diferite per mod)
| Token | Rol | Luminos | Întunecat |
|---|---|---|---|
| `--color-bg` | fundal principal | aproape alb cald `#FAF9F7` | gri-închis cald `#1A1A1E` |
| `--color-surface` | carduri, panouri | alb `#FFFFFF` | `#26262B` |
| `--color-border` | linii, contururi | `#E8E6E1` | `#3A3A40` |
| `--color-text` | text principal | `#1F1F23` | `#F2F1EE` |
| `--color-text-muted` | text secundar | `#6B6B70` | `#A0A0A6` |

> Toate perechile trebuie verificate pentru contrast suficient (țintă: text normal ≥ 4.5:1). Verzii/roșii pentru income/expense trebuie să rămână distinct vizibile în ambele moduri — ajustează nuanța pe fundal închis dacă e nevoie.

## 4. Tipografie

- **Font:** un sans-serif prietenos și lizibil, gratuit (Google Fonts). Recomandare: **Inter** (neutru, excelent la cifre) sau **Nunito** (mai rotund, mai „cald/prietenos"). Pentru direcția aleasă, **Nunito** se potrivește senzației relaxate; **Inter** e mai sigur pentru cifre dense. Alege una și fii consecvent.
- **Cifrele contează.** Aplicația e plină de sume — folosește un font cu cifre lizibile și, ideal, `font-variant-numeric: tabular-nums` la liste de sume, ca cifrele să se alinieze pe coloane.
- **Scară tipografică** (punct de plecare):
  - Titlu ecran: 24–28px, semibold.
  - Subtitlu/secțiune: 18–20px, semibold.
  - Text normal: 15–16px.
  - Text secundar/etichete: 13–14px.
  - Sume mari (dashboard): 28–36px, bold.

## 5. Spațiere, colțuri, umbre

- **Colțuri rotunjite** peste tot: carduri `rounded-2xl` (~16px), butoane `rounded-xl` (~12px), input-uri `rounded-lg`. Senzație soft, prietenoasă.
- **Spațiere generoasă:** padding interior de card ~16–20px, spațiu între carduri ~12–16px. Nu înghesui.
- **Umbre subtile, nu dure:** umbre soft difuze pe carduri în modul luminos (ex. `shadow-sm`/`shadow-md` blând). În modul întunecat, umbrele aproape dispar — separarea se face prin `--color-surface` vs `--color-bg`, nu prin umbre.
- **Grid mobil:** un singur „coloană" pe telefon, cu carduri pe toată lățimea și margini laterale confortabile (~16px).

## 6. Componente — stil vizual

- **Butoane primare:** fundal `--color-primary`, text alb, colțuri rotunjite, feedback clar la apăsare. Butonul flotant (FAB) de adăugare — rotund, `--color-primary`, umbră blândă, mereu accesibil cu degetul mare.
- **Carduri sumar (dashboard):** fundal `--color-surface`, sumă mare, etichetă mică deasupra. Cardul de venit poate avea un accent verde subtil, cel de cheltuială un accent roșu subtil — dar discret (o linie, o iconiță), nu tot cardul colorat.
- **Rânduri de tranzacție:** iconiță categorie într-un cerc colorat (culoarea categoriei), sumă aliniată la dreapta, verde/roșu după tip. Inițiala autorului mic, într-un cerc.
- **Bare de progres (buget/rate/obiective):** rotunjite, cu culoare care trece de la `--color-primary`/`--color-income` spre `--color-warning` și `--color-over-budget` pe măsură ce se apropie/depășește limita.
- **Empty states:** ilustrație simplă sau iconiță mare prietenoasă + mesaj cald + buton de acțiune. Aici e locul potrivit pentru un strop de personalitate.
- **Grafice (Recharts):** folosesc paleta categoriilor pentru pie/donut; pentru bare de venit/cheltuială folosesc `--color-income`/`--color-expense`. Culorile graficelor trebuie citite din aceiași tokeni, ca să funcționeze în ambele moduri.

## 7. Iconografie

- Set de iconițe consecvent, gratuit. Recomandare: **Lucide** (se integrează nativ cu React, `lucide-react`, deja uzual în stack). Stil linear, prietenos.
- Fiecare categorie are o iconiță + o culoare (alese de utilizator). Cercul colorat al iconiței e un element vizual recurent care aduce culoarea „prietenoasă" fără a inunda interfața.

## 8. Ce se evită (ca să nu devină haotic)

- Prea multe culori de accent simultan pe același ecran.
- Culori vesele care concurează cu verde/roșu-ul financiar — utilizatorul trebuie să distingă instant venit vs. cheltuială.
- Contrast slab „de dragul esteticii" (text gri-deschis pe fundal deschis).
- Umbre dure, gradienți stridenti, animații care distrag.

## 9. Relația cu celelalte fișiere

- `UI.md` — spune CE ecrane/componente există. `DESIGN.md` (acest fișier) spune CUM arată.
- Se dau împreună lui Claude Code. Tokenii de culoare definiți aici se configurează o singură dată (în config-ul Tailwind + variabile CSV globale) și se folosesc peste tot.
- La orice ecran nou, se respectă tokenii și regulile de aici — nu se introduc culori „ad-hoc" în componente.
