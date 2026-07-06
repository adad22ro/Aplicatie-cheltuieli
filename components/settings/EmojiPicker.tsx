"use client";

import { useMemo, useRef, useState } from "react";

/** Bibliotecă de emoji grupată, cu cuvinte-cheie pentru căutare (în română). */
const GROUPS: { title: string; items: { e: string; k: string }[] }[] = [
  {
    title: "Bani & finanțe",
    items: [
      { e: "💰", k: "bani salariu venit sac" },
      { e: "💵", k: "bani cash numerar dolari" },
      { e: "💳", k: "card rate plata" },
      { e: "🏦", k: "banca cont" },
      { e: "🪙", k: "moneda bani" },
      { e: "💸", k: "cheltuiala bani zbor" },
      { e: "🐷", k: "pusculita economii obiective" },
      { e: "📈", k: "grafic crestere investitii" },
      { e: "📉", k: "grafic scadere" },
      { e: "🧾", k: "factura bon chitanta" },
      { e: "💼", k: "servici job munca geanta" },
      { e: "🤑", k: "bani bogat" },
    ],
  },
  {
    title: "Mâncare & băutură",
    items: [
      { e: "🍔", k: "mancare burger fast food" },
      { e: "🍕", k: "pizza mancare" },
      { e: "🍜", k: "supa mancare noodles" },
      { e: "🥗", k: "salata mancare sanatos" },
      { e: "🍎", k: "mar fruct" },
      { e: "🍞", k: "paine" },
      { e: "🥩", k: "carne" },
      { e: "🛒", k: "cumparaturi mancare alimente" },
      { e: "☕", k: "cafea coffee" },
      { e: "🍺", k: "bere alcool" },
      { e: "🍷", k: "vin alcool" },
      { e: "🥤", k: "suc bautura" },
      { e: "🍰", k: "tort desert prajitura" },
      { e: "🍫", k: "ciocolata dulciuri" },
    ],
  },
  {
    title: "Casă & facturi",
    items: [
      { e: "🏠", k: "casa locuinta chirie" },
      { e: "💡", k: "curent electricitate factura lumina" },
      { e: "🔥", k: "gaz caldura factura" },
      { e: "💧", k: "apa factura" },
      { e: "🌐", k: "internet net factura" },
      { e: "📱", k: "telefon abonament factura" },
      { e: "📺", k: "tv cablu abonament" },
      { e: "🧹", k: "curatenie menaj" },
      { e: "🛋️", k: "mobila casa" },
      { e: "🧺", k: "spalatorie rufe" },
      { e: "🔧", k: "reparatii intretinere" },
      { e: "🪴", k: "planta casa" },
    ],
  },
  {
    title: "Transport",
    items: [
      { e: "🚗", k: "masina auto transport" },
      { e: "⛽", k: "benzina combustibil carburant" },
      { e: "🚕", k: "taxi" },
      { e: "🚌", k: "autobuz transport public" },
      { e: "🚇", k: "metrou transport" },
      { e: "🚆", k: "tren transport" },
      { e: "✈️", k: "avion zbor calatorie" },
      { e: "🚲", k: "bicicleta" },
      { e: "🛴", k: "trotineta" },
      { e: "🅿️", k: "parcare" },
      { e: "🛣️", k: "drum autostrada taxa" },
      { e: "🚙", k: "suv masina" },
    ],
  },
  {
    title: "Cumpărături & haine",
    items: [
      { e: "🛍️", k: "cumparaturi shopping" },
      { e: "👕", k: "tricou haine imbracaminte" },
      { e: "👖", k: "blugi pantaloni haine" },
      { e: "👗", k: "rochie haine" },
      { e: "👟", k: "adidasi pantofi incaltaminte" },
      { e: "👜", k: "geanta accesorii" },
      { e: "💄", k: "cosmetice machiaj" },
      { e: "💍", k: "bijuterii inel" },
      { e: "🎁", k: "cadou" },
      { e: "🕶️", k: "ochelari accesorii" },
    ],
  },
  {
    title: "Sănătate",
    items: [
      { e: "💊", k: "medicamente pastile sanatate" },
      { e: "🏥", k: "spital sanatate" },
      { e: "💉", k: "vaccin injectie sanatate" },
      { e: "🩺", k: "doctor medic consult" },
      { e: "🦷", k: "dentist dinti" },
      { e: "👓", k: "ochelari vedere" },
      { e: "🧠", k: "psiholog terapie" },
      { e: "💪", k: "sala fitness sport" },
      { e: "🧘", k: "yoga relaxare" },
      { e: "🏃", k: "alergare sport" },
    ],
  },
  {
    title: "Distracție & diverse",
    items: [
      { e: "🎉", k: "petrecere distractie" },
      { e: "🎬", k: "film cinema" },
      { e: "🎮", k: "jocuri gaming" },
      { e: "🎵", k: "muzica abonament" },
      { e: "📚", k: "carti educatie" },
      { e: "🎓", k: "scoala educatie taxa" },
      { e: "✂️", k: "frizer coafor tuns" },
      { e: "🐶", k: "animal caine pet" },
      { e: "🐱", k: "animal pisica pet" },
      { e: "🎨", k: "hobby arta" },
      { e: "✈️", k: "vacanta calatorie" },
      { e: "🏖️", k: "vacanta plaja concediu" },
      { e: "🎯", k: "buget tinta obiectiv" },
      { e: "🔁", k: "recurent abonament" },
      { e: "⭐", k: "favorit important" },
      { e: "❓", k: "altele necunoscut" },
    ],
  },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\u0300-\u036f]", "g"), "");

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({
      title: g.title,
      items: g.items.filter((it) => norm(it.k).includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const pick = (e: string) => {
    onChange(e);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Alege icon"
        aria-expanded={open}
        className="flex h-11 w-14 items-center justify-center rounded-lg border border-border bg-surface text-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {value || "🙂"}
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-72 w-72 overflow-y-auto rounded-2xl border border-border bg-surface p-3 shadow-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută (ex: mâncare, benzină)…"
            aria-label="Caută icon"
            autoFocus
            className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {filtered.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-muted">Niciun rezultat.</p>
          ) : (
            filtered.map((g) => (
              <div key={g.title} className="mb-2">
                <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {g.title}
                </p>
                <div className="grid grid-cols-7 gap-1">
                  {g.items.map((it, i) => (
                    <button
                      key={`${it.e}-${i}`}
                      type="button"
                      onClick={() => pick(it.e)}
                      className={`grid h-9 place-items-center rounded-lg text-xl transition-colors hover:bg-background ${
                        value === it.e ? "bg-primary/10 ring-1 ring-primary" : ""
                      }`}
                    >
                      {it.e}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
