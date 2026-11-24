"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { gradeSchemes } from "@/lib/data/grading";
import { formatGrade, semesterOverview } from "@/lib/domain/grading";
import { useGradeBook } from "@/components/grades/use-grade-book";

/**
 * As notas em uma linha, para a home: quantas matérias já têm nota anotada
 * e a média das que fecharam. Sem nota nenhuma, vira convite — não zero.
 */
export function GradesGlance() {
  const book = useGradeBook();
  const visao = semesterOverview(gradeSchemes, book.marks, book.ara);

  return (
    <Link
      href="/notas"
      className="glass hover:glass-strong rounded-panel flex h-full flex-col gap-3 p-5 transition-colors"
    >
      <span className="flex items-center gap-2">
        <GraduationCap className="text-primary size-5" aria-hidden="true" />
        <span className="font-semibold">Minhas notas</span>
        <ArrowRight className="text-ink-faint ml-auto size-4" aria-hidden="true" />
      </span>
      {visao.started === 0 ? (
        <span className="text-ink-muted text-sm leading-relaxed">
          Anote o que tirou em cada prova e veja a média parcial — e quanto falta na outra
          bimestral.
        </span>
      ) : (
        <span className="grid grid-cols-3 gap-2 text-center">
          <span>
            <span className="font-display block text-2xl tabular-nums">
              {visao.media === null ? "—" : formatGrade(visao.media)}
            </span>
            <span className="text-ink-faint text-micro">média parcial</span>
          </span>
          <span>
            <span className="font-display block text-2xl tabular-nums">
              {visao.started}/{visao.total}
            </span>
            <span className="text-ink-faint text-micro">com nota</span>
          </span>
          <span>
            <span className="font-display text-danger block text-2xl tabular-nums">
              {visao.naAra}
            </span>
            <span className="text-ink-faint text-micro">na ARA</span>
          </span>
        </span>
      )}
    </Link>
  );
}
