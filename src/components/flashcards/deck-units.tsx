"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Images } from "lucide-react";
import { countDeck, type CardReview } from "@/lib/domain/flashcard-review";
import type { DeckSummary } from "@/lib/domain/flashcard-types";
import { loadAllReviews } from "@/lib/flashcard-storage";
import { cn } from "@/lib/utils";

/**
 * Baralhos em unidades, numerados na ordem em que se estudam.
 *
 * Cada linha diz o que importa antes de abrir: quantos cartões, quantos
 * vencidos e quanto já está dominado. O progresso vem do aparelho, então
 * aparece depois de montar; o resto já vem pronto do servidor.
 */

export interface DeckUnitView {
  readonly title: string;
  readonly note?: string;
  readonly decks: readonly DeckSummary[];
}

type Reviews = Record<string, Record<string, CardReview>>;

export function useReviews(): Reviews | null {
  const [reviews, setReviews] = useState<Reviews | null>(null);
  useEffect(() => setReviews(loadAllReviews()), []);
  return reviews;
}

export function DeckRow({
  deck,
  index,
  reviews,
  color,
}: {
  deck: DeckSummary;
  index: number;
  reviews: Reviews | null;
  color?: string;
}) {
  const counts = reviews ? countDeck(deck.cardIds, reviews[deck.id] ?? {}, new Date()) : null;
  const mastered = counts && counts.total ? Math.round((counts.dominados / counts.total) * 100) : 0;
  const started = counts ? counts.total - counts.novos : 0;

  return (
    <li>
      <Link
        href={deck.href}
        className="glass hover:glass-strong rounded-panel group flex items-center gap-4 p-4 transition-colors"
      >
        <span
          className="font-display grid size-11 shrink-0 place-items-center rounded-full text-lg text-white tabular-nums"
          style={{ background: deck.color ?? color ?? "var(--primary)" }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{deck.title}</span>
            {deck.imageCards > 0 ? (
              <span className="text-accent inline-flex items-center gap-1 text-xs">
                <Images className="size-3" aria-hidden="true" />
                {deck.imageCards}
              </span>
            ) : null}
            {counts && counts.revisar > 0 ? (
              <span className="bg-danger-soft text-danger rounded-full px-2 py-0.5 text-[0.7rem] font-semibold">
                {counts.revisar} para revisar
              </span>
            ) : null}
          </span>
          <span className="text-ink-muted mt-0.5 line-clamp-1 block text-sm">
            {deck.description}
          </span>
          <span className="mt-2 flex items-center gap-3">
            <span className="bg-line h-1.5 max-w-48 flex-1 overflow-hidden rounded-full">
              <span
                className="bg-primary block h-full rounded-full transition-[width]"
                style={{ width: `${mastered}%` }}
              />
            </span>
            <span className="text-ink-faint text-xs tabular-nums">
              {counts
                ? started === 0
                  ? `${counts.total} cartões · novo`
                  : `${counts.dominados}/${counts.total} dominados`
                : `${deck.cardIds.length} cartões`}
            </span>
          </span>
        </span>
        <ArrowRight
          className="text-ink-faint group-hover:text-primary size-4 shrink-0 transition-colors"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

export function DeckUnits({
  units,
  color,
  className,
}: {
  units: readonly DeckUnitView[];
  color?: string;
  className?: string;
}) {
  const reviews = useReviews();
  return (
    <div className={cn("space-y-6", className)}>
      {units.map((unit) => (
        <div key={unit.title}>
          <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h3 className="text-base font-semibold">{unit.title}</h3>
            {unit.note ? <span className="text-ink-faint text-sm">{unit.note}</span> : null}
          </div>
          <ol className="grid gap-2 lg:grid-cols-2">
            {unit.decks.map((deck, i) => (
              <DeckRow key={deck.id} deck={deck} index={i} reviews={reviews} color={color} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
