"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  filledParts,
  formatGrade,
  neededInAra,
  outcomeFor,
  partIdsOf,
  partMax,
  termScore,
  type GradeScheme,
  type GradeTerm,
} from "@/lib/domain/grading";
import { clearDiscipline, parseMark, setAra, setMark, type GradeBook } from "@/lib/grade-storage";
import { Badge, Button } from "@/components/ui/primitives";
import { useGradeBook } from "./use-grade-book";
import { situacoes } from "./situation";
import { orientacao } from "./phrases";
import { cn } from "@/lib/utils";

/**
 * Onde a nota se escreve: uma disciplina por vez.
 *
 * Antes isto era uma página com as sete lado a lado — o que obrigava a
 * procurar a sua matéria numa grade de catorze bimestrais para anotar uma
 * prova. Agora a folha é de uma só, e ela abre de onde a pergunta nasce: da
 * matéria, do cartão da prova no calendário, do painel de notas.
 *
 * A folha não tem botão de salvar, de propósito. Nota é um número por campo:
 * confirmar cada um seria cerimônia sem função, e um "salvar" esquecido
 * perderia a anotação.
 */

function CampoNota({
  id,
  rotulo,
  contexto,
  max,
  valor,
  onMudar,
}: {
  readonly id: string;
  readonly rotulo: string;
  /**
   * A bimestral a que a parte pertence. As duas têm partes de mesmo nome —
   * "prova teórica" aparece na N1 e na N2 —, e quem navega por campos de
   * formulário ouviria o mesmo rótulo duas vezes sem saber qual é qual.
   */
  readonly contexto?: string;
  readonly max: number;
  readonly valor: number | undefined;
  readonly onMudar: (valor: string) => void;
}) {
  /**
   * O campo guarda o texto em digitação para "7," não ser recusado no meio
   * da palavra. Por isso ele não se refaz quando a nota muda por fora — quem
   * apaga tudo remonta os campos com uma chave nova.
   */
  const [texto, setTexto] = useState(typeof valor === "number" ? formatGrade(valor) : "");
  const [erro, setErro] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label htmlFor={id} className="text-ink-muted min-w-0 flex-1 text-sm leading-snug">
        {rotulo}
      </label>
      <span className="inline-flex shrink-0 items-center gap-1.5">
        <input
          id={id}
          inputMode="decimal"
          value={texto}
          {...(contexto ? { "aria-label": `${rotulo} na ${contexto}` } : {})}
          aria-invalid={erro}
          onChange={(e) => {
            setTexto(e.target.value);
            const vazio = e.target.value.trim() === "";
            setErro(!vazio && parseMark(e.target.value, max) === null);
            onMudar(e.target.value);
          }}
          placeholder="—"
          /* 16px no celular: abaixo disso o Safari dá zoom ao focar. */
          className={cn(
            "border-line bg-surface rounded-control focus:border-primary min-h-11 w-16 border px-2 py-1 text-center text-base tabular-nums",
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
    <section aria-labelledby={`bim-${term.id}`}>
      <div className="border-line flex items-baseline justify-between gap-3 border-b pb-1.5">
        <h3 id={`bim-${term.id}`} className="text-sm font-semibold">
          {term.id}
        </h3>
        <span
          className={cn("text-sm tabular-nums", nota === null ? "text-ink-faint" : "font-semibold")}
        >
          {nota === null ? "incompleta" : `${formatGrade(nota)} / 10`}
        </span>
      </div>
      <div className="divide-line mt-1 divide-y">
        {term.parts.map((part) => (
          <CampoNota
            key={`${part.id}-${geracao}`}
            id={`nota-${part.id}`}
            rotulo={part.label}
            contexto={term.id}
            max={partMax(term, part)}
            valor={livro.marks[part.id]}
            onMudar={(texto) => onMudar(part.id, texto, partMax(term, part))}
          />
        ))}
      </div>
      {term.kind === "pesos" ? (
        <p className="text-ink-faint mt-1.5 text-xs leading-relaxed">
          Média ponderada:{" "}
          {term.parts.map((p) => `${p.label.toLowerCase()} peso ${p.value}`).join(", ")}.
        </p>
      ) : null}
    </section>
  );
}

export function GradeSheet({
  scheme,
  disciplineName,
}: {
  readonly scheme: GradeScheme;
  readonly disciplineName: string;
}) {
  const livro = useGradeBook();
  const [geracao, setGeracao] = useState(0);

  const saida = outcomeFor(scheme, livro.marks, livro.ara[scheme.disciplineId]);
  const estado = situacoes[saida.situation];
  const frase = orientacao(scheme, saida);
  const preenchidas = filledParts(scheme, livro.marks);

  const mudarParte = (partId: string, texto: string, max: number) => {
    const valor = texto.trim() === "" ? null : parseMark(texto, max);
    if (texto.trim() !== "" && valor === null) return;
    setMark(partId, valor);
  };

  const mudarAra = (texto: string) => {
    const valor = texto.trim() === "" ? null : parseMark(texto, 10);
    if (texto.trim() !== "" && valor === null) return;
    setAra(scheme.disciplineId, valor);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tom={estado.tom}>{estado.texto}</Badge>
        <span className="text-ink-faint text-xs tabular-nums">
          {preenchidas.done} de {preenchidas.total} avaliações anotadas
        </span>
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

      <dl className="bg-surface-sunken rounded-card mt-5 flex flex-wrap gap-x-6 gap-y-1 p-3 text-sm">
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

      {frase ? <p className="mt-2.5 text-sm leading-relaxed font-medium">{frase}</p> : null}

      {saida.situation === "ara" || saida.mf !== null ? (
        <div className="bg-accent-soft rounded-card mt-3 p-3">
          <CampoNota
            key={`ara-${scheme.disciplineId}-${geracao}`}
            id={`ara-${scheme.disciplineId}`}
            rotulo="Nota da ARA"
            max={10}
            valor={livro.ara[scheme.disciplineId]}
            onMudar={mudarAra}
          />
          <p className="text-ink-muted mt-1 text-xs leading-relaxed">
            {saida.mp !== null && saida.mf === null ? (
              <span className="text-accent font-semibold">
                {neededInAra(saida.mp, scheme.roundFrom) > 10
                  ? "Nem 10,0 na ARA fecharia a média final. "
                  : `Precisa de ${formatGrade(neededInAra(saida.mp, scheme.roundFrom))} na ARA. `}
              </span>
            ) : null}
            Média final = (média parcial + ARA) ÷ 2, aprovado a partir de 5,75.
          </p>
        </div>
      ) : null}

      <p className="text-ink-faint mt-4 text-xs leading-relaxed">
        Anotação sua, guardada só neste aparelho — não é registro acadêmico. A composição das notas
        vem do {scheme.source}.
      </p>

      {preenchidas.done > 0 ? (
        <Button
          variant="fantasma"
          size="sm"
          className="mt-3 -ml-2"
          onClick={() => {
            clearDiscipline(scheme.disciplineId, partIdsOf(scheme));
            setGeracao((n) => n + 1);
          }}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Apagar as notas de {disciplineName}
        </Button>
      ) : null}
    </div>
  );
}
