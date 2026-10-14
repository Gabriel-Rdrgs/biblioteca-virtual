"use client";

import { Field, inputClass } from "@/components/ui/primitives";

/** O único campo que é mesmo do painel: a procedência de um arquivo. */

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
