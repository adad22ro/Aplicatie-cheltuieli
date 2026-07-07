/** Ecran de încărcare (skeleton) afișat cât se aduc datele de pe server.
 *  Plăci gri animate — aplicația pare mai rapidă, fără pagină goală. */
export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Se încarcă"
      className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Bar className="h-3 w-20" />
          <Bar className="h-6 w-40" />
        </div>
        <Bar className="h-9 w-16 rounded-xl" />
      </div>

      {/* Bară (ex. selector lună) */}
      <Bar className="h-12 w-full rounded-xl" />

      {/* Două carduri sumar */}
      <div className="grid grid-cols-2 gap-3">
        <Card />
        <Card />
      </div>

      {/* Card lat */}
      <Bar className="h-20 w-full rounded-2xl" />

      {/* Listă */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
          >
            <Bar className="h-9 w-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Bar className="h-3.5 w-24" />
              <Bar className="h-3 w-16" />
            </div>
            <Bar className="h-4 w-16" />
          </div>
        ))}
      </div>
    </main>
  );
}

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-border/70 ${className}`} />;
}

function Card() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
      <Bar className="h-3 w-16" />
      <Bar className="h-6 w-24" />
    </div>
  );
}
