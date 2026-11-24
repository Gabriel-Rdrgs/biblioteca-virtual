"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, RotateCcw } from "lucide-react";
import { dueIds, lessonMastered } from "@/lib/domain/anatomy-lessons";
import { useAnatomyProgress } from "@/lib/anatomy-progress";

/**
 * "Hoje" no atlas: o que venceu na revisão e a próxima lição — duas
 * linhas, não um painel. O resto do estudo fica na página das lições.
 */

export interface LessonStub {
  readonly id: string;
  readonly title: string;
}

export function StudyToday({
  lessons,
  trainable,
}: {
  lessons: readonly LessonStub[];
  /** Ids que existem no treino: um cartão antigo de algo removido não conta. */
  trainable: readonly string[];
}) {
  const progress = useAnatomyProgress();
  const known = new Set(trainable);
  const due = dueIds(progress.cards, Date.now()).filter((id) => known.has(id));
  const next = lessons.find((l) => !lessonMastered(progress.lessons[l.id]?.best)) ?? lessons[0];
  const started = Object.keys(progress.lessons).length > 0 || Object.keys(progress.cards).length > 0;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {due.length ? (
        <Link
          href="/anatomia/revisar"
          className="flex min-h-16 items-center gap-3 rounded-2xl bg-[#e5432f] px-4 py-3 text-white transition-colors hover:bg-[#f0543f]"
        >
          <RotateCcw className="size-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Revisar agora</span>
            <span className="block truncate text-sm text-white/80">
              {due.length} {due.length === 1 ? "nome venceu" : "nomes venceram"} hoje
            </span>
          </span>
          <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
        </Link>
      ) : null}
      {next ? (
        <Link
          href={`/anatomia/licao/${next.id}`}
          className="glass flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3"
        >
          <GraduationCap className="text-primary size-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">
              {started ? "Continuar as lições" : "Começar a primeira lição"}
            </span>
            <span className="text-ink-muted block truncate text-sm">{next.title}</span>
          </span>
          <ArrowRight className="text-ink-faint size-5 shrink-0" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
