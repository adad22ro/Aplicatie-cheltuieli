"use client";

import { useActionState, useEffect, useState } from "react";

import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  type SettingsActionState,
} from "@/lib/actions/categories";
import { CATEGORY_COLORS } from "@/lib/schemas/settings";
import type { Category } from "@/lib/data/settings";
import { EmojiPicker } from "@/components/settings/EmojiPicker";

const TYPE_LABEL: Record<Category["type"], string> = {
  income: "Venit",
  expense: "Cheltuială",
};

/** Formular de creare/editare a unei categorii. */
function CategoryForm({
  mode,
  initial,
  onDone,
}: {
  mode: "create" | "edit";
  initial?: Category;
  onDone?: () => void;
}) {
  const action = mode === "create" ? createCategoryAction : updateCategoryAction;
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    action,
    undefined,
  );
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [color, setColor] = useState(initial?.color ?? "");

  // La succes anunțăm părintele: la editare închide formularul, la creare
  // părintele remontează formularul (via `key`) ca să-l reseteze complet.
  useEffect(() => {
    if (state && "ok" in state && state.ok) onDone?.();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="color" value={color} />

      <div className="flex gap-2">
        <EmojiPicker value={icon} onChange={setIcon} />
        <input
          name="name"
          type="text"
          required
          maxLength={40}
          defaultValue={initial?.name ?? ""}
          placeholder="Nume categorie"
          aria-label="Nume categorie"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      <select
        name="type"
        defaultValue={initial?.type ?? "expense"}
        aria-label="Tip categorie"
        className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <option value="expense">Cheltuială</option>
        <option value="income">Venit</option>
      </select>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Culoare</span>
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector rotund custom — orice culoare */}
          <label
            title="Alege orice culoare"
            className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full border border-border"
            style={{
              background: color
                ? undefined
                : "conic-gradient(#ff6b4a,#f59e0b,#22c55e,#14b8a6,#3b82f6,#a855f7,#ec4899,#ff6b4a)",
              backgroundColor: color || undefined,
            }}
          >
            <input
              type="color"
              value={color || "#7c3aed"}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Culoare personalizată"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>

          {/* „Fără culoare" */}
          <button
            type="button"
            onClick={() => setColor("")}
            title="Fără culoare"
            aria-pressed={!color}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-border text-xs text-muted ${
              !color ? "ring-2 ring-primary ring-offset-1 ring-offset-surface" : ""
            }`}
          >
            ∅
          </button>

          {/* Presetări rapide */}
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              title={c}
              aria-pressed={color.toLowerCase() === c.toLowerCase()}
              style={{ backgroundColor: c }}
              className={`h-9 w-9 rounded-full ${
                color.toLowerCase() === c.toLowerCase()
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-surface"
                  : ""
              }`}
            />
          ))}
        </div>
      </div>

      {state && "error" in state ? (
        <p role="alert" className="text-sm text-expense">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Se salvează…" : mode === "create" ? "Adaugă categoria" : "Salvează"}
        </button>
        {mode === "edit" ? (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-background"
          >
            Anulează
          </button>
        ) : null}
      </div>
    </form>
  );
}

/** Un rând din listă cu acțiuni de editare/ștergere. */
function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-xl border border-border bg-surface p-3">
        <CategoryForm mode="edit" initial={category} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
        style={{ backgroundColor: category.color ?? "var(--color-background)" }}
        aria-hidden
      >
        {category.icon ?? "•"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{category.name}</p>
        <p className="text-xs text-muted">{TYPE_LABEL[category.type]}</p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
      >
        Editează
      </button>
      <form action={deleteCategoryAction}>
        <input type="hidden" name="id" value={category.id} />
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-expense hover:bg-background"
        >
          Șterge
        </button>
      </form>
    </li>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  // La fiecare creare reușită bumpăm cheia → formularul se remontează curat.
  const [createKey, setCreateKey] = useState(0);
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-muted">Categorie nouă</h2>
        <CategoryForm
          key={createKey}
          mode="create"
          onDone={() => setCreateKey((k) => k + 1)}
        />
      </section>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
          Nicio categorie încă. Adaugă prima mai sus.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </ul>
      )}
    </div>
  );
}
