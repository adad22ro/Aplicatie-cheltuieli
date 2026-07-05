import Link from "next/link";

export const metadata = {
  title: "Ghid de utilizare",
};

/** Manual de utilizare complet — explică fiecare funcție a aplicației. Conținut static. */
export default function HelpPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          ← Înapoi
        </Link>
        <h1 className="text-2xl font-bold">Ghid de utilizare</h1>
      </header>

      <p className="text-sm text-muted">
        Tot ce știe aplicația să facă, pe scurt și pe înțelesul tuturor. Apasă pe o secțiune ca s-o
        deschizi.
      </p>

      {/* Cuprins */}
      <nav className="rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="mb-2 font-semibold">Cuprins</p>
        <ul className="flex flex-col gap-1">
          {[
            ["#concepte", "Concepte de bază"],
            ["#dashboard", "Pagina principală (dashboard)"],
            ["#tranzactii", "Tranzacții"],
            ["#plan", "Plan lunar"],
            ["#recurente", "Recurențe"],
            ["#rate", "Rate / angajamente"],
            ["#bugete", "Bugete"],
            ["#economii", "Obiective de economisire"],
            ["#grafice", "Grafice"],
            ["#setari", "Setări"],
            ["#gospodarie", "Gospodărie & invitații"],
            ["#instalare", "Instalare pe telefon (PWA)"],
            ["#securitate", "Securitate & confidențialitate"],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="text-primary hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="concepte" title="Concepte de bază">
        <P>
          Aplicația ține evidența banilor unei <B>gospodării</B> (una sau mai multe persoane care
          împart aceleași finanțe). Tot ce adaugi — venituri, cheltuieli, planuri — aparține
          gospodăriei, iar membrii ei văd aceleași date.
        </P>
        <Ul>
          <Li><B>Venit</B> = bani care intră (salariu, bonus, cadou).</Li>
          <Li><B>Cheltuială</B> = bani care ies.</Li>
          <Li>
            <B>Sold</B> = câți bani ai la un moment dat. Se reportează („carry-over"): soldul unei
            luni pornește de la ce a rămas din lunile anterioare.
          </Li>
          <Li><B>Categorie</B> = eticheta unei tranzacții (Mâncare, Chirie, Salariu…).</Li>
          <Li><B>Metodă de plată</B> = numerar, card etc.</Li>
        </Ul>
      </Section>

      <Section id="dashboard" title="Pagina principală (dashboard)">
        <P>Prima pagină îți arată situația lunii curente. De sus în jos:</P>
        <Ul>
          <Li><B>Selector de lună</B> — săgețile ← → te mută între luni.</Li>
          <Li>
            <B>Lunar / Săptămânal</B> — comută modul de afișare. „Săptămânal" sparge luna în
            blocuri de 7 zile, fiecare cu venituri/cheltuieli/sold și top categorii.
          </Li>
          <Li>
            <B>Carduri sumar</B> — Venituri, Cheltuieli și Sold la finalul lunii (cu reportul din
            lunile anterioare + fluxul lunii).
          </Li>
          <Li>
            <B>Digest</B> — pe scurt: cât ți-a intrat luna asta, cât mai ai de plătit din recurențe
            și rate până la finalul lunii și soldul curent.
          </Li>
          <Li><B>Plan lunar</B>, <B>Recurențe</B>, <B>Rate</B>, <B>Bugete</B>, <B>Grafice</B>, <B>Obiective</B> — scurtături.</Li>
          <Li><B>+ Adaugă</B> — butonul rotund care deschide formularul rapid de tranzacție.</Li>
        </Ul>
      </Section>

      <Section id="tranzactii" title="Tranzacții">
        <P>Inima aplicației. Din <B>/transactions</B> vezi lista grupată pe zile, cu sume colorate
          (verde venit, roșu cheltuială) și autorul fiecăreia.</P>
        <Ul>
          <Li>
            <B>Adăugare rapidă</B> — apeși „+ Adaugă": cursorul e direct pe sumă, cu tastatură
            numerică; comuți venit/cheltuială (filtrează categoriile), data e azi implicit.
          </Li>
          <Li>
            <B>„La fel ca data trecută"</B> — chips cu combinațiile tale recente (categorie + sumă)
            care precompletează formularul dintr-o atingere.
          </Li>
          <Li><B>Editare</B> — atingi o tranzacție pentru a-i schimba suma, categoria, data, nota.</Li>
          <Li><B>Ștergere cu Undo</B> — ștergerea e reversibilă imediat (buton „Anulează").</Li>
          <Li><B>Duplică</B> — creezi rapid o copie a unei tranzacții.</Li>
          <Li>
            <B>Filtre & căutare</B> — pe lună, tip, categorie, metodă; plus căutare liberă după notă
            sau sumă.
          </Li>
        </Ul>
      </Section>

      <Section id="plan" title="Plan lunar">
        <P>
          La <B>/plan</B> îți <B>planifici</B> luna: împarți banii disponibili pe cheltuieli, înainte
          să-i cheltui. Alege luna din selector (poți planifica și luna viitoare).
        </P>
        <Ul>
          <Li>
            <B>Venituri</B> — adaugi sursele de venit ale lunii. Dacă bifezi „recurent", devine și o
            recurență (gestionabilă din Recurențe).
          </Li>
          <Li>
            <B>Cheltuieli planificate (alocări)</B> — cât aloci fiecărei categorii. Bara de sus arată
            Venit → Alocat → Nealocat, cu alerte (deficit / „tot venitul e alocat").
          </Li>
          <Li>
            <B>„Plătit"</B> — când chiar plătești ceva, bifezi alocarea: abia atunci devine o
            cheltuială reală. Debifezi și dispare. Așa planul nu se amestecă cu realitatea până nu
            confirmi.
          </Li>
          <Li><B>Prioritizare</B> — muți alocările cu ↑/↓ (ce plătești întâi).</Li>
          <Li>
            <B>Report (rollover)</B> — ce a rămas din luna trecută se adaugă la „disponibil" luna
            asta.
          </Li>
          <Li>
            <B>Două venituri / persoană</B> — fiecare venit poate fi atribuit unei persoane;
            aplicația arată cine cât a adus.
          </Li>
          <Li>
            <B>Șabloane</B> — la <B>/plan/templates</B> salvezi un tipar de alocări (sume fixe sau
            procent din disponibil) și-l aplici într-o atingere pe orice lună.
          </Li>
          <Li>
            <B>Pe săptămâni</B> — comuți „Listă / Săptămâni": fiecare alocare primește o săptămână
            (S1…S5 sau „oricând"), iar planul se împarte pe săptămâni cu buget disponibil pe fiecare
            și alertă de depășire.
          </Li>
          <Li>
            <B>Alocare către economii</B> — o alocare poate ținti un obiectiv de economisire; când o
            bifezi „plătit", crește obiectivul (fără să creeze o cheltuială).
          </Li>
        </Ul>
      </Section>

      <Section id="recurente" title="Recurențe">
        <P>
          La <B>/recurring</B> definești cheltuieli care se repetă lunar (abonamente, chirie),
          cu ziua din lună. Aplicația le generează automat („lazy", la deschiderea dashboard-ului),
          fără să le dubleze. Poți opri/reactiva fiecare recurență.
        </P>
        <P>
          Veniturile recurente servesc doar la precompletarea planului — nu creează automat
          tranzacții (ca să nu se dubleze cu venitul real pe care-l adaugi când chiar intră banii).
        </P>
      </Section>

      <Section id="rate" title="Rate / angajamente">
        <P>
          La <B>/installments</B> introduci o cumpărare în rate (sumă totală + număr de rate → rata
          se calculează). Vezi progresul, cât ai plătit și restul. Ratele scadente se generează
          automat; la ultima rată planul se închide singur.
        </P>
      </Section>

      <Section id="bugete" title="Bugete">
        <P>
          La <B>/budgets</B> pui o limită lunară pe o categorie. Vezi progresul (cât ai cheltuit din
          limită) și primești alertă la depășire. Comparația buget vs. real e și în Grafice.
        </P>
      </Section>

      <Section id="economii" title="Obiective de economisire">
        <P>
          La <B>/savings</B> creezi obiective (ex: „Vacanță 5000 lei"). Adaugi sau retragi
          contribuții, vezi progresul în procente și când l-ai atins. Poți alimenta un obiectiv și
          direct din planul lunar.
        </P>
      </Section>

      <Section id="grafice" title="Grafice">
        <P>La <B>/reports</B>, cu selector de lună, ai o imagine completă:</P>
        <Ul>
          <Li><B>Proiecție final de lună</B> — în ritmul actual, cât vei cheltui până la sfârșit.</Li>
          <Li><B>Cheltuieli pe categorie</B> — donut cu procente.</Li>
          <Li><B>Cumulativ vs luna trecută</B> — ești peste sau sub ritmul de luna trecută.</Li>
          <Li><B>Venituri vs cheltuieli</B> — evoluție pe 6 luni.</Li>
          <Li><B>Sold cumulat</B> — traiectoria averii pe 6 luni.</Li>
          <Li><B>Rată de economisire</B> — cât % din venit rămâne, lună de lună.</Li>
          <Li><B>Fixe vs variabile</B> — cât e „fix" (recurențe + rate) vs discreționar.</Li>
          <Li><B>Buget planificat vs real</B>, <B>cheltuieli pe zi</B>, <B>pe zile ale săptămânii</B>.</Li>
          <Li><B>Top cheltuieli</B> ale lunii și <B>progres economii</B>.</Li>
        </Ul>
      </Section>

      <Section id="setari" title="Setări">
        <P>La <B>/settings</B> personalizezi aplicația:</P>
        <Ul>
          <Li><B>Categorii</B> — venit/cheltuială, cu emoji și culoare din paletă.</Li>
          <Li><B>Metode de plată</B> — numerar, card etc.</Li>
          <Li><B>Profil</B> — numele tău afișat (apare ca autor pe tranzacții).</Li>
        </Ul>
      </Section>

      <Section id="gospodarie" title="Gospodărie & invitații">
        <P>
          La <B>/settings/household</B> (dacă ești owner) vezi membrii și poți genera un cod/link de
          invitație (cu expirare). Cine îl folosește se alătură automat gospodăriei. Datele sunt
          strict izolate: o gospodărie nu vede niciodată datele alteia.
        </P>
      </Section>

      <Section id="instalare" title="Instalare pe telefon (PWA)">
        <P>
          Aplicația se instalează ca o aplicație nativă: din meniul browserului alegi „Adaugă pe
          ecranul principal" (Add to Home Screen). Primești iconiță proprie și funcționează și cu
          semnal slab.
        </P>
      </Section>

      <Section id="securitate" title="Securitate & confidențialitate">
        <Ul>
          <Li>Conturile se creează doar cu un <B>cod de invitație</B> — nu există înregistrare publică.</Li>
          <Li>Datele fiecărei gospodării sunt izolate la nivel de bază de date (RLS).</Li>
          <Li>
            Parolele conturilor noi cer minim 8 caractere, cu literă și cifră. La prea multe
            încercări greșite de login, contul e limitat temporar.
          </Li>
          <Li>Conexiunea e doar prin HTTPS, cu antete de securitate (anti-clickjacking, CSP).</Li>
        </Ul>
      </Section>

      <p className="text-center text-xs text-muted">
        Ai o întrebare la care ghidul nu răspunde? Spune-i administratorului gospodăriei.
      </p>
    </main>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <details id={id} className="scroll-mt-4 rounded-2xl border border-border bg-surface p-4">
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed">{children}</div>
    </details>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted">{children}</p>;
}
function B({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-foreground">{children}</span>;
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="flex list-disc flex-col gap-1.5 pl-5 text-muted">{children}</ul>;
}
function Li({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}
