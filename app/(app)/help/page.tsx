import Link from "next/link";

export const metadata = {
  title: "Ghid de utilizare",
};

/** Manual de utilizare prietenos, pe înțelesul oricui. Conținut static. */
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
        <h1 className="text-2xl font-bold">Ghid</h1>
      </header>

      <p className="text-muted">
        Bine ai venit! Aici ții socoteala banilor din casă — cât intră, cât iese și cât îți
        rămâne — fără foi de calcul complicate. Mai jos îți explicăm pe scurt tot ce poți face.
        Apasă pe o secțiune ca s-o deschizi.
      </p>

      {/* Start rapid */}
      <div className="tint-primary flex flex-col gap-2 rounded-2xl border p-4">
        <p className="font-semibold">🚀 Cel mai important lucru</p>
        <p className="text-sm text-muted">
          Ca să notezi o cheltuială sau un venit, apasă butonul mare{" "}
          <span className="font-semibold text-foreground">➕</span> din mijlocul barei de jos.
          Scrii suma, alegi ce este (de ex. Mâncare) și gata. Restul aplicației te ajută doar
          să vezi mai clar unde-ți pleacă banii.
        </p>
      </div>

      {/* Cuprins */}
      <nav className="rounded-2xl border border-border bg-surface p-4 text-sm">
        <p className="mb-2 font-semibold">Ce găsești mai jos</p>
        <ul className="flex flex-col gap-1">
          {[
            ["#baza", "💡 Câteva cuvinte simple"],
            ["#acasa", "🏠 Pagina de start"],
            ["#adaug", "➕ Cum notez un venit sau o cheltuială"],
            ["#plan", "🗓️ Îmi fac un plan pentru lună"],
            ["#recurente", "🔁 Plăți care se repetă lună de lună"],
            ["#rate", "💳 Cumpărături în rate"],
            ["#bugete", "🎯 Limite pe categorii (bugete)"],
            ["#datorii", "🤝 Bani împrumutați (datorii)"],
            ["#completat", "📝 „De completat” — facturi cu sumă variabilă"],
            ["#economii", "🐷 Pun bani deoparte"],
            ["#grafice", "📊 Văd totul în grafice"],
            ["#setari", "⚙️ Personalizez aplicația"],
            ["#familie", "👨‍👩‍👧 Familia mea în aplicație"],
            ["#telefon", "📲 Pun aplicația pe telefon"],
            ["#siguranta", "🔒 Sunt banii mei în siguranță?"],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="text-primary hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="baza" title="💡 Câteva cuvinte simple">
        <P>Ca să ne înțelegem ușor, iată ce înseamnă câțiva termeni pe care îi vei vedea:</P>
        <Ul>
          <Li><B>Venit</B> — bani care intră: salariu, un bonus, un cadou.</Li>
          <Li><B>Cheltuială</B> — bani care ies: cumpărături, facturi, o cafea.</Li>
          <Li>
            <B>Sold</B> — câți bani ai la un moment dat. Ce-ți rămâne la sfârșitul unei luni
            trece automat în luna următoare, ca într-un portofel.
          </Li>
          <Li><B>Categorie</B> — eticheta unei cheltuieli: Mâncare, Chirie, Transport…</Li>
          <Li>
            <B>Gospodărie</B> — voi, cei care împărțiți aceiași bani (o familie, o casă). Toți
            vedeți aceleași cheltuieli.
          </Li>
        </Ul>
      </Section>

      <Section id="acasa" title="🏠 Pagina de start">
        <P>
          Când deschizi aplicația, prima pagină îți arată cum stai luna aceasta, dintr-o privire:
        </P>
        <Ul>
          <Li>
            <B>Săgețile de lună</B> (← →) te plimbă între luni, ca să vezi și trecutul.
          </Li>
          <Li>
            <B>Venituri și Cheltuieli</B> — două căsuțe colorate: verde pentru banii care au
            intrat, roșu pentru cei care au ieșit.
          </Li>
          <Li>
            <B>Soldul lunii</B> — cât îți rămâne la sfârșit, ținând cont și de ce a mai rămas din
            lunile trecute.
          </Li>
          <Li>
            <B>Pe scurt</B> — o frază care-ți spune cât ți-a intrat și cât mai ai de plătit până
            la finalul lunii.
          </Li>
          <Li>
            <B>Scurtăturile colorate</B> (Plan, Recurențe, Rate, Grafice, Obiective, Datorii) te
            duc la fiecare parte a aplicației.
          </Li>
          <Li>
            <B>De completat</B> — dacă ai facturi sau rate cu sumă variabilă (vezi mai jos), aici
            apar cele ajunse la scadență, ca să le treci suma reală.
          </Li>
        </Ul>
        <P>
          Jos ai mereu bara cu <B>Acasă</B>, <B>Tranzacții</B>, butonul <B>➕</B>, <B>Bugete</B> și{" "}
          <B>Setări</B> — de acolo ajungi rapid oriunde.
        </P>
      </Section>

      <Section id="adaug" title="➕ Cum notez un venit sau o cheltuială">
        <P>Cel mai des lucru pe care-l vei face. Durează câteva secunde:</P>
        <Ul>
          <Li>Apasă butonul <B>➕</B> din mijlocul barei de jos.</Li>
          <Li>Scrie <B>suma</B> (tastatura pornește direct pe cifre).</Li>
          <Li>Alege dacă e <B>cheltuială</B> sau <B>venit</B>.</Li>
          <Li>Atinge <B>categoria</B> potrivită (cerculețele colorate).</Li>
          <Li>Data e azi, dar o poți schimba. Poți adăuga și o notă („cadou mama”).</Li>
        </Ul>
        <P>Bune de știut:</P>
        <Ul>
          <Li>
            <B>Ai greșit?</B> Atingi tranzacția în listă și o modifici, sau o ștergi (apare
            imediat un buton „Anulează” dacă te răzgândești).
          </Li>
          <Li>
            <B>Se repetă des aceeași cheltuială?</B> Aplicația îți propune combinațiile tale
            recente ca s-o adaugi dintr-o atingere.
          </Li>
          <Li>
            În pagina <B>Tranzacții</B> vezi tot ce ai notat, grupat pe zile, și poți căuta sau
            filtra (după lună, categorie, persoană).
          </Li>
        </Ul>
      </Section>

      <Section id="plan" title="🗓️ Îmi fac un plan pentru lună">
        <P>
          Planul te ajută să <B>împarți banii dinainte</B>, ca să știi cât dai pe fiecare lucru
          înainte să-i cheltui — nu după.
        </P>
        <Ul>
          <Li>Treci <B>veniturile</B> pe care le aștepți luna asta.</Li>
          <Li>
            Împarți banii pe categorii: cât vrei să dai pe mâncare, cât pe facturi, cât pe
            distracție. Sus vezi cât ai împărțit și cât ți-a mai rămas nealocat.
          </Li>
          <Li>
            Când chiar plătești ceva, <B>bifezi</B> — abia atunci devine o cheltuială reală. Așa
            planul rămâne curat până confirmi tu.
          </Li>
          <Li>Poți muta lucrurile mai sus sau mai jos, după ce plătești întâi.</Li>
          <Li>
            Dacă-ți iese un plan bun, îl <B>salvezi ca șablon</B> și-l refolosești luna viitoare
            dintr-o atingere.
          </Li>
        </Ul>
      </Section>

      <Section id="recurente" title="🔁 Plăți care se repetă lună de lună">
        <P>
          Pentru lucruri fixe — chirie, abonamente, internet. Le treci o singură dată, spui în ce
          zi a lunii vin, iar aplicația ți le notează automat de fiecare dată, fără să le dublezi.
          Poți opri sau reporni oricare, oricând.
        </P>
        <P>
          <B>Sumă variabilă?</B> Unele facturi diferă de la o lună la alta (curent, gaz, apă). La
          acestea bifează <B>„Sumă variabilă”</B> când le creezi. Aplicația nu mai ghicește suma:
          la scadență îți apar la <B>„De completat”</B> pe pagina de start, unde treci suma reală a
          lunii. Suma pe care o pui la creare rămâne doar ca estimare.
        </P>
      </Section>

      <Section id="rate" title="💳 Cumpărături în rate">
        <P>
          Ai luat ceva în rate? Treci suma totală și în câte rate o plătești, iar aplicația
          calculează rata lunară. Vezi mereu cât ai plătit și cât mai ai. Când termini, se închide
          singură.
        </P>
        <P>
          <B>Rate care se schimbă?</B> La un credit cu dobândă variabilă, rata nu e mereu aceeași.
          Bifează <B>„Rată variabilă”</B>: fiecare rată îți apare la <B>„De completat”</B> la
          scadență și-i treci tu suma reală. Numărul total de rate rămâne cel stabilit, iar planul
          se închide când le-ai plătit pe toate.
        </P>
      </Section>

      <Section id="bugete" title="🎯 Limite pe categorii (bugete)">
        <P>
          Vrei să nu depășești un anumit ban pe mâncare sau distracție? Pui o limită lunară pe
          categoria aceea. O bară colorată îți arată cât ai consumat, se face galbenă când te
          apropii și roșie dacă ai depășit.
        </P>
      </Section>

      <Section id="datorii" title="🤝 Bani împrumutați (datorii)">
        <P>
          Aici ții socoteala banilor împrumutați — fie că ai luat tu de la cineva, fie că ai dat tu
          altcuiva. Deschizi secțiunea din scurtătura <B>Datorii</B> de pe pagina de start.
        </P>
        <Ul>
          <Li>
            Alegi sensul: <B>„Datorez eu”</B> (ai luat bani de la cineva) sau{" "}
            <B>„Mi se datorează”</B> (ai dat tu bani).
          </Li>
          <Li>Treci persoana, suma și, dacă vrei, data și o notă.</Li>
          <Li>
            Când dai sau primești bani înapoi, apeși <B>„+ Restituire”</B> și treci suma. Poți
            restitui de mai multe ori, în tranșe. Butonul <B>„Am înapoiat tot”</B> închide datoria
            dintr-o atingere.
          </Li>
          <Li>
            Sus vezi pe scurt <B>cât datorezi</B> și <B>cât ți se datorează</B>. Datoriile achitate
            trec în secțiunea „Închise”.
          </Li>
        </Ul>
        <P>
          <B>Important:</B> aceste mișcări intră în socoteala lunii. Când <B>primești</B> bani (fie
          împrumutul, fie o restituire către tine) apare ca <B>venit</B>; când <B>dai</B> bani apare
          ca <B>cheltuială</B>. Toate apar la categoria <B>„Datorii”</B> în tranzacții și grafice.
        </P>
      </Section>

      <Section id="completat" title="📝 „De completat” — facturi cu sumă variabilă">
        <P>
          Când ai recurențe sau rate cu <B>sumă variabilă</B> (facturi de curent/gaz, credit cu
          dobândă variabilă), aplicația nu inventează suma. La scadență, pe pagina de start apare o
          căsuță <B>„De completat”</B> cu lista lor.
        </P>
        <Ul>
          <Li>Fiecare rând îți arată ce e și când a ajuns scadent.</Li>
          <Li>
            Câmpul e precompletat cu estimarea ta — o schimbi cu <B>suma reală</B> a lunii și apeși{" "}
            <B>„Confirmă”</B>.
          </Li>
          <Li>Atât: devine o cheltuială reală și intră în soldul lunii, iar rândul dispare.</Li>
        </Ul>
      </Section>

      <Section id="economii" title="🐷 Pun bani deoparte">
        <P>
          Îți faci obiective („Vacanță — 5000 lei”, „Fond de urgență”) și pui bani în ele când
          poți. Vezi cât ai strâns și cât mai ai până la țintă. Poți alimenta un obiectiv și direct
          din planul lunar.
        </P>
      </Section>

      <Section id="grafice" title="📊 Văd totul în grafice">
        <P>
          Dacă îți plac imaginile mai mult decât cifrele, aici ai totul desenat: pe ce categorii
          dai cei mai mulți bani, cum stai față de luna trecută, cât reușești să economisești și
          încotro se îndreaptă banii tăi. E locul perfect pentru „unde mi s-au dus banii?”.
        </P>
      </Section>

      <Section id="setari" title="⚙️ Personalizez aplicația">
        <P>Faci aplicația să arate ca a ta:</P>
        <Ul>
          <Li>
            <B>Categorii</B> — creezi-le pe ale tale, cu emoji și culoare (apeși cerculețul de
            culoare și alegi ce vrei).
          </Li>
          <Li><B>Metode de plată</B> — numerar, card, Revolut… cum plătești tu.</Li>
          <Li><B>Profil</B> — numele tău, care apare lângă tranzacțiile pe care le adaugi.</Li>
          <Li>Tot din Setări te poți și <B>deconecta</B> din cont.</Li>
        </Ul>
      </Section>

      <Section id="familie" title="👨‍👩‍👧 Familia mea în aplicație">
        <P>
          Poți folosi aplicația împreună cu partenerul/familia. Persoana care a creat gospodăria
          poate invita pe alții printr-un cod sau link. Cine îl folosește intră în aceeași casă și
          vedeți împreună aceleași cheltuieli — util când amândoi cumpărați lucruri pentru casă.
        </P>
      </Section>

      <Section id="telefon" title="📲 Pun aplicația pe telefon">
        <P>
          Poți adăuga aplicația pe ecranul telefonului, ca să se deschidă cu o iconiță proprie, ca
          orice altă aplicație. Pe pagina de start apare un buton care te ajută să faci asta;
          pe iPhone folosești butonul de „Share” din Safari → „Adaugă la ecranul principal”.
        </P>
      </Section>

      <Section id="siguranta" title="🔒 Sunt banii mei în siguranță?">
        <Ul>
          <Li>
            Datele gospodăriei tale sunt <B>private</B> — nicio altă familie nu le poate vedea,
            niciodată.
          </Li>
          <Li>Nu se poate intra fără cont, iar conturile se fac doar pe bază de invitație.</Li>
          <Li>
            Aplicația îți cere o parolă sigură și blochează temporar contul dacă cineva încearcă
            să ghicească parola de prea multe ori.
          </Li>
          <Li>Legătura cu aplicația e mereu criptată.</Li>
        </Ul>
      </Section>

      <p className="text-center text-xs text-muted">
        Ai o întrebare la care ghidul nu răspunde? Întreabă persoana care se ocupă de gospodărie.
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
