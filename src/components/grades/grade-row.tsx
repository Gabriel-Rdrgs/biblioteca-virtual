"use client";

import Link from "next/link";
import { filledParts, formatGrade, outcomeFor, type GradeScheme } from "@/lib/domain/grading";
import { Badge } from "@/components/ui/primitives";
import { useGradeBook } from "./use-grade-book";
import { situacoes } from "./situation";
import { orientacao } from "./phrases";
import { GradeDialog } from "./grade-dialog";
import { cn } from "@/lib/utils";

/**
 * Uma disciplina em notas, para ler de relance.
 *
 * Aqui não se digita nada: são as duas bimestrais, a média e a frase do que
 * falta. Digitar é tarefa de outro momento, e mora no pop-up — o que esta
 * linha precisa é caber em uma olhada e dizer se há algo a fazer.
 */

function Numero({
  rotulo,
  valor,
  destaque,
}: {
  readonly rotulo: string;
  readonly valor: number | null;
  readonly destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-ink-faint text-xs tracking-wide uppercase">{rotulo}</dt>
      <dd
        className={cn(
          "tabular-nums",
          valor === null ? "text-ink-faint" : destaque ? "font-display text-lg font-semibold" : "font-medium",
        )}
      >
        {valor === null ? "—" : formatGrade(valor)}
      </dd>
    </div>
  );
}

export function GradeRow({
  scheme,
  name,
  shortName,
  color,
  href,
}: {
  readonly scheme: GradeScheme;
  readonly name: string;
  readonly shortName: string;
  readonly color: string;
  /** A página da matéria, quando faz sentido ir até lá daqui. */
  readonly href?: string;
}) {
  const livro = useGradeBook();
  const saida = outcomeFor(scheme, livro.marks, livro.ara[scheme.disciplineId]);
  const estado = situacoes[saida.situation];
  const preenchidas = filledParts(scheme, livro.marks);
  const frase = preenchidas.done === 0 ? null : orientacao(scheme, saida);

  return (
    <li className="border-line bg-surface rounded-card relative overflow-hidden border">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: color }}
      />
      {/*
        No celular o botão desce para a própria linha: ao lado do título ele
        espremia o nome da matéria em três linhas.
      */}
      <div className="flex flex-col gap-3 py-3.5 pr-3.5 pl-5 sm:flex-row sm:items-start sm:gap-4 sm:py-4 sm:pr-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="leading-snug font-semibold">
              {href ? (
                <Link href={href} className="hover:text-primary hover:underline">
                  {name}
                </Link>
              ) : (
                name
              )}
            </h3>
            <span className="text-ink-faint text-xs">{shortName}</span>
            {preenchidas.done > 0 ? <Badge tom={estado.tom}>{estado.texto}</Badge> : null}
          </div>

          <dl className="mt-1.5 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
            <Numero rotulo="N1" valor={saida.n1} />
            <Numero rotulo="N2" valor={saida.n2} />
            <Numero rotulo="Parcial" valor={saida.mp} destaque />
            {saida.mf !== null ? <Numero rotulo="Final" valor={saida.mf} destaque /> : null}
          </dl>

          <p className="text-ink-muted mt-1.5 text-sm leading-relaxed text-pretty">
            {frase ?? semNota(preenchidas)}
          </p>
        </div>

        <GradeDialog
          disciplineId={scheme.disciplineId}
          disciplineName={name}
          rotulo={preenchidas.done === 0 ? "Anotar notas" : "Editar notas"}
          className="shrink-0 self-start"
        />
      </div>
    </li>
  );
}

/**
 * O que dizer quando ainda não há conta a fazer.
 *
 * A linha dizia "nenhuma nota anotada" também para quem tinha anotado uma
 * e esperava a bimestral fechar — e via a etiqueta "em andamento" logo
 * acima, contradizendo a frase.
 */
function semNota({ done, total }: { readonly done: number; readonly total: number }): string {
  if (done === 0) {
    return `Nenhuma nota anotada — são ${total} avaliações no semestre, entre as duas bimestrais.`;
  }
  return `${done} de ${total} avaliações anotadas. A bimestral só fecha quando todas as partes dela tiverem nota.`;
}
