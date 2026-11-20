/**
 * Quando cada cartão volta.
 *
 * Caixas de Leitner, que dá para explicar em uma frase: acertou, o cartão
 * sobe uma caixa e demora mais para voltar; errou, volta para a primeira.
 * Algoritmos mais finos (SM-2, FSRS) acertam o intervalo com mais
 * precisão, mas pedem uma nota de 0 a 5 que ninguém dá com honestidade às
 * onze da noite. Três botões — errei, quase, sei — são o que se usa.
 *
 * Tudo aqui é puro: recebe o estado e a hora, devolve o estado novo.
 */

export type Grade = "errei" | "quase" | "sei";

export interface CardReview {
  /** 0 = aprendendo; 5 = guardado há muito tempo. */
  readonly box: number;
  /** Quando volta, em ISO. */
  readonly due: string;
  readonly reviews: number;
  readonly lapses: number;
  readonly last: Grade;
  readonly lastAt: string;
}

/** Dias até a próxima revisão, por caixa. */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35] as const;
export const MAX_BOX = BOX_INTERVAL_DAYS.length - 1;

/** A partir desta caixa o cartão conta como dominado. */
export const MASTERED_BOX = 3;

const DAY_MS = 86_400_000;

function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

export function review(previous: CardReview | undefined, grade: Grade, now: Date): CardReview {
  const box = previous?.box ?? 0;
  let next: number;
  let due: string;

  if (grade === "errei") {
    next = 0;
    due = now.toISOString();
  } else if (grade === "quase") {
    // Lembrou com esforço: não sobe, mas também não volta ao começo.
    next = Math.max(1, Math.min(box, MAX_BOX));
    due = addDays(now, 1);
  } else {
    next = Math.min(box + 1, MAX_BOX);
    due = addDays(now, BOX_INTERVAL_DAYS[next] ?? 1);
  }

  return {
    box: next,
    due,
    reviews: (previous?.reviews ?? 0) + 1,
    lapses: (previous?.lapses ?? 0) + (grade === "errei" && previous ? 1 : 0),
    last: grade,
    lastAt: now.toISOString(),
  };
}

export type CardStatus = "novo" | "aprendendo" | "revisar" | "dominado";

export function cardStatus(state: CardReview | undefined, now: Date): CardStatus {
  if (!state) return "novo";
  if (state.box >= MASTERED_BOX && state.due > now.toISOString()) return "dominado";
  if (state.due <= now.toISOString()) return "revisar";
  return "aprendendo";
}

export function isDue(state: CardReview | undefined, now: Date): boolean {
  return Boolean(state && state.due <= now.toISOString());
}

export interface DeckCounts {
  readonly total: number;
  readonly novos: number;
  readonly revisar: number;
  readonly aprendendo: number;
  readonly dominados: number;
}

export function countDeck(
  cardIds: readonly string[],
  states: Readonly<Record<string, CardReview>>,
  now: Date,
): DeckCounts {
  let novos = 0;
  let revisar = 0;
  let aprendendo = 0;
  let dominados = 0;
  for (const id of cardIds) {
    const status = cardStatus(states[id], now);
    if (status === "novo") novos++;
    else if (status === "revisar") revisar++;
    else if (status === "aprendendo") aprendendo++;
    else dominados++;
  }
  return { total: cardIds.length, novos, revisar, aprendendo, dominados };
}

export interface QueueOptions {
  /** Só o que está vencido e o que nunca foi visto. */
  readonly onlyPending?: boolean;
  /** Ordem aleatória (dentro de cada grupo). */
  readonly shuffle?: boolean;
  /** Quantos cartões novos entram numa sessão. */
  readonly newLimit?: number;
  /** Aleatoriedade injetável, para os testes. */
  readonly random?: () => number;
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * A fila de uma sessão.
 *
 * Primeiro o que venceu (o mais atrasado na frente), depois os novos, e só
 * então — se a pessoa não pediu "só pendentes" — o resto, para quem quer
 * passar o baralho inteiro de novo antes da prova.
 */
export function buildQueue(
  cardIds: readonly string[],
  states: Readonly<Record<string, CardReview>>,
  now: Date,
  options: QueueOptions = {},
): string[] {
  const random = options.random ?? Math.random;
  const due = cardIds
    .filter((id) => isDue(states[id], now))
    .sort((a, b) => states[a]!.due.localeCompare(states[b]!.due));
  const fresh = cardIds.filter((id) => !states[id]);
  const limitedFresh =
    options.newLimit !== undefined ? fresh.slice(0, Math.max(0, options.newLimit)) : fresh;
  const rest = cardIds.filter((id) => states[id] && !isDue(states[id], now));

  const order = (list: readonly string[]) =>
    options.shuffle ? shuffled(list, random) : [...list];

  return [
    ...order(due),
    ...order(limitedFresh),
    ...(options.onlyPending ? [] : order(rest)),
  ];
}

/**
 * Onde um cartão reaparece na mesma sessão depois de uma nota ruim: errou,
 * volta logo (daqui a 4); quase, um pouco depois (daqui a 8). Acertou, sai.
 */
export function requeueOffset(grade: Grade): number | null {
  if (grade === "errei") return 4;
  if (grade === "quase") return 8;
  return null;
}

export function requeue(queue: readonly string[], index: number, grade: Grade): string[] {
  const offset = requeueOffset(grade);
  const current = queue[index];
  if (offset === null || current === undefined) return [...queue];
  const at = Math.min(index + 1 + offset, queue.length);
  return [...queue.slice(0, at), current, ...queue.slice(at)];
}
