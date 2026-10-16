"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { gradeSchemes } from "@/lib/data/grading";
import {
  formatGrade,
  outcomeFor,
  partMax,
  termScore,
  type GradeTerm,
  type Situation,
} from "@/lib/domain/grading";
import {
  clearGrades,
  emptyGradeBook,
  loadGrades,
  parseMark,
  setAra,
  setMark,
  type GradeBook,
} from "@/lib/grade-storage";
import { Badge, Button, Card, Notice } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * O semestre inteiro em notas.
 *
 * Lê o aparelho, então só desenha depois de montar. Cada disciplina mostra
 * as partes que o plano define, a bimestral que elas formam, a média parcial
 * e — enquanto faltar uma das duas — quanto é preciso tirar na outra.
 */

const situacao: Record<
  Situation,
  { texto: string; tom: "neutro" | "sucesso" | "acento" | "perigo" }
> = {
  incompleto: { texto: "em andamento", tom: "neutro" },
  aprovado: { texto: "aprovado", tom: "sucesso" },
  ara: { texto: "vai para a ARA", tom: "acento" },
  aprovado_na_ara: { texto: "aprovado na ARA", tom: "sucesso" },
  reprovado: { texto: "reprovado", tom: "perigo" },
};

function CampoNota({
  id,
  rotulo,
  max,
  valor,
  onMudar,
}: {
  readonly id: string;
  readonly rotulo: string;
  readonly max: number;
  readonly valor: number | undefined;
  readonly onMudar: (valor: string) => void;
}) {
  const [texto, setTexto] = useState(typeof valor === "number" ? formatGrade(valor) : "");
  const [erro, setErro] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <label htmlFor={id} className="text-ink-muted min-w-0 flex-1 text-sm">
        {rotulo}
      </label>
      <span className="inline-flex shrink-0 items-center gap-1.5">
        <input
          id={id}
          inputMode="decimal"
          value={texto}
          aria-invalid={erro}
          onChange={(e) => {
            setTexto(e.target.value);
            const vazio = e.target.value.trim() === "";
            setErro(!vazio && parseMark(e.target.value, max) === null);
            onMudar(e.target.value);
          }}
          placeholder="—"
          className={cn(
            "border-line bg-surface rounded-control min-h-9 w-16 border px-2 py-1 text-center text-sm tabular-nums",
            erro && "border-danger",
          )}
        />
        <span className="text-ink-faint w-10 text-sm tabular-nums">/ {formatGrade(max)}</span>
      </span>
    </div>
  );
}

