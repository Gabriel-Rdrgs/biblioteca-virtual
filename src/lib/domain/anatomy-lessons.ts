import type { AnatomyData, AnatomyStructure } from "./anatomy-types";

/**
 * Lições e revisão espaçada da anatomia 3D.
 *
 * Uma lição tem até sete músculos de uma região, do mais fácil ao mais
 * difícil, superficiais antes dos profundos. Passa por eles três vezes:
 * digitando com o nome à vista, só com a primeira letra e, por fim, de
 * memória olhando o outro lado do corpo. Só a terceira rodada conta.
 *
 * Cada resposta de memória entra na revisão espaçada: acertou, o músculo
 * volta em 1, 3, 7, 14 e 30 dias; errou, volta hoje mesmo.
 */

export const LESSON_SIZE = 7;
export const LESSON_PASS = 0.8;
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;
const DAY = 86_400_000;
const MAX_HISTORY = 20;

export interface Lesson {
  /** "cabeca-pescoco-L1" */
  readonly id: string;
  readonly region: string;
  readonly number: number;
  readonly title: string;
  readonly muscleIds: readonly string[];
}

/** Entra em lição e desafio: músculo com ficha completa e peça no modelo. */
export function isTrainable(s: AnatomyStructure): boolean {
  const f = s.ficha;
  return (
    s.kind === "muscle" &&
    s.parts.length > 0 &&
    !!f &&
    [f.origin, f.insertion, f.action, f.innervation, f.clue, f.explanation].every(
      (t) => typeof t === "string" && t.trim().length > 0,
    )
  );
}

export function buildLessons(data: AnatomyData): Lesson[] {
  const lessons: Lesson[] = [];
  for (const region of data.regions) {
    const pool = data.structures
      .map((s, order) => ({ s, order }))
      .filter(({ s }) => s.region === region.id && isTrainable(s))
      .sort(
        (a, b) =>
          (a.s.ficha?.difficulty ?? 3) - (b.s.ficha?.difficulty ?? 3) ||
          Number(a.s.layer === "deep") - Number(b.s.layer === "deep") ||
          a.order - b.order,
      )
      .map(({ s }) => s.id);
    if (pool.length === 0) continue;
    // Divide por igual: 29 músculos viram 6+6+6+6+5, não 7+7+7+7+1.
    const count = Math.ceil(pool.length / LESSON_SIZE);
    const per = Math.ceil(pool.length / count);
    for (let i = 0; i < count; i++) {
      lessons.push({
        id: `${region.id}-L${i + 1}`,
        region: region.id,
        number: i + 1,
        title: `${region.name} · L${i + 1}`,
        muscleIds: pool.slice(i * per, (i + 1) * per),
      });
    }
  }
  return lessons;
}

/* ------------------------------------------------- revisão espaçada */

export interface ReviewCard {
  readonly seen: number;
  readonly correct: number;
  /** Acertos seguidos em dia de revisão. */
  readonly reps: number;
  readonly intervalDays: number;
  /** Quando volta, em ms. */
  readonly due: number;
  readonly lapses: number;
  readonly history: readonly { readonly t: number; readonly ok: boolean }[];
}

export type CardStatus = "new" | "learning" | "consolidating" | "mastered";

export const STATUS_LABELS: Record<CardStatus, string> = {
  new: "Novo",
  learning: "Aprendendo",
  consolidating: "Consolidando",
  mastered: "Dominado",
};

function endOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function isDue(card: ReviewCard | undefined, now: number): boolean {
  return !!card && card.seen > 0 && card.due <= endOfDay(now);
}

/**
 * Registra uma resposta de memória. Acertar antes da hora não adianta a
 * revisão (só conta acerto); errar sempre faz voltar hoje.
 */
export function scheduleAnswer(card: ReviewCard | undefined, ok: boolean, now: number): ReviewCard {
  const prev: ReviewCard = card ?? {
    seen: 0,
    correct: 0,
    reps: 0,
    intervalDays: 0,
    due: now,
    lapses: 0,
    history: [],
  };
  const history = [...prev.history, { t: now, ok }].slice(-MAX_HISTORY);
  if (!ok) {
    return {
      ...prev,
      seen: prev.seen + 1,
      reps: 0,
      intervalDays: 0,
      due: now,
      lapses: prev.lapses + (prev.seen > 0 ? 1 : 0),
      history,
    };
  }
  const counts = prev.seen === 0 || isDue(prev, now);
  if (!counts) return { ...prev, seen: prev.seen + 1, correct: prev.correct + 1, history };
  const reps = prev.reps + 1;
  const last = REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1] ?? 30;
  const intervalDays =
    REVIEW_INTERVALS[reps - 1] ?? Math.round(Math.max(prev.intervalDays, last) * 1.5);
  return {
    ...prev,
    seen: prev.seen + 1,
    correct: prev.correct + 1,
    reps,
    intervalDays,
    due: now + intervalDays * DAY,
    history,
  };
}

export function cardStatus(card: ReviewCard | undefined): CardStatus {
  if (!card || card.seen === 0) return "new";
  if (card.intervalDays >= 14) return "mastered";
  if (card.intervalDays >= 3) return "consolidating";
  return "learning";
}

export function dueIds(cards: Readonly<Record<string, ReviewCard>>, now: number): string[] {
  return Object.entries(cards)
    .filter(([, card]) => isDue(card, now))
    .sort(([, a], [, b]) => a.due - b.due)
    .map(([id]) => id);
}

export function lessonMastered(best: number | undefined): boolean {
  return (best ?? 0) >= LESSON_PASS;
}

/** Embaralha (Fisher–Yates) com um gerador injetável, para o teste. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}
