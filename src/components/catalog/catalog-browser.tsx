"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { CatalogEntry, DisciplineRef } from "@/lib/domain/types";
import {
  emptyFilters,
  searchCatalog,
  type CatalogFilters,
  type SortKey,
} from "@/lib/domain/search";
import { BookGrid } from "@/components/book/book-grid";
import { EmptyState } from "@/components/ui/primitives";
import { FilterChips, FilterPanel } from "./filter-panel";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "relevancia", label: "Relevância" },
  { value: "titulo", label: "Título (A–Z)" },
  { value: "disciplinas", label: "Nº de disciplinas" },
  { value: "ano", label: "Ano (mais recente)" },
  { value: "recentes", label: "Adicionados recentemente" },
];

const PAGE_SIZE = 20;

interface CatalogBrowserProps {
  readonly entries: readonly CatalogEntry[];
  readonly disciplines: readonly DisciplineRef[];
  readonly topics: readonly { topic: string; count: number }[];
  readonly initialDiscipline?: string;
}

export function CatalogBrowser({
  entries,
  disciplines,
  topics,
  initialDiscipline,
}: CatalogBrowserProps) {
  const [filters, setFilters] = useState<CatalogFilters>({
    ...emptyFilters,
    disciplines: initialDiscipline ? [initialDiscipline] : [],
  });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keeps typing responsive: the input updates at once, the heavy filter pass
  // runs against the deferred value.
  const deferredFilters = useDeferredValue(filters);

  const results = useMemo(
    () => searchCatalog(entries, deferredFilters),
    [entries, deferredFilters],
  );

  const update = (next: Partial<CatalogFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
    setVisible(PAGE_SIZE);
  };

  const reset = () => {
    setFilters(emptyFilters);
    setVisible(PAGE_SIZE);
  };

  const hasActiveFilters =
    filters.disciplines.length > 0 ||
    filters.bibliographyTypes.length > 0 ||
    filters.topics.length > 0 ||
    filters.availability !== "todos" ||
    filters.sharedOnly;

  const shown = results.slice(0, visible);
  const panel = (
    <FilterPanel
      filters={filters}
      disciplines={disciplines}
      topics={topics}
      onChange={update}
      onReset={reset}
      hasActiveFilters={hasActiveFilters}
    />
  );

  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="sticky top-24">{panel}</div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="text-ink-faint pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => update({ query: event.target.value })}
              placeholder="Buscar por título, autor, tema ou disciplina…"
              aria-label="Buscar no catálogo"
              className="border-line bg-surface placeholder:text-ink-faint focus:border-primary w-full rounded-md border py-2.5 pr-3 pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="sr-only">
              Ordenar por
            </label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value as SortKey })}
              className="border-line bg-surface focus:border-primary rounded-md border px-3 py-2.5 text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="border-line inline-flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm lg:hidden"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filtros
              {hasActiveFilters ? (
                <span className="bg-primary size-1.5 rounded-full" aria-label="filtros ativos" />
              ) : null}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <FilterChips
            filters={filters}
            disciplines={disciplines}
            onChange={update}
            onReset={reset}
          />
          <p role="status" aria-live="polite" className="text-ink-muted text-sm">
            {results.length === 0
              ? "Nenhum resultado"
              : `${results.length} ${results.length === 1 ? "livro" : "livros"}`}
            {filters.query ? ` para “${filters.query}”` : ""}
          </p>
        </div>

        <div className="mt-6">
          {results.length === 0 ? (
            <EmptyState
              title="Nenhum livro encontrado"
              description="Tente outro termo ou remova alguns filtros. A busca ignora acentos e maiúsculas, então “etica” e “Ética” dão o mesmo resultado."
              action={
                hasActiveFilters || filters.query ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="bg-primary text-on-primary hover:bg-primary-hover rounded-md px-4 py-2 text-sm font-medium"
                  >
                    Limpar busca e filtros
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <BookGrid entries={shown} query={filters.query} label="Livros do acervo" />
              {visible < results.length ? (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="border-line hover:border-line-strong hover:bg-surface-sunken rounded-md border px-5 py-2.5 text-sm font-medium transition-colors"
                  >
                    Mostrar mais {Math.min(PAGE_SIZE, results.length - visible)} de{" "}
                    {results.length - visible} restantes
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-label="Fechar filtros"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            className="border-line bg-canvas absolute inset-y-0 right-0 w-[min(22rem,90vw)] overflow-y-auto border-l p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Filtros</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="border-line inline-flex size-9 items-center justify-center rounded-md border"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Fechar</span>
              </button>
            </div>
            {panel}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="bg-primary text-on-primary mt-6 w-full rounded-md px-4 py-3 text-sm font-medium"
            >
              Ver {results.length} {results.length === 1 ? "resultado" : "resultados"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