function Bimestral({
  term,
  livro,
  geracao,
  onMudar,
}: {
  readonly term: GradeTerm;
  readonly livro: GradeBook;
  readonly geracao: number;
  readonly onMudar: (partId: string, texto: string, max: number) => void;
}) {
  const nota = termScore(term, livro.marks);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-semibold">{term.id}</h4>
        <span className="text-ink-muted text-sm tabular-nums">
          {nota === null ? "—" : formatGrade(nota)} / 10
        </span>
      </div>
      <div className="divide-line mt-1 divide-y">
        {term.parts.map((part) => (
          <CampoNota
            key={`${part.id}-${geracao}`}
            id={`nota-${part.id}`}
            rotulo={part.label}
            max={partMax(term, part)}
            valor={livro.marks[part.id]}
            onMudar={(texto) => onMudar(part.id, texto, partMax(term, part))}
          />
        ))}
      </div>
      {term.kind === "pesos" ? (
        <p className="text-ink-faint mt-1 text-xs">
          Média ponderada: {term.parts.map((p) => `${p.label} peso ${p.value}`).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

export function GradeBoard({ nomes }: { readonly nomes: Readonly<Record<string, string>> }) {
  const [livro, setLivro] = useState<GradeBook | null>(null);
  /**
   * Cada campo guarda o texto que está sendo digitado, para "7," não ser
   * recusado no meio da digitação. O preço é que ele não se refaz sozinho
   * quando a nota some por fora — ao apagar tudo, os campos continuavam
   * preenchidos. Trocar a chave remonta todos de uma vez.
   */
  const [geracao, setGeracao] = useState(0);

  useEffect(() => {
    setLivro(loadGrades());
  }, []);

  if (!livro) return null;

  const mudarParte = (partId: string, texto: string, max: number) => {
    const valor = texto.trim() === "" ? null : parseMark(texto, max);
    if (texto.trim() !== "" && valor === null) return;
    setLivro(setMark(partId, valor));
  };

  const mudarAra = (disciplineId: string, texto: string) => {
    const valor = texto.trim() === "" ? null : parseMark(texto, 10);
    if (texto.trim() !== "" && valor === null) return;
    setLivro(setAra(disciplineId, valor));
  };

  const algumaNota = Object.keys(livro.marks).length > 0 || Object.keys(livro.ara).length > 0;

  return (
    <div>
      <Notice tone="aviso" className="mb-6">
        Isto é anotação sua, guardada só neste aparelho. Não é registro acadêmico, e as fórmulas vêm
        dos planos de ensino — confira a nota oficial no portal.
      </Notice>

      <div className="grid gap-4 lg:grid-cols-2">
        {gradeSchemes.map((scheme) => {
          const saida = outcomeFor(scheme, livro.marks, livro.ara[scheme.disciplineId]);
          const estado = situacao[saida.situation];

          return (
            <Card
              key={scheme.disciplineId}
              as="section"
              aria-labelledby={`notas-${scheme.disciplineId}`}
              raio="hero"
              respiro="md"
              className="flex flex-col"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 id={`notas-${scheme.disciplineId}`} className="text-lg font-semibold">
                  {nomes[scheme.disciplineId] ?? scheme.disciplineId}
                </h3>
                <Badge tom={estado.tom}>{estado.texto}</Badge>
              </div>

              <div className="mt-4 space-y-5">
                {scheme.terms.map((term) => (
                  <Bimestral
                    key={term.id}
                    term={term}
                    livro={livro}
                    geracao={geracao}
                    onMudar={mudarParte}
                  />
                ))}
              </div>

              <dl className="border-line mt-5 flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-sm">
                <div className="flex gap-2">
                  <dt className="text-ink-muted">Média parcial</dt>
                  <dd className="font-semibold tabular-nums">
                    {saida.mp === null ? "—" : formatGrade(saida.mp)}
                  </dd>
                </div>
                {saida.mf !== null ? (
                  <div className="flex gap-2">
                    <dt className="text-ink-muted">Média final</dt>
                    <dd className="font-semibold tabular-nums">{formatGrade(saida.mf)}</dd>
                  </div>
                ) : null}
              </dl>

              {saida.needed ? (
                <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                  {saida.needed.score > 10
                    ? `A média de 6,0 já não sai pela ${saida.needed.term}: o caminho é a ARA.`
                    : saida.needed.score <= 0
                      ? `A média já está garantida, qualquer que seja a ${saida.needed.term}.`
                      : `Precisa de ${formatGrade(saida.needed.score)} na ${saida.needed.term} para fechar 6,0.`}
                </p>
              ) : null}

              {saida.situation === "ara" || saida.mf !== null ? (
                <div className="bg-accent-soft rounded-control mt-3 p-3">
                  <CampoNota
                    key={`ara-${scheme.disciplineId}-${geracao}`}
                    id={`ara-${scheme.disciplineId}`}
                    rotulo="Nota da ARA"
                    max={10}
                    valor={livro.ara[scheme.disciplineId]}
                    onMudar={(texto) => mudarAra(scheme.disciplineId, texto)}
                  />
                  <p className="text-ink-muted text-xs leading-relaxed">
                    Média final = (média parcial + ARA) ÷ 2, aprovado a partir de 5,75.
                  </p>
                </div>
              ) : null}

              <p className="text-ink-faint mt-3 text-xs">{scheme.source}</p>
            </Card>
          );
        })}
      </div>

      {algumaNota ? (
        <div className="mt-8">
          <Button
            variant="perigo"
            size="sm"
            onClick={() => {
              clearGrades();
              setLivro(emptyGradeBook);
              setGeracao((n) => n + 1);
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Apagar as notas deste aparelho
          </Button>
        </div>
      ) : null}
    </div>
  );
}
