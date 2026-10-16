import type { DisciplineId } from "./types";

/**
 * As contas de nota, como os planos de ensino as definem.
 *
 * Tudo aqui é função pura sobre números — é a parte do Atlas que não pode
 * errar, porque alguém vai decidir quanto precisa estudar com base nela.
 * As regras são as mesmas nas sete unidades:
 *
 *     MP = (N1 + N2) ÷ 2,  aprovado com MP ≥ 6,0, sem arredondamento
 *     abaixo disso, ARA:  MF = (MP + ARA) ÷ 2,  aprovado com MF ≥ 6,0
 *     o arredondamento institucional vale só para a Média Final,
 *     a partir de 5,75
 *
 * O que muda de uma disciplina para outra é só a composição de cada
 * bimestral, e isso vem de `src/lib/data/grading.ts`.
 */

/** Como as partes de uma bimestral se somam. */
export type TermKind =
  /** Cada parte vale X pontos; a nota é a soma. MAC I: 1,0 + 6,0 + 3,0. */
  | "pontos"
  /** Cada parte vale 0 a 10 com um peso; a nota é a média ponderada. IC I. */
  | "pesos";

export interface GradePart {
  readonly id: string;
  readonly label: string;
  /** A avaliação do calendário, quando esta parte tem data marcada. */
  readonly assessmentId?: string;
  /** Pontos que a parte vale, ou o peso dela, conforme o tipo. */
  readonly value: number;
}

export interface GradeTerm {
  readonly id: "N1" | "N2";
  readonly kind: TermKind;
  readonly parts: readonly GradePart[];
}

export interface GradeScheme {
  readonly disciplineId: DisciplineId;
  readonly terms: readonly GradeTerm[];
  /** Nota mínima para aprovação, na Média Parcial e na Final. */
  readonly passMark: number;
  /** A partir de quanto a Média Final é arredondada para a de aprovação. */
  readonly roundFrom: number;
  /** A página do plano de onde isto tudo foi transcrito. */
  readonly source: string;
}

/** O que a pessoa anotou: parte → nota. */
export type Marks = Readonly<Record<string, number>>;

/** A escala em que se digita a nota de uma parte. */
export const partMax = (term: GradeTerm, part: GradePart): number =>
  term.kind === "pontos" ? part.value : 10;

/**
 * A nota de uma bimestral.
 *
 * Devolve `null` enquanto faltar alguma parte: meia nota não é nota, e
 * mostrar "3,0" para quem só fez uma das três provas seria mentir.
 */
export function termScore(term: GradeTerm, marks: Marks): number | null {
  const notas = term.parts.map((part) => marks[part.id]);
  if (notas.some((nota) => typeof nota !== "number" || Number.isNaN(nota))) return null;

  if (term.kind === "pontos") {
    return (notas as number[]).reduce((soma, nota) => soma + nota, 0);
  }
  const pesoTotal = term.parts.reduce((soma, part) => soma + part.value, 0);
  if (pesoTotal === 0) return null;
  const somaPonderada = term.parts.reduce(
    (soma, part, i) => soma + (notas[i] as number) * part.value,
    0,
  );
  return somaPonderada / pesoTotal;
}

/** Quanto a bimestral já rendeu, mesmo incompleta — para a barra de progresso. */
export function termEarned(term: GradeTerm, marks: Marks): number {
  if (term.kind === "pontos") {
    return term.parts.reduce((soma, part) => soma + (marks[part.id] ?? 0), 0);
  }
  const pesoTotal = term.parts.reduce((soma, part) => soma + part.value, 0);
  if (pesoTotal === 0) return 0;
  return (
    term.parts.reduce((soma, part) => soma + (marks[part.id] ?? 0) * part.value, 0) / pesoTotal
  );
}

/** MP = (N1 + N2) ÷ 2. `null` enquanto faltar uma das duas. */
export function partialAverage(n1: number | null, n2: number | null): number | null {
  if (n1 === null || n2 === null) return null;
  return (n1 + n2) / 2;
}

