# MANUAL.md — Manual de utilizare

> Ghid pentru utilizatorii finali (familie, prieteni). Descrie aplicația așa cum va funcționa când e gata (manual "țintă", bazat pe plan). Se ajustează dacă implementarea aduce schimbări.

---

## 1. Ce este aplicația

O aplicație în care tu și ceilalți membri ai gospodăriei tale țineți evidența banilor: câți intră (venituri) și câți ies (cheltuieli). Toți membrii unei gospodării văd aceleași date, actualizate în timp real. Datele voastre sunt private — nimeni din altă gospodărie nu le vede.

## 2. Instalare pe telefon

Aplicația nu se descarcă din App Store sau Google Play. Se instalează direct din browser:

1. Deschide link-ul primit în browserul telefonului (Safari pe iPhone, Chrome pe Android).
2. **Pe Android:** apasă meniul (⋮) → "Adaugă la ecranul principal" / "Instalează aplicația".
3. **Pe iPhone:** apasă butonul de partajare (pătrat cu săgeată) → "Adaugă la ecranul principal".
4. Va apărea o iconiță pe ecran, ca orice altă aplicație. O deschizi de acolo.

## 3. Cont și gospodărie

### Primul utilizator
1. Creează-ți cont cu email și parolă.
2. La prima intrare, creează o **gospodărie** (dă-i un nume, ex: "Familia Popescu").
3. Devii automat **proprietar** (owner) al gospodăriei.

### Adăugarea altor membri (faza 2)
- Ca proprietar, mergi la **Setări → Gospodărie → Invită** și generează un cod/link.
- Trimite codul/link-ul persoanei.
- Ea își face cont și intră cu codul respectiv în gospodăria ta.

### Roluri
- **Proprietar (owner):** poate gestiona membrii și șterge gospodăria, pe lângă tot ce fac ceilalți.
- **Membru (member):** poate adăuga, edita și șterge tranzacții, categorii, bugete.

## 4. Adăugarea unei tranzacții

Acțiunea cea mai frecventă. Apasă butonul **+** (mereu vizibil).
1. Introdu **suma** (tastatura numerică apare automat).
2. Alege **tip:** venit sau cheltuială.
3. Alege **categoria** (ex: Mâncare, Salariu).
4. Alege **metoda de plată** (ex: Cash, Card).
5. **Data** e completată cu ziua de azi (o poți schimba).
6. Adaugă o **notă** dacă vrei.
7. Salvează.

Aplicația reține ultima categorie și metodă folosite, ca să adaugi și mai rapid data viitoare.

### Duplicarea unei tranzacții
Pentru cheltuieli care se repetă des dar neregulat (cumpărături la același magazin), apasă o tranzacție existentă și alege **Duplică** — se creează una identică, pe care doar o ajustezi.

### Editare și ștergere
- **Editează:** apasă tranzacția → modifică → salvează.
- **Șterge:** din meniul tranzacției. După ștergere apare câteva secunde opțiunea **Anulează**, în caz că ai greșit.

## 5. Dashboard (Acasă)

Ecranul principal îți arată, pentru luna curentă:
- **Venituri** — total bani intrați.
- **Cheltuieli** — total bani ieșiți.
- **Sold** — cât ai efectiv, ținând cont și de soldul reportat din luna trecută.

Poți naviga înainte/înapoi între luni.

## 6. Categorii și metode de plată

În **Setări** îți personalizezi:
- **Categoriile** — separat pentru venituri și cheltuieli, cu iconiță și culoare.
- **Metodele de plată** — cash, carduri, Revolut etc.

## 7. Recurențe (faza 2)

Pentru plăți care se repetă lunar identic (chirie, abonamente, salariu): le definești o dată, iar aplicația le adaugă automat în fiecare lună. Le poți dezactiva oricând.

## 8. Rate (faza 2)

Pentru lucruri cumpărate în rate (telefon, electrocasnice):
- Introduci **totalul**, **suma unei rate** (sau numărul de rate) și ziua de plată.
- Aplicația adaugă rata automat lunar și îți arată **câte rate ai mai rămas** și **cât mai ai de plătit**.
- Când achiți ultima rată, angajamentul se **dezactivează automat**.

## 9. Bugete (faza 2)

Setezi o limită lunară pe o categorie (ex: Mâncare — 1000 RON). Aplicația îți arată o bară de progres și te avertizează când te apropii sau depășești limita.

## 10. Grafice (faza 2)

Vezi vizual pe ce se duc banii:
- Un grafic circular cu cheltuielile pe categorii.
- Un grafic cu evoluția veniturilor și cheltuielilor pe ultimele luni.

## 11. Obiective de economisire (faza 2)

Îți setezi o țintă (ex: "Vacanță — 5000 RON") și urmărești progresul pe măsură ce adaugi bani spre acel obiectiv.

## 12. Întrebări frecvente

**Datele mele sunt private?** Da. Doar membrii gospodăriei tale le văd.

**Pot fi în mai multe gospodării?** Da — structura permite acest lucru (ex: gospodăria proprie și cea a părinților).

**Funcționează fără internet?** Vizualizarea funcționează parțial offline (PWA), dar pentru sincronizare ai nevoie de conexiune.

**Am șters din greșeală o tranzacție.** Ai câteva secunde să apeși "Anulează" imediat după ștergere.
