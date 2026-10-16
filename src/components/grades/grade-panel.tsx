"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { gradeSchemes } from "@/lib/data/grading";
import { formatGrade, semesterOverview } from "@/lib/domain/grading";
import { clearGrades } from "@/lib/grade-storage";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { useGradeBook } from "./use-grade-book";
import { GradeRow } from "./grade-row";

/**
 * O semestre inteiro em notas.
 *
 * O mesmo painel serve a página de notas e a aba Notas do calendário — é a
 * mesma pergunta nos dois lugares ("onde estou?"), e duas versões dela
 * divergiriam na primeira correção.
 *
 * A ressalva de que isto é anotação pessoal ficava num aviso que ocupava a
 * primeira tela antes de qualquer matéria. Ela continua escrita, e também
 * dentro do pop-up onde a nota se digita, mas como letra miúda no pé: quem
 * abre esta tela quer ver a sua média, não ser advertido.
 */

export interface GradeDiscipline {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly color: string;
  readonly slug?: string;
}

export function GradePanel({
  disciplinas,
  comLinks = true,
}: {
  readonly disciplinas: readonly GradeDiscipline[];
  /** Fora da página de notas, o nome da matéria leva à matéria. */
  readonly comLinks?: boolean;
}) {
  const livro = useGradeBook();

  const linhas = disciplinas
    .map((disciplina) => ({
      disciplina,
      scheme: gradeSchemes.find((s) => s.disciplineId === disciplina.id),
    }))
    .filter(
      (linha): linha is { disciplina: GradeDiscipline; scheme: (typeof gradeSchemes)[number] } =>
        linha.scheme !== undefined,
    );

  const visao = semesterOverview(
    linhas.map((linha) => linha.scheme),
    livro.marks,
    livro.ara,
  );

  if (linhas.length === 0) {
    return (
      <p className="text-ink-muted glass rounded-panel p-5 text-sm leading-relaxed">
        Nenhuma das matérias filtradas tem a composição de notas transcrita do plano de ensino.
      </p>
    );
  }

  return (
    <div>
      {visao.started > 0 ? (
        <Card raio="hero" respiro="sm" className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <p className="text-ink-faint text-micro tracking-[0.12em] uppercase">
              Média do semestre
            </p>
            <p className="font-display mt-0.5 text-3xl leading-none font-semibold tabular-nums">
              {visao.media === null ? "—" : formatGrade(visao.media)}
            </p>
            <p className="text-ink-faint mt-1 text-xs leading-relaxed">
              {visao.media === null
                ? "nenhuma matéria com as duas bimestrais fechadas"
                : `de ${visao.aprovadas + visao.naAra + visao.reprovadas} ${
                    visao.aprovadas + visao.naAra + visao.reprovadas === 1
                      ? "matéria com as duas bimestrais"
                      : "matérias com as duas bimestrais"
                  }`}
            </p>
          </div>

          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-ink-muted">Aprovadas</dt>
              <dd>
                <Badge tom="sucesso">{visao.aprovadas}</Badge>
              </dd>
            </div>
            {visao.naAra > 0 ? (
              <div className="flex items-center gap-2">
                <dt className="text-ink-muted">Na ARA</dt>
                <dd>
                  <Badge tom="acento">{visao.naAra}</Badge>
                </dd>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <dt className="text-ink-muted">Anotando</dt>
              <dd>
                <Badge tom="neutro">
                  {visao.started} de {visao.total}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>
      ) : (
        <p className="text-ink-muted glass rounded-panel mb-4 p-4 text-sm leading-relaxed text-pretty">
          Anote o que tirou em qualquer avaliação e a conta aparece aqui: a nota da bimestral, a
          média parcial e quanto falta na outra para fechar 6,0. As fórmulas são as dos planos de
          ensino, uma por matéria.
        </p>
      )}

      <ul aria-label="Notas por matéria" className="space-y-2.5">
        {linhas.map(({ disciplina, scheme }) => (
          <GradeRow
            key={disciplina.id}
            scheme={scheme}
            name={disciplina.name}
            shortName={disciplina.shortName}
            color={disciplina.color}
            {...(comLinks && disciplina.slug ? { href: `/disciplinas/${disciplina.slug}` } : {})}
          />
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-faint max-w-lg text-xs leading-relaxed">
          Anotação sua, guardada só neste aparelho — não é registro acadêmico. Confira a nota
          oficial no portal; as fórmulas vêm dos planos de ensino de 2026.2.
        </p>
        {visao.started > 0 ? <ApagarTudo /> : null}
      </div>
    </div>
  );
}

/**
 * Apagar as notas do semestre, em dois toques.
 *
 * Não há desfazer: o que se apaga aqui foi digitado à mão, prova por prova.
 * Então o primeiro toque só pergunta, e a pergunta se cancela sozinha ao
 * clicar fora do botão — perder a digitação de um semestre por um toque
 * errado seria a pior falha desta tela.
 */
function ApagarTudo() {
  const [perguntando, setPerguntando] = useState(false);

  if (!perguntando) {
    return (
      <Button variant="fantasma" size="sm" onClick={() => setPerguntando(true)}>
        <Trash2 className="size-4" aria-hidden="true" />
        Apagar tudo
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        variant="perigo"
        size="sm"
        onClick={() => {
          clearGrades();
          setPerguntando(false);
        }}
      >
        Apagar todas as notas
      </Button>
      <Button variant="fantasma" size="sm" onClick={() => setPerguntando(false)}>
        Cancelar
      </Button>
    </span>
  );
}
