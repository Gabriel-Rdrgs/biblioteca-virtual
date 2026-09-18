"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
import type { CatalogEntry, Discipline, TeachingPlan } from "@/lib/domain/types";
import {
  emptyFilters,
  highlightSegments,
  searchCatalog,
  searchDisciplines,
  searchTeachingPlans,
} from "@/lib/domain/search";
import { BookGrid } from "@/components/book/book-grid";
import { EmptyState } from "@/components/ui/primitives";

function Marked({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  return (
    <>
      {highlightSegments(text, query).map((segment, i) =>
        segment.match ? (
          <mark key={i} className="bg-accent-soft text-accent rounded-[2px]">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  );
}

const suggestions = [
  "bates",
  "semiologia",
  "história medicina",
  "crescimento celular",
  "metodologia científica",
  "saúde coletiva",
  "humanidades",
  "anamnese",
];

interface GlobalSearchProps {
  readonly entries: readonly CatalogEntry[];
  readonly disciplines: readonly Discipline[];
  readonly plans: readonly TeachingPlan[];
  /** Pre-filled from the home page hero form (`/busca?q=…`). */
  readonly initialQuery?: string;
}

export function GlobalSearch({
  entries,
  disciplines,
  plans,
  initialQuery = "",
}: GlobalSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const deferred = useDeferredValue(query);

  const results = useMemo(() => {
    if (!deferred.trim()) {
      return { books: [], disciplines: [], plans: [], total: 0 };
    }
    const books = searchCatalog(entries, { ...emptyFilters, query: deferred });
    const foundDisciplines = searchDisciplines(disciplines, deferred);
    const foundPlans = searchTeachingPlans(plans, disciplines, deferred);
    return {
      books,
      disciplines: foundDisciplines,
      plans: foundPlans,
      total: books.length + foundDisciplines.length + foundPlans.length,
    };
  }, [entries, disciplines, plans, deferred]);

  const disciplineById = new Map(disciplines.map((d) => [d.id, d]));
  const searching = deferred.trim().length > 0;

  return (
    <div>
      <div className="relative">
        <Search
          className="text-ink-faint pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Busque por livro, autor, disciplina, tema ou plano…"
          aria-label="Buscar em todo o acervo"
          autoFocus
          className="border-line bg-surface placeholder:text-ink-faint focus:border-primary w-full rounded-lg border py-4 pr-4 pl-12 text-base"
        />
      </div>

      {!searching ? (
        <div className="mt-6">
          <p className="text-ink-muted text-sm">Sugestões para começar:</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="border-line bg-surface hover:border-primary hover:text-primary rounded-full border px-3.5 py-1.5 text-sm transition-colors"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-8">
          <p role="status" aria-live="polite" className="text-ink-muted text-sm">
            {results.total === 0
              ? `Nenhum resultado para “${deferred}”`
              : `${results.total} ${results.total === 1 ? "resultado" : "resultados"} para “${deferred}”`}
          </p>

          {results.total === 0 ? (
            <EmptyState
              title="Nada encontrado"
              description="Verifique a grafia ou tente um termo mais curto. A busca ignora acentos, hífens e maiúsculas."
            />
          ) : (
            <div className="mt-8 space-y-12">
              {results.disciplines.length > 0 ? (
                <section>
                  <h2 className="border-line mb-4 border-b pb-2 text-lg font-semibold">
                    Disciplinas{" "}
                    <span className="text-ink-faint text-sm font-normal">
                      {results.disciplines.length}
                    </span>
                  </h2>
                  <ul className="space-y-2">
                    {results.disciplines.map((discipline) => (
                      <li key={discipline.id}>
                        <Link
                          href={`/disciplinas/${discipline.slug}`}
                          className="border-line bg-surface hover:border-line-strong flex items-start gap-3 rounded-[var(--radius-card)] border p-4 transition-colors"
                        >
                          <span
                            className="mt-1.5 size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: discipline.color }}
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <span className="block font-medium">
                              <Marked text={discipline.name} query={deferred} />
                            </span>
                            <span className="text-ink-muted mt-0.5 line-clamp-2 block text-sm">
                              {discipline.description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {results.plans.length > 0 ? (
                <section>
                  <h2 className="border-line mb-4 border-b pb-2 text-lg font-semibold">
                    Planos de ensino{" "}
                    <span className="text-ink-faint text-sm font-normal">
                      {results.plans.length}
                    </span>
                  </h2>
                  <ul className="space-y-2">
                    {results.plans.map((plan) => {
                      const discipline = disciplineById.get(plan.disciplineId);
                      return (
                        <li key={plan.id}>
                          <a
                            href={plan.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-line bg-surface hover:border-line-strong flex items-center gap-3 rounded-[var(--radius-card)] border p-4 transition-colors"
                          >
                            <FileText
                              className="text-ink-faint size-4 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="min-w-0">
                              <span className="block font-medium">
                                <Marked text={plan.title} query={deferred} />
                              </span>
                              <span className="text-ink-muted text-sm">
                                {discipline?.shortName} · {plan.semester} · {plan.pages} páginas
                              </span>
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}

              {results.books.length > 0 ? (
                <section>
                  <h2 className="border-line mb-5 border-b pb-2 text-lg font-semibold">
                    Livros{" "}
                    <span className="text-ink-faint text-sm font-normal">
                      {results.books.length}
                    </span>
                  </h2>
                  <BookGrid
                    entries={results.books.slice(0, 20)}
                    query={deferred}
                    label="Livros encontrados"
                  />
                  {results.books.length > 20 ? (
                    <p className="text-ink-muted mt-6 text-sm">
                      Mostrando 20 de {results.books.length}.{" "}
                      <Link href="/livros" className="text-primary hover:underline">
                        Ver o catálogo completo com filtros
                      </Link>
                    </p>
                  ) : null}
                </section>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
