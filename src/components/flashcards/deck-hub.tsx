"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Plus, Upload } from "lucide-react";
import { countDeck } from "@/lib/domain/flashcard-review";
import type { DeckSummary } from "@/lib/domain/flashcard-types";
import { loadOwnDecks, type OwnDeck } from "@/lib/flashcard-storage";
import { cn } from "@/lib/utils";
import { ButtonLink, ToggleChip } from "@/components/ui/primitives";
import { DeckRow, DeckUnits, useReviews, type DeckUnitView } from "./deck-units";

/**
 * Os baralhos, por matéria e em ordem de estudo.
 *
 * Cada matéria é um bloco com a cor dela e a próxima prova; dentro, as
 * unidades na ordem do plano de ensino (units.ts). Os baralhos próprios do
 * aparelho abrem a página, porque quem os escreveu volta para eles.
 */

export interface HubDiscipline {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly color?: string;
}

export interface HubGroup {
  readonly discipline: HubDiscipline;
  readonly units: readonly DeckUnitView[];
  /** A próxima prova da matéria, quando há. */
  readonly nextExam?: { readonly id: string; readonly label: string; readonly when: string };
}

function ownToSummary(deck: OwnDeck): DeckSummary {
  return {
    id: `meu:${deck.id}`,
    slug: deck.id,
    origin: "meu",
    title: deck.title,
    description: deck.description || `${deck.cards.length} cartões escritos por você.`,
    disciplineId: deck.disciplineId,
    cardIds: deck.cards.map((c) => c.id),
    imageCards: 0,
    updatedAt: deck.updatedAt,
    href: `/flashcards/meus/${deck.id}`,
  };
}

export function DeckHub({
  groups,
  initialFilter,
}: {
  groups: readonly HubGroup[];
  initialFilter?: string;
}) {
  const reviews = useReviews();
  const [own, setOwn] = useState<OwnDeck[]>([]);
  const [filter, setFilter] = useState<string | null>(
    initialFilter && groups.some((g) => g.discipline.id === initialFilter) ? initialFilter : null,
  );

  useEffect(() => setOwn(loadOwnDecks()), []);

  const ownSummaries = useMemo(() => own.map(ownToSummary), [own]);
  const shown = groups.filter((g) => !filter || g.discipline.id === filter);

  const dueTotal = reviews
    ? [...groups.flatMap((g) => g.units.flatMap((u) => u.decks)), ...ownSummaries].reduce(
        (sum, d) => sum + countDeck(d.cardIds, reviews[d.id] ?? {}, new Date()).revisar,
        0,
      )
    : 0;

  return (
    <div className="space-y-10">
      {/* ------------------------------------------------ barra de ações */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="status"
          className={cn(
            "rounded-panel flex items-center gap-3 px-4 py-3",
            dueTotal > 0 ? "bg-danger-soft text-danger" : "glass text-ink-muted",
          )}
        >
          <span className="font-display text-2xl tabular-nums">{reviews ? dueTotal : "—"}</span>
          <span className="text-sm leading-tight">
            {dueTotal === 1 ? "cartão vence hoje" : "cartões vencem hoje"}
            <br />
            <span className="text-xs opacity-80">nos baralhos que você já começou</span>
          </span>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <ButtonLink href="/flashcards/novo" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Criar baralho
          </ButtonLink>
          <ButtonLink href="/flashcards/novo?importar=1" variant="secundario" size="sm">
            <Upload className="size-4" aria-hidden="true" />
            Importar
          </ButtonLink>
        </div>
      </div>

      {groups.length > 1 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Filtrar por matéria">
          <li>
            <ToggleChip pressed={filter === null} onClick={() => setFilter(null)}>
              Todas as matérias
            </ToggleChip>
          </li>
          {groups.map((g) => (
            <li key={g.discipline.id}>
              <ToggleChip
                pressed={filter === g.discipline.id}
                onClick={() => setFilter(g.discipline.id)}
              >
                {g.discipline.shortName}
              </ToggleChip>
            </li>
          ))}
        </ul>
      ) : null}

      {/* --------------------------------------------- baralhos próprios */}
      {ownSummaries.length > 0 && !filter ? (
        <section aria-labelledby="meus" className="glass rounded-hero p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="meus" className="text-xl font-semibold">
              Meus baralhos
            </h2>
            <span className="text-ink-faint text-sm">
              Neste aparelho. Exporte para não perder, ou publique para a turma.
            </span>
          </div>
          <ol className="grid gap-2 lg:grid-cols-2">
            {ownSummaries.map((deck, i) => (
              <DeckRow key={deck.id} deck={deck} index={i} reviews={reviews} />
            ))}
          </ol>
        </section>
      ) : null}

      {/* ------------------------------------------------- por matéria */}
      {shown.map((group) => {
        const cards = group.units.reduce(
          (n, u) => n + u.decks.reduce((m, d) => m + d.cardIds.length, 0),
          0,
        );
        return (
          <section
            key={group.discipline.id}
            aria-labelledby={`materia-${group.discipline.id}`}
            className="space-y-5"
          >
            <header className="border-line flex flex-wrap items-end justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-10 w-1.5 rounded-full"
                  style={{ background: group.discipline.color ?? "var(--primary)" }}
                />
                <div>
                  <h2 id={`materia-${group.discipline.id}`} className="text-2xl font-semibold">
                    {group.discipline.shortName}
                  </h2>
                  <p className="text-ink-muted text-sm">
                    {group.discipline.name} · {cards} cartões
                  </p>
                </div>
              </div>
              {group.nextExam ? (
                <Link
                  href={`/provas/${group.nextExam.id}`}
                  className="glass hover:glass-strong inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm"
                >
                  <CalendarDays className="text-primary size-4" aria-hidden="true" />
                  <span className="font-medium">{group.nextExam.label}</span>
                  <span className="text-ink-muted">{group.nextExam.when}</span>
                  <ArrowRight className="text-ink-faint size-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </header>
            <DeckUnits units={group.units} {...(group.discipline.color ? { color: group.discipline.color } : {})} />
          </section>
        );
      })}
    </div>
  );
}
