"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Check, Flame, Trophy } from "lucide-react";
import {
  cardStatus,
  lessonMastered,
  STATUS_LABELS,
  type CardStatus,
  type Lesson,
} from "@/lib/domain/anatomy-lessons";
import type { AnatomyRegion } from "@/lib/domain/anatomy-types";
import { useAnatomyProgress } from "@/lib/anatomy-progress";
import { cn } from "@/lib/utils";

/**
 * O quadro das lições: um resumo do progresso e as regiões do corpo, cada
 * uma com suas lições de músculos e de ossos, na ordem em que se estuda.
 * A próxima lição a fazer já vem aberta.
 */

export interface HomeMuscle {
  readonly id: string;
  readonly namePt: string;
  readonly region: string;
}

const DOT: Record<CardStatus, string> = {
  new: "bg-line",
  learning: "bg-[#ff6a55]",
  consolidating: "bg-amber-400",
  mastered: "bg-emerald-500",
};

export function AnatomyHome({
  regions,
  lessons,
  muscles,
}: {
  regions: readonly AnatomyRegion[];
  lessons: readonly Lesson[];
  muscles: readonly HomeMuscle[];
}) {
  const progress = useAnatomyProgress();
  const byId = useMemo(() => new Map(muscles.map((m) => [m.id, m])), [muscles]);
  const started = muscles.some((m) => progress.cards[m.id]) || Object.keys(progress.lessons).length > 0;

  const counts = { mastered: 0, studied: 0, seen: 0, correct: 0 };
  for (const m of muscles) {
    const card = progress.cards[m.id];
    if (!card) continue;
    counts.studied++;
    counts.seen += card.seen;
    counts.correct += card.correct;
    if (cardStatus(card) === "mastered") counts.mastered++;
  }

  // A próxima: a primeira lição ainda não dominada, na ordem do corpo.
  const next = lessons.find((l) => !lessonMastered(progress.lessons[l.id]?.best)) ?? lessons[0];

  return (
    <div className="space-y-8">
      {started ? (
        <section aria-label="Resumo" className="grid grid-cols-3 gap-2">
          {[
            { icon: Flame, value: `${counts.studied}/${muscles.length}`, label: "estudados" },
            { icon: Trophy, value: String(counts.mastered), label: "dominados" },
            {
              icon: Check,
              value: counts.seen ? `${Math.round((counts.correct / counts.seen) * 100)}%` : "—",
              label: "de acerto",
            },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="glass flex flex-col gap-1 rounded-2xl p-3.5">
              <Icon className="text-ink-faint size-4" aria-hidden="true" />
              <span className="text-2xl leading-none font-semibold tracking-tight">{value}</span>
              <span className="text-ink-muted text-[12.5px] leading-tight">{label}</span>
            </div>
          ))}
        </section>
      ) : null}

      {/* ------------------------------------------------- regiões */}
      <section aria-labelledby="regioes">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="regioes" className="text-xl font-semibold">
            Regiões
          </h2>
          <span className="text-ink-faint font-mono text-xs">
            {counts.studied}/{muscles.length} estudados
          </span>
        </div>
        <div className="space-y-2">
          {regions.map((region) => {
            const regionLessons = lessons.filter((l) => l.region === region.id);
            if (regionLessons.length === 0) return null;
            const ids = regionLessons.flatMap((l) => l.muscleIds);
            const studied = ids.filter((id) => progress.cards[id]).length;
            const done = regionLessons.filter((l) => lessonMastered(progress.lessons[l.id]?.best)).length;
            const isNext = next?.region === region.id;
            return (
              <details key={region.id} id={region.id} open={isNext} className="glass group scroll-mt-24 rounded-2xl">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold">{region.name}</span>
                      <span className="text-ink-faint shrink-0 font-mono text-xs">
                        {done}/{regionLessons.length} lições · {studied}/{ids.length}
                      </span>
                    </span>
                    <span className="bg-line mt-2 block h-1.5 overflow-hidden rounded-full">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          done === regionLessons.length ? "bg-emerald-500" : "bg-[#ff6a55]",
                        )}
                        style={{ width: `${ids.length ? (studied / ids.length) * 100 : 0}%` }}
                      />
                    </span>
                  </span>
                  <ArrowRight
                    className="text-ink-faint size-4 shrink-0 transition-transform group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <ol className="space-y-2 px-4 pb-4">
                  {regionLessons.map((lesson) => {
                    const record = progress.lessons[lesson.id];
                    const mastered = lessonMastered(record?.best);
                    return (
                      <li key={lesson.id} className="border-line flex items-center gap-3 rounded-xl border p-3">
                        <span
                          className={cn(
                            "grid size-10 shrink-0 place-items-center rounded-xl font-mono text-sm",
                            mastered ? "bg-emerald-500/15 text-emerald-600" : "bg-primary-soft text-primary",
                          )}
                          aria-label={mastered ? "Lição dominada" : undefined}
                        >
                          {mastered ? <Check className="size-4" /> : `L${lesson.number}`}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">
                            {lesson.kind === "bone" ? "Ossos" : "Músculos"} · L{lesson.number}
                            <span className="text-ink-faint ml-2 font-mono text-xs font-normal">
                              {lesson.muscleIds.length} {lesson.kind === "bone" ? "ossos" : "músculos"}
                              {record ? ` · melhor ${Math.round(record.best * 100)}%` : ""}
                            </span>
                          </span>
                          <span className="text-ink-muted mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[13px] leading-snug">
                            {lesson.muscleIds.map((id) => {
                              const status = cardStatus(progress.cards[id]);
                              return (
                                <span key={id} className="inline-flex items-center gap-1" title={STATUS_LABELS[status]}>
                                  <span className={cn("size-1.5 rounded-full", DOT[status])} aria-hidden="true" />
                                  {byId.get(id)?.namePt ?? id}
                                </span>
                              );
                            })}
                          </span>
                        </span>
                        <Link
                          href={`/anatomia/licao/${lesson.id}`}
                          aria-label={`${record ? "Repetir" : "Começar"} lição ${lesson.number} de ${lesson.kind === "bone" ? "ossos" : "músculos"} de ${region.name}`}
                          className={cn(
                            "inline-flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-sm font-semibold",
                            mastered ? "glass-strong" : "bg-primary text-on-primary",
                          )}
                        >
                          {record ? "Repetir" : "Começar"}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </details>
            );
          })}
        </div>
        <p className="text-ink-faint mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {(Object.keys(DOT) as CardStatus[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", DOT[s])} aria-hidden="true" />
              {STATUS_LABELS[s]}
            </span>
          ))}
        </p>
      </section>
    </div>
  );
}
