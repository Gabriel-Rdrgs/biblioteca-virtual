import type { DisciplineId, Visibility } from "./types";

/**
 * Os resumos da turma.
 *
 * São de três tipos, e a diferença não é cosmética:
 *
 * - **aula** — um encontro, com número e data. É a unidade em que a matéria
 *   acontece, e é o que se procura no dia seguinte à aula.
 * - **problema** — a unidade das matérias em tutoria (AES 1 e AES 2), que
 *   não andam por aula e sim por problema: abre numa sessão, fecha em
 *   outra, e o resumo cobre os objetivos de aprendizagem dele. Chamar isso
 *   de "aula 5" seria renomear o que a turma chama de "problema 5".
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

export interface ProblemSummary extends SummaryBase {
  readonly kind: "problema";
  /** Número do problema dentro da disciplina, como a turma o chama. */
  readonly problem: number;
  /** Abertura da tutoria, quando o resumo a registra. */
  readonly opensAt?: string;
  /** Fechamento da tutoria — a data em que o conteúdo fica completo. */
  readonly closesAt?: string;
}

export interface CycleSummary extends SummaryBase {
  readonly kind: "ciclo";
  /** Como a turma chama o ciclo: "1º bimestre", "N1". */
  readonly cycleLabel: string;
}

export type Summary = LessonSummary | ProblemSummary | CycleSummary;

export const isLesson = (summary: Summary): summary is LessonSummary => summary.kind === "aula";

export const isProblem = (summary: Summary): summary is ProblemSummary =>
  summary.kind === "problema";

/** "Aula 01" — com zero à esquerda, como no cabeçalho do próprio resumo. */
export function lessonLabel(summary: LessonSummary): string {
  return `Aula ${String(summary.lesson).padStart(2, "0")}`;
}

/** "Problema 5" — sem zero à esquerda, como o cabeçalho do resumo escreve. */
export function problemLabel(summary: ProblemSummary): string {
  return `Problema ${summary.problem}`;
}

/**
 * A etiqueta que identifica o resumo, seja ele do tipo que for.
 *
 * As telas precisavam de um `if` por tipo em quatro lugares, e cada um
 * esquecia um tipo diferente quando um novo aparecia.
 */
export function summaryLabel(summary: Summary): string {
  if (isLesson(summary)) return lessonLabel(summary);
  if (isProblem(summary)) return problemLabel(summary);
  return summary.cycleLabel;
}

/** A data que situa o resumo no semestre, quando ele tem uma. */
export function summaryDate(summary: Summary): string | undefined {
  if (isLesson(summary)) return summary.date;
  if (isProblem(summary)) return summary.closesAt ?? summary.opensAt;
  return undefined;
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
const ordem = { aula: 0, problema: 1, ciclo: 2 } as const;

export function bySequence(a: Summary, b: Summary): number {
  if (a.kind !== b.kind) return ordem[a.kind] - ordem[b.kind];
  if (a.kind === "aula" && b.kind === "aula") return a.lesson - b.lesson;
  if (a.kind === "problema" && b.kind === "problema") return a.problem - b.problem;
  return a.title.localeCompare(b.title, "pt-BR");
}
