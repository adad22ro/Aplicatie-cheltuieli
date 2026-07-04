# ERRORS.md — Bază de cunoștințe de erori

> **Instrucțiune pentru Claude Code:** citește acest fișier ÎNAINTE de a rezolva orice eroare nouă. Verifică dacă eroarea (sau una similară) a mai apărut. Dacă da, aplică soluția documentată. Dacă e o eroare nouă, rezolvă-o și ADAUGĂ o intrare nouă aici după modelul de mai jos. Scopul: să nu rezolvăm de două ori aceeași problemă.

---

## Cum se folosește acest fișier

- **Caută întâi:** înainte de a investiga, caută în acest fișier după mesajul de eroare sau un cuvânt-cheie din el.
- **Adaugă mereu:** după ce rezolvi o eroare nouă, adaugă o intrare. Chiar dacă pare banală.
- **Fii specific:** notează simptomul exact (mesajul de eroare), nu doar o descriere vagă.

## Format intrare

Fiecare eroare se documentează astfel:

```
### [ID] Titlu scurt al erorii
- **Dată:** AAAA-LL-ZZ
- **Simptom:** mesajul de eroare exact / comportamentul observat
- **Context:** unde apare (fișier, pagină, acțiune)
- **Cauză:** de ce se întâmplă
- **Soluție:** ce s-a făcut concret pentru a rezolva
- **Prevenire:** (opțional) cum se evită pe viitor
```

---

## Categorii frecvente de urmărit

Pe măsură ce apar, erorile tind să se grupeze în:
- **RLS / permisiuni** — "row violates row-level security policy", rânduri care nu apar deși există.
- **Autentificare** — sesiune expirată, `auth.uid()` null pe server.
- **Supabase client** — folosirea clientului greșit (browser vs. server), chei lipsă.
- **Next.js App Router** — "use client" lipsă/inutil, Server Action apelat greșit, hydration mismatch.
- **Tipuri TypeScript** — nepotriviri între schema DB și tipurile din cod.
- **Generare recurențe/rate** — dubluri, generare ratată, `is_active` neactualizat.
- **PWA** — service worker cache-uit vechi, manifest invalid.

---

## Intrări

> Deocamdată gol. Prima eroare rezolvată în timpul dezvoltării se documentează aici.

<!--
Exemplu de intrare (șablon de urmat, se șterge când apare prima eroare reală):

### [E001] RLS blochează inserarea de tranzacții
- **Dată:** 2026-01-01
- **Simptom:** "new row violates row-level security policy for table transactions"
- **Context:** Server Action de adăugare tranzacție.
- **Cauză:** household_id trimis nu corespundea unei gospodării în care utilizatorul e membru; sau politica INSERT avea WITH CHECK greșit.
- **Soluție:** validat household_id-ul din household_members înainte de insert; corectat WITH CHECK.
- **Prevenire:** întotdeauna derivă household_id din apartenența utilizatorului, nu din input client.
-->
