"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Check, Flame, GraduationCap, PersonStanding, RotateCcw, Target, Trophy } from "lucide-react";
import {
  cardStatus,
  dueIds,
  lessonMastered,
  STATUS_LABELS,
  type CardStatus,
  type Lesson,
} from "@/lib/domain/anatomy-lessons";
import type { AnatomyRegion } from "@/lib/domain/anatomy-types";
import { useAnatomyProgress } from "@/lib/anatomy-progress";
import { cn } from "@/lib/utils";

/**
 * O painel da anatomia 3D: o que revisar hoje, a próxima lição e as
 * regiões do corpo com suas lições, na ordem em que se estuda.
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
  const now = Date.now();
  const due = dueIds(progress.cards, now).filter((id) => byId.has(id));
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
  const names = (ids: readonly string[]) =>
    ids.map((id) => byId.get(id)?.namePt ?? id).join(", ");

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------ hoje */}
      <section aria-labelledby="hoje" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="lg:col-span-2">
          <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">Hoje</p>
          <h2 id="hoje" className="mt-1 text-2xl font-semibold">
            {due.length
              ? `${due.length} ${due.length === 1 ? "nome" : "nomes"} para revisar`
              : started
                ? "Revisões em dia"
                : "Memorize músculos e ossos vendo, digitando e revisando"}
          </h2>
          <p className="text-ink-muted mt-1 text-sm leading-relaxed">
            {due.length
              ? "Revisar agora empurra a próxima revisão para mais longe."
              : started
                ? "Aproveite para aprender músculos novos."
                : "O músculo acende no corpo em 3D e você escreve o nome — primeiro vendo, depois com a primeira letra, por fim de memória. O que você acerta volta em 1, 3, 7, 14 e 30 dias."}
          </p>
        </div>

        {due.length ? (
          <Link
            href="/anatomia/revisar"
            className="flex min-h-[76px] items-center gap-3 rounded-2xl bg-[#e5432f] p-4 text-white transition-colors hover:bg-[#f0543f]"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
              <RotateCcw className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-semibold">Revisar agora</span>
              <span className="block truncate text-[13.5px] text-white/80">
                {names(due.slice(0, 3))}
                {due.length > 3 ? ` e mais ${due.length - 3}` : ""}
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
          </Link>
        ) : null}

        {next ? (
          <Link
            href={`/anatomia/licao/${next.id}`}
            className={cn(
              "glass flex min-h-[76px] items-center gap-3 rounded-2xl p-4 transition-colors",
              !due.length && "lg:col-span-1",
            )}
          >
            <span className="bg-primary-soft text-primary grid size-11 shrink-0 place-items-center rounded-xl">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold">
                {progress.lessons[next.id] ? "Repetir lição" : started ? "Próxima lição" : "Começar a primeira lição"}
              </span>
              <span className="text-ink-muted block truncate text-[13.5px]">
                {next.title} · {names(next.muscleIds)}
              </span>
            </span>
            <ArrowRight className="text-ink-faint size-5 shrink-0" aria-hidden="true" />
          </Link>
        ) : null}

        <div className={cn("grid grid-cols-2 gap-3", due.length && "lg:col-span-2")}>
          <Link href="/anatomia/atlas" className="glass flex min-h-[76px] flex-col justify-between rounded-2xl p-3.5">
            <PersonStanding className="text-primary size-5" aria-hidden="true" />
            <span>
              <span className="block text-[15px] font-semibold">Atlas 3D</span>
              <span className="text-ink-muted block text-[13px]">Girar o corpo e ler as fichas</span>
            </span>
          </Link>
          <Link href="/anatomia/quiz" className="glass flex min-h-[76px] flex-col justify-between rounded-2xl p-3.5">
            <Target className="text-primary size-5" aria-hidden="true" />
            <span>
              <span className="block text-[15px] font-semibold">Desafiar</span>
              <span className="text-ink-muted block text-[13px]">Identificar, localizar, pela função</span>
            </span>
          </Link>
        </div>
      </section>

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
              <details key={region.id} open={isNext} className="glass group rounded-2xl">
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
