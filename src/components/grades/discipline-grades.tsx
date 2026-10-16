"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { schemeFor } from "@/lib/data/grading";
import { filledParts, formatGrade, outcomeFor, termScore } from "@/lib/domain/grading";
import { Badge, Card } from "@/components/ui/primitives";
import { useGradeBook } from "./use-grade-book";
import { situacoes } from "./situation";
import { orientacao } from "./phrases";
import { GradeDialog } from "./grade-dialog";
import { cn } from "@/lib/utils";

/**
 * As suas notas nesta matéria, na página dela.
 *
 * É aqui que a nota faz mais sentido: na mesma tela do plano, da ementa e
 * das próximas datas. A página de notas continua existindo para comparar as
 * sete de uma vez — mas quem quer anotar a prova de ontem vem pela matéria,
 * e não devia precisar sair dela.
 */
export function DisciplineGrades({
  disciplineId,
  disciplineName,
  color,
}: {
  readonly disciplineId: string;
  readonly disciplineName: string;
  readonly color: string;
}) {
  const livro = useGradeBook();
  const scheme = schemeFor(disciplineId);
  if (!scheme) return null;

  const saida = outcomeFor(scheme, livro.marks, livro.ara[disciplineId]);
  const estado = situacoes[saida.situation];
  const preenchidas = filledParts(scheme, livro.marks);
  const frase = preenchidas.done === 0 ? null : orientacao(scheme, saida);

  return (
    <Card as="section" aria-labelledby="minhas-notas" raio="hero" respiro="sm" className="mb-10">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 id="minhas-notas" className="flex items-center gap-2 text-lg font-semibold">
            <GraduationCap className="size-5 shrink-0" style={{ color }} aria-hidden="true" />
            Minhas notas
          </h2>
          <p className="text-ink-faint mt-0.5 text-xs">
            {preenchidas.done} de {preenchidas.total} avaliações anotadas · neste aparelho
          </p>
        </div>
        <GradeDialog
          disciplineId={disciplineId}
          disciplineName={disciplineName}
          rotulo={preenchidas.done === 0 ? "Anotar notas" : "Editar notas"}
          variant={preenchidas.done === 0 ? "primario" : "secundario"}
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {scheme.terms.map((term) => (
          <Quadro
            key={term.id}
            rotulo={term.id}
            valor={termScore(term, livro.marks)}
            dica={`${term.parts.length} ${term.parts.length === 1 ? "avaliação" : "avaliações"}`}
          />
        ))}
        <Quadro rotulo="Parcial" valor={saida.mp} dica="(N1 + N2) ÷ 2" destaque />
        {saida.mf !== null ? (
          <Quadro rotulo="Final" valor={saida.mf} dica="com a ARA" destaque />
        ) : (
          <div className="flex items-center">
            {preenchidas.done > 0 ? <Badge tom={estado.tom}>{estado.texto}</Badge> : null}
          </div>
        )}
      </dl>

      <p className="text-ink-muted mt-3 text-sm leading-relaxed text-pretty">
        {frase ?? (
          <>
            Ainda não há nota anotada. Quando houver, aqui aparece a média parcial e quanto falta
            para fechar 6,0.
          </>
        )}{" "}
        <Link href="/notas" className="text-primary font-medium hover:underline">
          Ver as sete matérias
        </Link>
      </p>
    </Card>
  );
}

function Quadro({
  rotulo,
  valor,
  dica,
  destaque,
}: {
  readonly rotulo: string;
  readonly valor: number | null;
  readonly dica: string;
  readonly destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card px-3 py-2.5",
        destaque ? "bg-surface-sunken" : "border-line border",
      )}
    >
      <dt className="text-ink-faint text-micro tracking-[0.12em] uppercase">{rotulo}</dt>
      <dd className="font-display mt-0.5 text-2xl leading-none font-semibold tabular-nums">
        {valor === null ? <span className="text-ink-faint text-xl">—</span> : formatGrade(valor)}
      </dd>
      <p className="text-ink-faint mt-1 text-xs">{dica}</p>
    </div>
  );
}
