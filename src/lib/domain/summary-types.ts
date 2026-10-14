import type { DisciplineId, Visibility } from "./types";

/**
 * Os resumos da turma.
 *
 * São de dois tipos, e a diferença não é cosmética:
 *
 * - **aula** — um encontro, com número e data. É a unidade em que a matéria
 *   acontece, e é o que se procura no dia seguinte à aula.
 * - **ciclo** — o apanhado de uma avaliação inteira ("resumo para a N1 de
 *   AES 2"). Não tem data de aula porque não é uma aula: é a véspera.
 *
 * O campo que faz o resumo valer mais que um PDF solto é `axisIds`. Ele liga
 * a aula aos eixos do banco de questões, então um erro no simulado pode
 * apontar para o resumo que explica aquilo — do mesmo jeito que
 * `study-references` aponta para o capítulo do livro.
 */

export type SummaryId = string;

interface SummaryBase {
  readonly id: SummaryId;
  readonly slug: string;
  readonly disciplineId: DisciplineId;
  readonly title: string;
  /** O que o resumo cobre, um tema por linha, como ele mesmo se divide. */
  readonly topics: readonly string[];
  /** Áreas do banco de questões que esta matéria alimenta. */
  readonly areaIds: readonly string[];
  /** Eixos cobertos — é daqui que sai "errou isto, leia aquilo". */
  readonly axisIds: readonly string[];
  /** As avaliações em que este conteúdo cai. */
  readonly assessmentIds: readonly string[];
  /** Arquivo em storage/resumos. */
  readonly pdfPath: string;
  readonly pages: number;
  readonly addedAt: string;
  readonly visibility: Visibility;
  readonly origin: "seed" | "admin";
  /** De onde veio o conteúdo, para nada aqui parecer ter caído do céu. */
  readonly source?: string;
}

export interface LessonSummary extends SummaryBase {
  readonly kind: "aula";
  /** Número da aula dentro da disciplina, como o resumo se identifica. */
  readonly lesson: number;
  /** Data da aula, não a da publicação. */
  readonly date: string;
  /** "Encontro 3", quando o cronograma numera os encontros à parte. */
  readonly meeting?: number;
}

export interface CycleSummary extends SummaryBase {
  readonly kind: "ciclo";
  /** Como a turma chama o ciclo: "1º bimestre", "N1". */
  readonly cycleLabel: string;
}

export type Summary = LessonSummary | CycleSummary;

export const isLesson = (summary: Summary): summary is LessonSummary => summary.kind === "aula";

/** "Aula 01" — com zero à esquerda, como no cabeçalho do próprio resumo. */
export function lessonLabel(summary: LessonSummary): string {
  return `Aula ${String(summary.lesson).padStart(2, "0")}`;
}

/** "11/08" — a data da aula, curta, que é como a turma se refere a ela. */
export function lessonDayLabel(date: string): string {
  const [, mes, dia] = date.split("-");
  return dia && mes ? `${dia}/${mes}` : date;
}

/**
 * Ordena como o semestre anda: as aulas por número, e o resumo de ciclo
 * depois delas, porque é o fechamento.
 */
export function bySequence(a: Summary, b: Summary): number {
  if (a.kind !== b.kind) return a.kind === "aula" ? -1 : 1;
  if (a.kind === "aula" && b.kind === "aula") return a.lesson - b.lesson;
  return a.title.localeCompare(b.title, "pt-BR");
}
