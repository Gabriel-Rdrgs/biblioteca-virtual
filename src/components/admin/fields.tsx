"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small form primitives shared by the admin forms. */

export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {hint ? <p className="text-ink-faint mt-0.5 text-xs">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export const inputClass =
  "border-line bg-surface focus:border-primary w-full rounded-md border px-3 py-2 text-sm";

export function ProvenanceFields({
  idPrefix,
  values,
  onChange,
}: {
  idPrefix: string;
  values: { origin: string; authorization: string; note: string };
  onChange: (next: { origin: string; authorization: string; note: string }) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Origem do arquivo"
        htmlFor={`${idPrefix}-origin`}
        required
        hint="Quem forneceu e de onde veio."
      >
        <input
          id={`${idPrefix}-origin`}
          className={inputClass}
          value={values.origin}
          onChange={(e) => onChange({ ...values, origin: e.target.value })}
          placeholder="Enviado por Fulano, cópia própria"
        />
      </Field>
      <Field
        label="Autorização de uso"
        htmlFor={`${idPrefix}-auth`}
        required
        hint="Em que base a turma pode usar este arquivo."
      >
        <input
          id={`${idPrefix}-auth`}
          className={inputClass}
          value={values.authorization}
          onChange={(e) => onChange({ ...values, authorization: e.target.value })}
          placeholder="Direito de uso para estudo declarado pela turma"
        />
      </Field>
      <Field
        label="Observação sobre o arquivo"
        htmlFor={`${idPrefix}-note`}
        hint="Opcional — ex.: edição diferente da citada no plano."
        className="sm:col-span-2"
      >
        <input
          id={`${idPrefix}-note`}
          className={inputClass}
          value={values.note}
          onChange={(e) => onChange({ ...values, note: e.target.value })}
        />
      </Field>
    </div>
  );
}

export function Notice({ tone, children }: { tone: "erro" | "ok" | "aviso"; children: ReactNode }) {
  return (
    <p
      role={tone === "erro" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        tone === "erro" && "border-danger/30 bg-danger-soft text-danger",
        tone === "ok" && "border-sage/40 bg-sage-soft text-sage",
        tone === "aviso" && "border-accent/40 bg-accent-soft text-accent",
      )}
    >
      {children}
    </p>
  );
}
