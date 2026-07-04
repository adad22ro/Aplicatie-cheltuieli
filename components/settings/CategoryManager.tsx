"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  type SettingsActionState,
} from "@/lib/actions/categories";
import { CATEGORY_COLORS } from "@/lib/schemas/settings";
import type { Category } from "@/lib/data/settings";

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
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      if (mode === "create") formRef.current?.reset();
      onDone?.();
    }
  }, [state, mode, onDone]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      {mode === "edit" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <div className="flex gap-2">
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
        <input
          name="icon"
          type="text"
          maxLength={4}
          defaultValue={initial?.icon ?? ""}
          placeholder="🛒"
          aria-label="Icon (emoji, opțional)"
          className="w-14 rounded-lg border border-border bg-surface px-2 py-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">Culoare</legend>
        <label title="Fără culoare" className="cursor-pointer">
          <input
            type="radio"
            name="color"
            value=""
            defaultChecked={!initial?.color}
            className="peer sr-only"
          />
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-muted peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-1 peer-checked:ring-offset-surface">
            ∅
          </span>
        </label>
        {CATEGORY_COLORS.map((c) => (
          <label key={c} title={c} className="cursor-pointer">
            <input
              type="radio"
              name="color"
              value={c}
              defaultChecked={initial?.color === c}
              className="peer sr-only"
            />
            <span
              style={{ backgroundColor: c }}
              className="block h-6 w-6 rounded-full peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-1 peer-checked:ring-offset-surface"
            />
          </label>
        ))}
      </fieldset>

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
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-muted">Categorie nouă</h2>
        <CategoryForm mode="create" />
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
