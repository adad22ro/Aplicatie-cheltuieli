export const metadata = {
  title: "Curs — cum e construită aplicația",
};

/**
 * „Curs” intern (doar admin): explică arhitectura aplicației pas cu pas, pentru
 * învățare. Conținut static, pe înțelesul cuiva la început de drum.
 */
export default function CursPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold">Cum e construită aplicația</h2>
        <p className="mt-1 text-muted">
          Un ghid de la zero despre logica din spate și cum se leagă fișierele între ele.
          Scopul: să înțelegi tiparele ca să pornești corect un proiect nou. Apasă pe fiecare
          capitol.
        </p>
      </div>

      <nav className="rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="mb-2 font-semibold">Cuprins</p>
        <ol className="flex list-decimal flex-col gap-1 pl-5">
          {[
            ["#stack", "Din ce e făcută (și de ce)"],
            ["#mental", "Modelul mental: Server vs Client"],
            ["#structura", "Harta folderelor"],
            ["#citire", "Drumul unei citiri (de la click la ecran)"],
            ["#scriere", "Drumul unei modificări (formular → bază de date)"],
            ["#db", "Baza de date și RLS (unde stă securitatea reală)"],
            ["#auth", "Autentificarea"],
            ["#cache", "Randare, cache și revalidare"],
            ["#stil", "Stilizarea (Tailwind, tokeni, temă)"],
            ["#pwa", "PWA (aplicația pe telefon)"],
            ["#migrari", "Migrări și tipuri"],
            ["#securitate", "Securitate, pe scurt"],
            ["#reteta", "Rețeta pentru un proiect nou"],
            ["#glosar", "Glosar"],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="text-primary hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Ch id="stack" n="1" title="Din ce e făcută (și de ce)">
        <P>
          Aplicația e un site web care rulează și ca aplicație de telefon. E construită din câteva
          piese care lucrează împreună:
        </P>
        <Ul>
          <Li>
            <B>Next.js</B> — „scheletul”. Un framework peste <B>React</B> care se ocupă de pagini,
            rutare (ce URL arată ce), randare pe server și comunicarea cu serverul. E și codul care
            rulează în browser, și cel care rulează pe server.
          </Li>
          <Li>
            <B>React</B> — biblioteca cu care construiești interfața din „componente” (bucăți de UI
            reutilizabile, ca niște cărămizi).
          </Li>
          <Li>
            <B>TypeScript</B> — JavaScript cu <B>tipuri</B>. Îți spune din timp „aici aștepți un
            număr, nu un text”, prinzând greșeli înainte să rulezi.
          </Li>
          <Li>
            <B>Supabase</B> — baza de date (Postgres) + autentificare + reguli de securitate. Aici
            stau efectiv datele (tranzacții, categorii, useri).
          </Li>
          <Li>
            <B>Tailwind CSS</B> — stilizarea prin clase scurte scrise direct în HTML
            (<Mono>rounded-xl</Mono>, <Mono>text-muted</Mono>).
          </Li>
          <Li>
            <B>Vercel</B> — unde e „găzduită” (deployată) aplicația. Când dai push pe GitHub, Vercel
            o construiește și o publică automat.
          </Li>
        </Ul>
        <Note>
          Ideea de reținut: <B>Next.js e liantul</B>. El leagă browserul (React) de server (unde
          vorbește cu Supabase), fără să scrii tu manual un „backend” separat.
        </Note>
      </Ch>

      <Ch id="mental" n="2" title="Modelul mental: Server vs Client">
        <P>
          Cel mai important concept din tot proiectul. În Next.js modern (App Router), fiecare
          componentă rulează fie <B>pe server</B>, fie <B>în browser (client)</B>. Diferența
          schimbă tot.
        </P>
        <Ul>
          <Li>
            <B>Server Component</B> (implicit) — rulează pe server, poate citi direct din baza de
            date, <B>nu</B> are butoane interactive/stare. E rapid și sigur (secretele rămân pe
            server). Aproape toate <Mono>page.tsx</Mono> sunt așa.
          </Li>
          <Li>
            <B>Client Component</B> — începe fișierul cu <Mono>{`"use client"`}</Mono>. Rulează în
            browser, poate folosi <Mono>useState</Mono>, <Mono>onClick</Mono>, animații — orice e
            interactiv. Dar <B>nu</B> poate atinge direct baza de date.
          </Li>
        </Ul>
        <P>Cum decizi care e care? Regula simplă:</P>
        <Code>{`Are nevoie de click / stare / animatie / localStorage?
   -> Client Component ("use client")

Doar afiseaza date aduse de pe server?
   -> Server Component (implicit, fara "use client")`}</Code>
        <P>
          Exemplu din proiect: pagina <Mono>app/(app)/page.tsx</Mono> (dashboard) e Server Component
          — aduce datele. Dar <Mono>components/BottomNav.tsx</Mono> și{" "}
          <Mono>components/settings/ThemeToggle.tsx</Mono> sunt Client (au click și stare).
        </P>
        <Note>
          Tipar cheie: pagina-server aduce datele și le <B>pasează ca props</B> unei
          componente-client care se ocupă de interactivitate. Așa ai și viteză (server), și
          interactivitate (client).
        </Note>
      </Ch>

      <Ch id="structura" n="3" title="Harta folderelor">
        <P>Fiecare folder are un rol clar. Asta e „scheletul” pe care îl poți refolosi oriunde:</P>
        <Code>{`app/            paginile si rutele (fiecare folder = un URL)
  (app)/        zona logata (dashboard, tranzactii, bugete)
  (auth)/       login, register, resetare parola
  admin/        panoul de admin (unde esti acum)
  api/          mini-servere (ex. /api/generate-due)
  layout.tsx    invelisul comun (fonturi, tema)
  globals.css   culorile si stilurile de baza

components/     caramizile de UI reutilizabile (React)

lib/            "creierul", cod fara interfata:
  data/         CITIRI din baza de date (getMonthlySummary)
  actions/      SCRIERI (Server Actions: adauga/sterge)
  schemas/      reguli de validare (Zod) pentru ce intra
  supabase/     conectarea la baza de date
  auth/         cine e userul curent, e admin?
  utils/        functii ajutatoare (formatare luni etc.)

supabase/migrations/  schema bazei de date (tabele, reguli)
types/database.ts     tipurile generate din baza de date`}</Code>
        <P>
          Observă separarea: <B>citirile</B> stau în <Mono>lib/data</Mono>, iar <B>scrierile</B> în{" "}
          <Mono>lib/actions</Mono>. Paginile nu vorbesc niciodată „direct” cu baza de date de peste
          tot — cheamă aceste funcții. Asta ține codul curat și ușor de schimbat.
        </P>
      </Ch>

      <Ch id="citire" n="4" title="Drumul unei citiri (de la click la ecran)">
        <P>
          Ce se întâmplă, pas cu pas, când deschizi dashboard-ul? Urmărește drumul — e mereu la fel:
        </P>
        <Code>{`1. Browserul cere pagina "/"
        |
2. MIDDLEWARE (proxy.ts) - ruleaza INAINTE de orice
        |   verifica: esti logat? daca nu -> redirect la /login
        v
3. PAGINA server (app/(app)/page.tsx)
        |   cheama functii de citire din lib/data
        v
4. lib/data/dashboard.ts -> intreaba Supabase
        |
5. SUPABASE aplica RLS (vezi doar datele gospodariei tale)
        |   intoarce randurile
        v
6. Pagina construieste HTML-ul cu datele
        |   paseaza props catre componente (ex. TransactionsList)
        v
7. Browserul primeste pagina gata randata -> o vezi`}</Code>
        <P>
          Punctul cheie: pașii 2–6 se întâmplă <B>pe server</B>. Browserul primește deja pagina
          făcută, nu o listă de cereri. De-aia e rapid și de-aia secretele (cheile bazei de date)
          nu ajung niciodată în browser.
        </P>
        <Note>
          <B>Middleware</B> (<Mono>proxy.ts</Mono>) e ca un portar la intrare: rulează la fiecare
          request și decide dacă te lasă sau te trimite la login. Aici am reparat mai devreme și
          problema PWA — trebuia să lăsăm manifestul să treacă fără login.
        </Note>
      </Ch>

      <Ch id="scriere" n="5" title="Drumul unei modificări (formular → bază de date)">
        <P>
          Când <B>adaugi</B> o tranzacție, drumul e invers și trece prin <B>Server Actions</B> —
          funcții care rulează pe server dar pot fi chemate direct dintr-un formular, fără să scrii
          tu un API.
        </P>
        <Code>{`1. Completezi formularul (TransactionForm.tsx, client)
        |   apesi "Adauga"
        v
2. Se cheama o SERVER ACTION (lib/actions/transactions.ts)
        |   functie marcata cu "use server"
        v
3. VALIDARE cu Zod (lib/schemas/transactions.ts)
        |   suma e numar pozitiv? categoria exista?
        |   daca nu -> intoarce o eroare afisata in formular
        v
4. Scrie in Supabase (insert in tabela transactions)
        |   RLS verifica din nou ca ai voie
        v
5. revalidatePath("/") - spune Next "datele s-au schimbat,
        |   reincarca pagina afectata"
        v
6. Ecranul se actualizeaza cu tranzactia noua`}</Code>
        <P>Fișierele care lucrează împreună aici, și rolul fiecăruia:</P>
        <Ul>
          <Li>
            <Mono>components/…Form.tsx</Mono> — formularul (client): adună ce scrii.
          </Li>
          <Li>
            <Mono>lib/actions/…ts</Mono> — acțiunea (server): primește datele, le salvează.
          </Li>
          <Li>
            <Mono>lib/schemas/…ts</Mono> — regulile (Zod): „poarta de control” care respinge datele
            greșite <B>înainte</B> să ajungă în baza de date.
          </Li>
        </Ul>
        <Note>
          De ce validăm cu Zod pe server, nu doar în formular? Pentru că validarea din browser poate
          fi ocolită. <B>Regula de aur:</B> nu avea niciodată încredere în ce vine din browser —
          verifică mereu și pe server.
        </Note>
      </Ch>

      <Ch id="db" n="6" title="Baza de date și RLS (unde stă securitatea reală)">
        <P>
          Datele stau în <B>Postgres</B> (prin Supabase), organizate în <B>tabele</B>:{" "}
          <Mono>transactions</Mono>, <Mono>categories</Mono>, <Mono>households</Mono>,{" "}
          <Mono>household_members</Mono> etc. Tabelele sunt legate între ele prin <B>id</B>-uri (o
          tranzacție are un <Mono>household_id</Mono> și un <Mono>category_id</Mono>).
        </P>
        <P>
          Partea genială e <B>RLS (Row Level Security)</B> — reguli scrise în baza de date care spun
          „fiecare user vede/modifică <B>doar</B> rândurile gospodăriei lui”. Nu e o verificare în
          codul aplicației (care s-ar putea uita), ci în <B>inima bazei de date</B>. Chiar dacă
          codul ar avea un bug, baza de date tot nu ți-ar arăta datele altcuiva.
        </P>
        <Code>{`Exemplu de politica RLS (simplificat):

  "poti vedea un rand din transactions
   DOAR daca esti membru al acelei gospodarii"

-> scris o data, se aplica la ORICE interogare, automat.`}</Code>
        <P>
          De-aia funcțiile din <Mono>lib/data</Mono> pot scrie liniștit „adu-mi toate tranzacțiile”
          — RLS filtrează automat la ale tale. Asta e un tipar foarte puternic: <B>securitatea e
          lângă date</B>, nu împrăștiată prin cod.
        </P>
      </Ch>

      <Ch id="auth" n="7" title="Autentificarea">
        <P>Cum știe aplicația cine ești:</P>
        <Ul>
          <Li>
            La login, Supabase îți dă un <B>token</B> (o „legitimație”) păstrat într-un cookie în
            browser.
          </Li>
          <Li>
            La fiecare cerere, <B>middleware-ul</B> (<Mono>proxy.ts</Mono>) validează tokenul cu
            Supabase — de-aia e sigur, nu se bazează doar pe cookie.
          </Li>
          <Li>
            În pagini, <Mono>lib/auth/current-user.ts</Mono> îți dă userul curent. L-am optimizat cu{" "}
            <Mono>React.cache()</Mono> ca să nu-l întrebe de mai multe ori pe aceeași încărcare.
          </Li>
          <Li>
            Adminul e verificat separat prin <Mono>requireAdmin()</Mono> (compară e-mailul cu{" "}
            <Mono>ADMIN_EMAIL</Mono>). De-aia pagina asta e vizibilă doar ție.
          </Li>
        </Ul>
      </Ch>

      <Ch id="cache" n="8" title="Randare, cache și revalidare">
        <P>Trei idei care explică de ce aplicația e rapidă (și cum am optimizat-o):</P>
        <Ul>
          <Li>
            <B>Randare pe server</B> — pagina vine gata făcută din server, nu se „construiește” în
            browser cu zeci de cereri.
          </Li>
          <Li>
            <B>revalidatePath</B> — după o modificare, spui explicit „datele de pe ruta asta s-au
            schimbat, reîncarcă-le”. Fără asta ai vedea date vechi.
          </Li>
          <Li>
            <B>loading.tsx</B> — cât se aduc datele, Next afișează automat un „schelet” (plăcile gri
            animate pe care le-am adăugat). Aplicația <B>pare</B> instant.
          </Li>
        </Ul>
        <P>
          Tot la capitolul viteză: am mutat generarea recurențelor în fundal
          (<Mono>/api/generate-due</Mono>), am aliniat regiunea serverului cu baza de date (Dublin ↔
          Irlanda) și am mutat calculul soldului într-o funcție din baza de date. Toate reduc
          <B> numărul de drumuri</B> către DB și <B>distanța</B> fiecărui drum — cele două cauze
          reale ale lentorii.
        </P>
      </Ch>

      <Ch id="stil" n="9" title="Stilizarea (Tailwind, tokeni, temă)">
        <P>
          Nu folosim culori „bătute în cuie” prin componente. Definim <B>tokeni semantici</B> o
          singură dată în <Mono>app/globals.css</Mono>:
        </P>
        <Code>{`--primary:   #7c3aed;   (culoarea principala, indigo)
--income:    #16a34a;   (verde, venituri)
--expense:   #dc2626;   (rosu, cheltuieli)
--surface / --border / --muted ...`}</Code>
        <P>
          Apoi în componente scrii <Mono>bg-primary</Mono>, <Mono>text-income</Mono>. Marele avantaj:
          ca să reskinuiești toată aplicația (cum am făcut din teal în indigo), <B>schimbi valorile
          într-un singur loc</B> și tot UI-ul se schimbă. Modul întunecat funcționează la fel: aceeași
          clasă, altă valoare a tokenului când e activ <Mono>.dark</Mono>.
        </P>
        <Note>
          Lecția transferabilă: <B>nu repeta valori</B>. Definește-le o dată (culori, spații) și
          referă-le peste tot. Când vrei o schimbare, o faci într-un singur punct.
        </Note>
      </Ch>

      <Ch id="pwa" n="10" title="PWA (aplicația pe telefon)">
        <P>Trei fișiere transformă site-ul în „aplicație instalabilă”:</P>
        <Ul>
          <Li>
            <Mono>app/manifest.ts</Mono> — cartea de identitate: nume, iconițe, culoare, „pornește
            pe tot ecranul”.
          </Li>
          <Li>
            <Mono>public/sw.js</Mono> — un „service worker”: un mic program care rulează în fundal și
            oferă o pagină de offline când nu ai net.
          </Li>
          <Li>
            <Mono>components/ServiceWorkerRegister.tsx</Mono> — îl pornește la încărcare.
          </Li>
        </Ul>
        <P>
          Ca browserul să ofere instalarea, manifestul <B>trebuie</B> să fie accesibil fără login —
          de-aia l-am scos din verificarea middleware-ului. Un detaliu mic cu efect mare.
        </P>
      </Ch>

      <Ch id="migrari" n="11" title="Migrări și tipuri">
        <P>
          Nu modifici baza de date „cu mâna” din interfață. Scrii fișiere <B>de migrare</B> (SQL) în{" "}
          <Mono>supabase/migrations/</Mono>. Fiecare descrie o schimbare (un tabel nou, o regulă
          nouă). Avantajul: schema e în cod, versionată în Git, reproductibilă oriunde.
        </P>
        <P>
          Exemplu concret: funcția de agregare a soldului pe care am adăugat-o e o migrare
          (<Mono>…_monthly_summary_rpc.sql</Mono>). După ce o scrii, o „aplici” pe baza de date, iar
          în <Mono>types/database.ts</Mono> ai tipurile ei — ca TypeScript să știe ce întoarce.
        </P>
      </Ch>

      <Ch id="securitate" n="12" title="Securitate, pe scurt">
        <Ul>
          <Li><B>RLS</B> — fiecare gospodărie izolată la nivel de bază de date.</Li>
          <Li><B>Validare pe server</B> (Zod) — nu ai încredere în ce vine din browser.</Li>
          <Li><B>Middleware</B> — protejează rutele private, validează sesiunea.</Li>
          <Li>
            <B>Secrete pe server</B> — cheile bazei de date stau în variabile de mediu, niciodată în
            codul din browser.
          </Li>
          <Li><B>Doar HTTPS</B> + antete de securitate + înregistrare doar cu cod de invitație.</Li>
        </Ul>
      </Ch>

      <Ch id="reteta" n="13" title="Rețeta pentru un proiect nou">
        <P>
          Dacă ar fi să pornești mâine o aplicație nouă, cu ce ai învățat aici, ordinea sănătoasă e:
        </P>
        <Code>{`1. Alege scheletul: Next.js + TypeScript + Tailwind.
2. Alege datele: Supabase (Postgres + auth + RLS).
3. Deseneaza tabelele si scrie-le ca MIGRARI.
4. Porneste RLS din prima zi (nu "mai tarziu").
5. Defineste tokenii de culoare/stil o singura data.
6. Fa middleware-ul de protectie a rutelor.
7. Pentru fiecare functie (ex. "tranzactii"):
     - schemas/    (regulile Zod)
     - data/       (citirile)
     - actions/    (scrierile + revalidatePath)
     - components/ (formular client + lista)
     - page.tsx    (server: aduce datele, le paseaza)
8. Adauga loading.tsx pentru senzatia de viteza.
9. La final: PWA, teste, deploy pe Vercel.`}</Code>
        <P>
          Dacă respecți separarea <B>schemas → data → actions → components → page</B>, orice funcție
          nouă intră natural la locul ei, iar aplicația rămâne ușor de întreținut chiar când crește.
        </P>
        <Note>
          Cel mai valoros lucru de reținut: <B>tipare, nu magie</B>. Aceleași straturi se repetă la
          fiecare funcționalitate. Odată ce le vezi o dată, le recunoști peste tot.
        </Note>
      </Ch>

      <Ch id="glosar" n="14" title="Glosar">
        <Ul>
          <Li><B>Framework</B> — set de unelte + reguli care îți dau scheletul aplicației (Next.js).</Li>
          <Li><B>Componentă</B> — o bucată reutilizabilă de interfață (un buton, o listă).</Li>
          <Li><B>Props</B> — datele pe care o componentă le primește de la „părintele” ei.</Li>
          <Li><B>Stare (state)</B> — informație care se schimbă în timp în browser (ce tab e activ).</Li>
          <Li><B>Server Action</B> — funcție pe server chemabilă direct din formular.</Li>
          <Li><B>Middleware</B> — cod care rulează la fiecare cerere, înainte de pagină.</Li>
          <Li><B>RLS</B> — reguli de acces la date, în baza de date.</Li>
          <Li><B>Migrare</B> — un fișier care descrie o schimbare a bazei de date.</Li>
          <Li><B>Token / cookie</B> — „legitimația” care spune serverului cine ești.</Li>
          <Li><B>Deploy</B> — a publica aplicația ca s-o poată folosi lumea (pe Vercel).</Li>
        </Ul>
      </Ch>

      <p className="text-center text-xs text-muted">
        Acest curs e vizibil doar în panoul de admin. Îl poți extinde oricând cu noi capitole.
      </p>
    </div>
  );
}

function Ch({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details id={id} className="scroll-mt-4 rounded-2xl border border-border bg-surface p-4">
      <summary className="cursor-pointer font-semibold">
        <span className="text-muted">{n}.</span> {title}
      </summary>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed">{children}</div>
    </details>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted">{children}</p>;
}
function B({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-foreground">{children}</span>;
}
function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-foreground/10 px-1 py-0.5 text-[0.85em] text-foreground">
      {children}
    </code>
  );
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="flex list-disc flex-col gap-1.5 pl-5 text-muted">{children}</ul>;
}
function Li({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}
function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-foreground/5 p-3 text-xs leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  );
}
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="tint-primary rounded-xl border p-3 text-sm">
      <span className="font-semibold">💡 </span>
      {children}
    </div>
  );
}
