"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Images, Layers, Plus, Upload, Users } from "lucide-react";
import { countDeck, type CardReview } from "@/lib/domain/flashcard-review";
import type { DeckSummary } from "@/lib/domain/flashcard-types";
import { loadAllReviews, loadOwnDecks, type OwnDeck } from "@/lib/flashcard-storage";
import { cn } from "@/lib/utils";
import { Badge, ButtonLink, ToggleChip } from "@/components/ui/primitives";

/**
 * A estante de baralhos.
 *
 * O servidor manda a lista (oficiais, do banco e da turma); o progresso e
 * os baralhos próprios vêm do aparelho. Por isso o componente é de cliente:
 * o número que mais importa aqui — quantos cartões venceram hoje — só
 * existe no navegador de quem estuda.
 */

export interface HubDiscipline {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
}

type Reviews = Record<string, Record<string, CardReview>>;

function DeckCard({
  summary,
  reviews,
  disciplineLabel,
}: {
  summary: DeckSummary;
  reviews: Reviews | null;
  disciplineLabel?: string;
}) {
  const counts = reviews
    ? countDeck(summary.cardIds, reviews[summary.id] ?? {}, new Date())
    : null;
  const mastered = counts && counts.total ? Math.round((counts.dominados / counts.total) * 100) : 0;
  const pending = counts ? counts.revisar : 0;

  return (
    <li>
      <Link
        href={summary.href}
        className="glass hover:glass-strong rounded-panel group flex h-full flex-col gap-3 overflow-hidden p-0 transition-transform hover:-translate-y-0.5"
      >
        <span
          aria-hidden="true"
          className="block h-1"
          style={{ background: summary.color ?? "var(--primary)" }}
        />
        <span className="flex flex-1 flex-col gap-2 px-4 pb-4">
          <span className="flex flex-wrap items-center gap-1.5">
            {disciplineLabel ? <Badge tom="contorno">{disciplineLabel}</Badge> : null}
            {summary.imageCards > 0 ? (
              <Badge tom="acento">
                <Images className="size-3" aria-hidden="true" />
                {summary.imageCards} com figura
              </Badge>
            ) : null}
            {pending > 0 ? <Badge tom="perigo">{pending} para revisar</Badge> : null}
          </span>
          <span className="font-display text-lg leading-snug font-semibold">{summary.title}</span>
          <span className="text-ink-muted line-clamp-2 text-sm leading-relaxed">
            {summary.description}
          </span>
          {summary.author ? (
            <span className="text-ink-faint text-xs">por {summary.author}</span>
          ) : null}
          <span className="mt-auto flex items-center gap-3 pt-2">
            <span className="bg-line h-1.5 flex-1 overflow-hidden rounded-full">
              <span
                className="bg-primary block h-full rounded-full"
                style={{ width: `${mastered}%` }}
              />
            </span>
            <span className="text-ink-muted text-xs tabular-nums">
              {counts ? `${counts.dominados}/${counts.total}` : summary.cardIds.length}
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

function Section({
  id,
  title,
  description,
  icon,
  children,
  action,
}: {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id={id} className="flex items-center gap-2 text-xl font-semibold">
            {icon}
            {title}
          </h2>
          <p className="text-ink-muted mt-1 text-sm leading-relaxed text-pretty">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
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
  oficiais,
  banco,
  turma,
  disciplines,
}: {
  oficiais: readonly DeckSummary[];
  banco: readonly DeckSummary[];
  turma: readonly DeckSummary[];
  disciplines: readonly HubDiscipline[];
}) {
  const [reviews, setReviews] = useState<Reviews | null>(null);
  const [own, setOwn] = useState<OwnDeck[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    setReviews(loadAllReviews());
    setOwn(loadOwnDecks());
  }, []);

  const label = useMemo(() => {
    const map = new Map(disciplines.map((d) => [d.id, d.shortName]));
    return (id: string) => map.get(id);
  }, [disciplines]);

  const used = useMemo(() => {
    const ids = new Set([...oficiais, ...banco, ...turma].map((d) => d.disciplineId));
    for (const d of own) ids.add(d.disciplineId);
    return disciplines.filter((d) => ids.has(d.id));
  }, [oficiais, banco, turma, own, disciplines]);

  const keep = (d: { disciplineId: string }) => !filter || d.disciplineId === filter;

  const dueTotal = reviews
    ? [...oficiais, ...banco, ...turma, ...own.map(ownToSummary)].reduce(
        (sum, d) => sum + countDeck(d.cardIds, reviews[d.id] ?? {}, new Date()).revisar,
        0,
      )
    : 0;

  // Coleções oficiais em blocos ("Membros superiores", "Semiologia…").
  const collections = new Map<string, DeckSummary[]>();
  for (const deck of oficiais.filter(keep)) {
    const key = deck.collection ?? deck.title;
    collections.set(key, [...(collections.get(key) ?? []), deck]);
  }

  const ownSummaries = own.map(ownToSummary).filter(keep);

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={cn(
            "rounded-panel flex items-center gap-3 px-4 py-3",
            dueTotal > 0 ? "bg-danger-soft text-danger" : "glass text-ink-muted",
          )}
          role="status"
        >
          <span className="font-display text-2xl tabular-nums">{reviews ? dueTotal : "—"}</span>
          <span className="text-sm leading-tight">
            {dueTotal === 1 ? "cartão vence hoje" : "cartões vencem hoje"}
            <br />
            <span className="text-xs opacity-80">nos baralhos que você já começou</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/flashcards/novo">
            <Plus className="size-4" aria-hidden="true" />
            Criar baralho
          </ButtonLink>
          <ButtonLink href="/flashcards/novo?importar=1" variant="secundario">
            <Upload className="size-4" aria-hidden="true" />
            Importar
          </ButtonLink>
        </div>
      </div>

      {used.length > 1 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Filtrar por matéria">
          <li>
            <ToggleChip pressed={filter === null} onClick={() => setFilter(null)}>
              Todas
            </ToggleChip>
          </li>
          {used.map((d) => (
            <li key={d.id}>
              <ToggleChip pressed={filter === d.id} onClick={() => setFilter(d.id)}>
                {d.shortName}
              </ToggleChip>
            </li>
          ))}
        </ul>
      ) : null}

      {ownSummaries.length > 0 ? (
        <Section
          id="meus"
          title="Meus baralhos"
          description="Escritos por você e guardados neste aparelho. Exporte para não perder, ou publique para a turma."
          icon={<Layers className="text-primary size-5" aria-hidden="true" />}
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ownSummaries.map((s) => (
              <DeckCard key={s.id} summary={s} reviews={reviews} disciplineLabel={label(s.disciplineId)} />
            ))}
          </ul>
        </Section>
      ) : null}

      {[...collections.entries()].map(([name, decks]) => (
        <Section
          key={name}
          id={`col-${decks[0]!.slug}`}
          title={name}
          description={`${decks.length} ${decks.length === 1 ? "baralho" : "baralhos"} · ${decks.reduce((n, d) => n + d.cardIds.length, 0)} cartões`}
          icon={<Layers className="text-primary size-5" aria-hidden="true" />}
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((s) => (
              <DeckCard key={s.id} summary={s} reviews={reviews} disciplineLabel={label(s.disciplineId)} />
            ))}
          </ul>
        </Section>
      ))}

      {turma.filter(keep).length > 0 ? (
        <Section
          id="turma"
          title="Da turma"
          description="Publicados por colegas. Qualquer um pode estudar; só quem publicou edita."
          icon={<Users className="text-primary size-5" aria-hidden="true" />}
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {turma.filter(keep).map((s) => (
              <DeckCard key={s.id} summary={s} reviews={reviews} disciplineLabel={label(s.disciplineId)} />
            ))}
          </ul>
        </Section>
      ) : null}

      {banco.filter(keep).length > 0 ? (
        <Section
          id="banco"
          title="Do banco de questões"
          description="Cada questão do banco virou cartão: o caso na frente, o gabarito e o comentário no verso. Corrigir a questão corrige o cartão."
          icon={<Layers className="text-primary size-5" aria-hidden="true" />}
          action={
            <Link href="/estudar/rapido" className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline">
              Prefere alternativas? Modo rápido
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {banco.filter(keep).map((s) => (
              <DeckCard key={s.id} summary={s} reviews={reviews} disciplineLabel={label(s.disciplineId)} />
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
