"use client";

import { useActionState, useState, useTransition } from "react";

import {
  createTemplateAction,
  addTemplateLineAction,
  deleteTemplateLineAction,
  deleteTemplateAction,
  type TemplateActionState,
} from "@/lib/actions/templates";
import type { AllocationTemplate, TemplateLine } from "@/lib/data/templates";
import type { Category } from "@/lib/data/settings";

const ron = new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" });

export function TemplatesManager({
  templates,
  expenseCats,
}: {
  templates: AllocationTemplate[];
  expenseCats: Category[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <CreateTemplate />
      {templates.length === 0 ? (
        <p className="text-sm text-muted">
          Niciun șablon încă. Creează unul (ex: „Salariu Gabi") și adaugă liniile de alocare.
        </p>
      ) : (
        templates.map((t) => (
          <TemplateCard key={t.id} template={t} expenseCats={expenseCats} />
        ))
      )}
    </div>
  );
}

function CreateTemplate() {
  const [state, action, pending] = useActionState<TemplateActionState, FormData>(
    createTemplateAction,
    undefined,
  );
  return (
    <form action={action} className="flex gap-2">
      <input
        name="name"
        required
        placeholder="Nume șablon nou (ex: Salariu)"
        className="flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "…" : "Creează"}
      </button>
      {state?.error ? <p className="text-sm text-expense">{state.error}</p> : null}
    </form>
  );
}

function TemplateCard({
  template,
  expenseCats,
}: {
  template: AllocationTemplate;
  expenseCats: Category[];
}) {
  const [, start] = useTransition();
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{template.name}</h2>
        <button
          type="button"
          onClick={() => start(() => deleteTemplateAction(template.id))}
          className="text-sm text-muted hover:text-expense"
        >
          Șterge șablonul
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {template.lines.length === 0 ? (
          <p className="text-sm text-muted">Nicio linie.</p>
        ) : (
          template.lines.map((l) => <LineRow key={l.id} line={l} />)
        )}
      </div>

      <AddLineForm templateId={template.id} expenseCats={expenseCats} />
    </section>
  );
}

function LineRow({ line }: { line: TemplateLine }) {
  const [, start] = useTransition();
  const name = line.category?.name ?? line.label ?? "—";
  const valueLabel = line.mode === "percent" ? `${line.value}%` : ron.format(line.value);
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
      <span>
        {line.category?.icon ? `${line.category.icon} ` : ""}
        {name}
      </span>
      <span className="flex items-center gap-3">
        <span className="font-semibold tabular-nums">{valueLabel}</span>
        <button
          type="button"
          aria-label="Șterge linia"
          onClick={() => start(() => deleteTemplateLineAction(line.id))}
          className="text-muted hover:text-expense"
        >
          ✕
        </button>
      </span>
    </div>
  );
}

function AddLineForm({
  templateId,
  expenseCats,
}: {
  templateId: string;
  expenseCats: Category[];
}) {
  const [state, action, pending] = useActionState<TemplateActionState, FormData>(
    addTemplateLineAction,
    undefined,
  );
  const [mode, setMode] = useState<"fixed" | "percent">("fixed");

  return (
    <form action={action} className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
      <input type="hidden" name="template_id" value={templateId} />
      <select
        name="category_id"
        defaultValue=""
        className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
      >
        <option value="">Fără categorie (scrie un nume jos)</option>
        {expenseCats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon ? `${c.icon} ` : ""}
            {c.name}
          </option>
        ))}
      </select>
      <input
        name="label"
        placeholder="Nume (dacă n-ai ales categorie)"
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <div className="flex gap-2">
        <select
          name="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as "fixed" | "percent")}
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
        >
          <option value="fixed">Sumă fixă</option>
          <option value="percent">Procent din disponibil</option>
        </select>
        <input
          name="value"
          type="text"
          inputMode="decimal"
          required
          placeholder={mode === "percent" ? "% (ex: 15)" : "RON (ex: 1200)"}
          className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          +
        </button>
      </div>
      {state?.error ? <p className="text-sm text-expense">{state.error}</p> : null}
    </form>
  );
}
