"use client";

import { partForAssessment } from "@/lib/data/grading";
import { formatGrade, outcomeFor } from "@/lib/domain/grading";
import { useGradeBook } from "@/components/grades/use-grade-book";
import { orientacao } from "@/components/grades/phrases";
import { GradeDialog } from "@/components/grades/grade-dialog";

/**
 * A sua nota, no cartão da prova que já passou.
 *
 * Aqui era um campo de digitação solto no meio do cartão, e ele puxava três
 * linhas de explicação atrás de si — num cartão que já tinha conteúdo,
 * simulados, resumo e procedência. Agora mostra o número e abre o mesmo
 * pop-up das outras telas, que tem espaço para a bimestral inteira.
 *
 * Só aparece para avaliação que vale nota, e só depois que a prova passou:
 * antes não há o que anotar.
 */
export function GradeMark({
  assessmentId,
  disciplineName,
}: {
  readonly assessmentId: string;
  readonly disciplineName: string;
}) {
  const livro = useGradeBook();
  const parte = partForAssessment(assessmentId);
  if (!parte) return null;

  const nota = livro.marks[parte.partId];
  const anotada = typeof nota === "number";
  const saida = outcomeFor(parte.scheme, livro.marks, livro.ara[parte.scheme.disciplineId]);
  const frase = anotada ? orientacao(parte.scheme, saida) : null;

  return (
    <div className="border-line mt-3 border-t pt-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-sm">
          <span className="text-ink-muted">Sua nota em {parte.label.toLowerCase()}: </span>
          <span className="font-semibold tabular-nums">
            {anotada ? `${formatGrade(nota)} / ${formatGrade(parte.max)}` : "não anotada"}
          </span>
        </p>
        <GradeDialog
          disciplineId={parte.scheme.disciplineId}
          disciplineName={disciplineName}
          rotulo={anotada ? "Editar nota" : "Anotar nota"}
          variant="fantasma"
          className="ml-auto"
        />
      </div>

      {frase ? (
        <p className="text-ink-muted mt-1.5 text-sm leading-relaxed text-pretty">{frase}</p>
      ) : null}
    </div>
  );
}