/**
 * Quanto falta na outra bimestral para fechar a média.
 *
 * É a pergunta que todo mundo faz no papel. Devolve `null` quando não há o
 * que responder (as duas já saíram, ou nenhuma saiu), e pode devolver um
 * número acima de 10 — caso em que a resposta honesta é "não dá".
 */
export function neededInOther(conhecida: number, passMark: number): number {
  return passMark * 2 - conhecida;
}

/**
 * Quanto é preciso tirar na ARA para a Média Final alcançar.
 *
 * A partir de MF = (MP + ARA) ÷ 2 ≥ limite, vem ARA ≥ 2·limite − MP. O
 * limite aqui é o do arredondamento (5,75), porque é ele que decide a
 * aprovação na Média Final.
 */
export function neededInAra(mp: number, roundFrom: number): number {
  return roundFrom * 2 - mp;
}

/** MF = (MP + ARA) ÷ 2. */
export function finalAfterAra(mp: number, ara: number): number {
  return (mp + ara) / 2;
}

export type Situation =
  /** Falta nota para dizer qualquer coisa. */
  | "incompleto"
  /** MP já alcança a média. */
  | "aprovado"
  /** MP abaixo da média: vai para a ARA. */
  | "ara"
  /** Fez a ARA e a Média Final alcança. */
  | "aprovado_na_ara"
  /** Fez a ARA e não alcançou. */
  | "reprovado";

export interface GradeOutcome {
  readonly n1: number | null;
  readonly n2: number | null;
  readonly mp: number | null;
  readonly mf: number | null;
  readonly situation: Situation;
  /** Quanto falta na bimestral que ainda não saiu, quando cabe perguntar. */
  readonly needed: { readonly term: "N1" | "N2"; readonly score: number } | null;
}

/**
 * O retrato da disciplina: notas, média, situação e o que ainda falta.
 *
 * O arredondamento institucional entra só na decisão sobre a Média Final —
 * o número continua sendo o que é. O plano é explícito: "aplicando-se o
 * arredondamento institucional apenas à Média Final".
 */
export function outcomeFor(scheme: GradeScheme, marks: Marks, ara?: number | null): GradeOutcome {
  const term = (id: "N1" | "N2") => scheme.terms.find((t) => t.id === id);
  const t1 = term("N1");
  const t2 = term("N2");
  const n1 = t1 ? termScore(t1, marks) : null;
  const n2 = t2 ? termScore(t2, marks) : null;
  const mp = partialAverage(n1, n2);

  let needed: GradeOutcome["needed"] = null;
  if (n1 !== null && n2 === null)
    needed = { term: "N2", score: neededInOther(n1, scheme.passMark) };
  else if (n2 !== null && n1 === null)
    needed = { term: "N1", score: neededInOther(n2, scheme.passMark) };

  if (mp === null) {
    return { n1, n2, mp: null, mf: null, situation: "incompleto", needed };
  }

  if (mp >= scheme.passMark) {
    return { n1, n2, mp, mf: null, situation: "aprovado", needed: null };
  }

  if (typeof ara !== "number" || Number.isNaN(ara)) {
    return { n1, n2, mp, mf: null, situation: "ara", needed: null };
  }

  const mf = finalAfterAra(mp, ara);
  return {
    n1,
    n2,
    mp,
    mf,
    situation: mf >= scheme.roundFrom ? "aprovado_na_ara" : "reprovado",
    needed: null,
  };
}

/**
 * "7,5", "6,0", "5,75" — vírgula decimal e sempre ao menos uma casa.
 *
 * Nota se escreve com decimal mesmo quando é redonda: "precisa de 5,0 na N2"
 * lê como nota; "precisa de 5" lê como contagem.
 */
export function formatGrade(value: number): string {
  const arredondado = Math.round(value * 100) / 100;
  const texto = Number.isInteger(arredondado)
    ? arredondado.toFixed(1)
    : arredondado.toFixed(2).replace(/0$/, "");
  return texto.replace(".", ",");
}
