"use client";

import { X } from "lucide-react";
import type { BibliographyType, DisciplineRef } from "@/lib/domain/types";
import type { AvailabilityFilter, CatalogFilters } from "@/lib/domain/search";
import { bibliographyLabels } from "@/components/book/book-badge";
import { cn } from "@/lib/utils";

const availabilityOptions: { value: AvailabilityFilter; label: string }[] = [
  { value: "todos", label: "Qualquer acesso" },
  { value: "com_pdf", label: "Com PDF" },
  { value: "publico", label: "Acesso livre" },
  { value: "somente_referencia", label: "Somente referência" },
];

const bibliographyOptions: BibliographyType[] = [
  "basica",
  "basica_virtual",
  "complementar",
  "outras_referencias",
];

interface FilterPanelProps {
  readonly filters: CatalogFilters;
  readonly disciplines: readonly DisciplineRef[];
  readonly topics: readonly { topic: string; count: number }[];
  readonly onChange: (next: Partial<CatalogFilters>) => void;
  readonly onReset: () => void;
  readonly hasActiveFilters: boolean;
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-line border-t pt-4">
      <legend className="text-ink-faint pr-2 text-xs font-semibold tracking-[0.1em] uppercase">
        {legend}
      </legend>
      <div className="mt-3 space-y-2">{children}</div>
    </fieldset>
  );
}

function CheckboxRow({
  id,
  label,
  checked,
  onToggle,
  swatch,
}: {
  id: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
  swatch?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onToggle}
        className="size-4 shrink-0 accent-[var(--primary)]"
      />
      <label htmlFor={id} className="flex min-w-0 cursor-pointer items-center gap-2 text-sm">
        {swatch ? (
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: swatch }}
            aria-hidden="true"
          />
        ) : null}
        <span className="truncate">{label}</span>
      </label>
    </div>
  );
}

export function FilterPanel({
  filters,
  disciplines,
  topics,
  onChange,
  onReset,
  hasActiveFilters,
}: FilterPanelProps) {
  const toggle = <T,>(list: readonly T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filtros</h2>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
          >
            <X className="size-3" aria-hidden="true" />
            Limpar tudo
          </button>
        ) : null}
      </div>

      <Fieldset legend="Disciplina">
        {disciplines.map((discipline) => (
          <CheckboxRow
            key={discipline.id}
            id={`f-disc-${discipline.id}`}
            label={discipline.shortName}
            swatch={discipline.color}
            checked={filters.disciplines.includes(discipline.id)}
            onToggle={() => onChange({ disciplines: toggle(filters.disciplines, discipline.id) })}
          />
        ))}
      </Fieldset>

      <Fieldset legend="Tipo de bibliografia">
        {bibliographyOptions.map((type) => (
          <CheckboxRow
            key={type}
            id={`f-bib-${type}`}
            label={bibliographyLabels[type]}
            checked={filters.bibliographyTypes.includes(type)}
            onToggle={() =>
              onChange({ bibliographyTypes: toggle(filters.bibliographyTypes, type) })
            }
          />
        ))}
      </Fieldset>

      <Fieldset legend="Disponibilidade">
        <div className="space-y-2">
          {availabilityOptions.map((option) => (
            <div key={option.value} className="flex items-center gap-2.5">
              <input
                type="radio"
                id={`f-acc-${option.value}`}
                name="availability"
                checked={filters.availability === option.value}
                onChange={() => onChange({ availability: option.value })}
                className="size-4 shrink-0 accent-[var(--primary)]"
              />
              <label htmlFor={`f-acc-${option.value}`} className="cursor-pointer text-sm">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="Tema">
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {topics.map(({ topic, count }) => (
            <CheckboxRow
              key={topic}
              id={`f-top-${topic}`}
              label={`${topic} (${count})`}
              checked={filters.topics.includes(topic)}
              onToggle={() => onChange({ topics: toggle(filters.topics, topic) })}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="Relações">
        <CheckboxRow
          id="f-shared"
          label="Usado em mais de uma disciplina"
          checked={filters.sharedOnly}
          onToggle={() => onChange({ sharedOnly: !filters.sharedOnly })}
        />
      </Fieldset>
    </div>
  );
}

/** Removable chips summarising what is currently narrowing the list. */
export function FilterChips({
  filters,
  disciplines,
  onChange,
  onReset,
}: Omit<FilterPanelProps, "topics" | "hasActiveFilters">) {
  const chips: { key: string; label: string; clear: () => void }[] = [];

  for (const id of filters.disciplines) {
    const discipline = disciplines.find((d) => d.id === id);
    chips.push({
      key: `d-${id}`,
      label: discipline?.shortName ?? id,
      clear: () => onChange({ disciplines: filters.disciplines.filter((x) => x !== id) }),
    });
  }

  for (const type of filters.bibliographyTypes) {
    chips.push({
      key: `b-${type}`,
      label: bibliographyLabels[type],
      clear: () =>
        onChange({ bibliographyTypes: filters.bibliographyTypes.filter((x) => x !== type) }),
    });
  }

  for (const topic of filters.topics) {
    chips.push({
      key: `t-${topic}`,
      label: topic,
      clear: () => onChange({ topics: filters.topics.filter((x) => x !== topic) }),
    });
  }

  if (filters.availability !== "todos") {
    const option = availabilityOptions.find((o) => o.value === filters.availability);
    chips.push({
      key: "acc",
      label: option?.label ?? filters.availability,
      clear: () => onChange({ availability: "todos" }),
    });
  }

  if (filters.sharedOnly) {
    chips.push({
      key: "shared",
      label: "Em mais de uma disciplina",
      clear: () => onChange({ sharedOnly: false }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={chip.clear}
            className={cn(
              "border-line bg-surface inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
              "hover:border-line-strong hover:text-ink transition-colors",
            )}
          >
            {chip.label}
            <X className="text-ink-faint size-3" aria-hidden="true" />
            <span className="sr-only">Remover filtro</span>
          </button>
        </li>
      ))}
      <li>
        <button type="button" onClick={onReset} className="text-primary text-xs hover:underline">
          Limpar tudo
        </button>
      </li>
    </ul>
  );
}
