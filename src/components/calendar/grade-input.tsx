"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { partForAssessment } from "@/lib/data/grading";
import { formatGrade, outcomeFor } from "@/lib/domain/grading";
import { loadGrades, parseMark, setMark } from "@/lib/grade-storage";

/**
 * A nota que você tirou, anotada onde a prova está.
 *
 * Só aparece para avaliação que vale nota — devolutiva e aula não têm o que
 * anotar — e só depois que a prova passou, porque antes não há nota nenhuma
 * para guardar.
 *
 * Assim que a outra bimestral também estiver preenchida, o campo responde a
 * pergunta que motivou tudo isto: quanto falta para fechar a média.
 */
export function GradeInput({
  assessmentId,
  disciplineName,
}: {
  readonly assessmentId: string;
  readonly disciplineName: string;
}) {
  const campo = useId();
  const parte = partForAssessment(assessmentId);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState(false);
  const [resumo, setResumo] = useState<string | null>(null);

  useEffect(() => {
    if (!parte) return;
    const livro = loadGrades();
    const guardada = livro.marks[parte.partId];
    if (typeof guardada === "number") setTexto(formatGrade(guardada));
    setResumo(descrever(parte, livro.marks, livro.ara));
    // `parte` vem de dados estáticos: muda só se a avaliação mudar.
  }, [parte]);

  if (!parte) return null;

  function salvar(valor: string) {
    setTexto(valor);
    if (!parte) return;
    if (valor.trim() === "") {
      const livro = setMark(parte.partId, null);
      setErro(false);
      setResumo(descrever(parte, livro.marks, livro.ara));
      return;
    }
    const nota = parseMark(valor, parte.max);
    if (nota === null) {
      setErro(true);
      return;
    }
    setErro(false);
    const livro = setMark(parte.partId, nota);
    setResumo(descrever(parte, livro.marks, livro.ara));
  }

  return (
    <div className="border-line mt-3 border-t pt-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label htmlFor={campo} className="text-ink-muted text-sm">
          Sua nota em {parte.label.toLowerCase()}
        </label>
        <span className="inline-flex items-center gap-1.5">
          <input
            id={campo}
            inputMode="decimal"
            value={texto}
            onChange={(e) => salvar(e.target.value)}
            aria-invalid={erro}
            aria-describedby={erro ? `${campo}-erro` : undefined}
            placeholder="—"
            className={`border-line bg-surface rounded-control min-h-9 w-16 border px-2 py-1 text-center text-sm tabular-nums ${
              erro ? "border-danger" : ""
            }`}
          />
          <span className="text-ink-faint text-sm tabular-nums">/ {formatGrade(parte.max)}</span>
        </span>
      </div>

      {erro ? (
        <p id={`${campo}-erro`} role="alert" className="text-danger mt-1.5 text-xs">
          Use um número de 0 a {formatGrade(parte.max)}. Vírgula vale: 4,5.
        </p>
      ) : null}

      {resumo ? (
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          {resumo}{" "}
          <Link href="/notas" className="text-primary hover:underline">
            Minhas notas
          </Link>
          .
        </p>
      ) : null}

      <p className="text-ink-faint mt-1.5 text-xs">
        Anotação sua, neste aparelho — não é registro oficial. Fórmula do{" "}
        {parte.scheme.source.toLowerCase()}, para {disciplineName}.
      </p>
    </div>
  );
}

/** A frase curta sob o campo: onde a disciplina está depois desta nota. */
function descrever(
  parte: NonNullable<ReturnType<typeof partForAssessment>>,
  marks: Readonly<Record<string, number>>,
  ara: Readonly<Record<string, number>>,
): string | null {
  const saida = outcomeFor(parte.scheme, marks, ara[parte.scheme.disciplineId]);

  if (saida.needed) {
    const falta = saida.needed.score;
    if (falta > 10) {
      return `Com esta nota, a média de 6,0 já não é alcançável pela ${saida.needed.term}: o caminho é a ARA.`;
    }
    if (falta <= 0) {
      return `A média já está garantida, qualquer que seja a ${saida.needed.term}.`;
    }
    return `Você precisa de ${formatGrade(falta)} na ${saida.needed.term} para fechar 6,0.`;
  }

  if (saida.situation === "aprovado" && saida.mp !== null) {
    return `Média parcial ${formatGrade(saida.mp)} — aprovado.`;
  }
  if (saida.situation === "ara" && saida.mp !== null) {
    return `Média parcial ${formatGrade(saida.mp)} — abaixo de 6,0, vai para a ARA.`;
  }
  if (saida.mf !== null) {
    return `Média final ${formatGrade(saida.mf)}.`;
  }
  return null;
}
