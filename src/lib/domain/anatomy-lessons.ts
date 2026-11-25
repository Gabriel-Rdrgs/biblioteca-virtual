import type { AnatomyData, AnatomyStructure, LandmarkIndex } from "./anatomy-types";

/**
 * Lições e revisão espaçada da anatomia 3D.
 *
 * As lições seguem a ordem em que se estuda uma região num atlas: primeiro
 * os ossos, depois os acidentes ósseos (onde os músculos se prendem), depois
 * os músculos superficiais e, por fim, os profundos. Cada etapa é dividida
 * em lições de até sete itens, do mais fácil ao mais difícil.
 *
 * Uma lição passa pelos mesmos itens três vezes: digitando com o nome à
 * vista, só com a primeira letra e, por fim, de memória olhando o outro lado
 * do corpo. Só a terceira rodada conta.
 *
 * Cada resposta de memória entra na revisão espaçada: acertou, volta em 1, 3,
 * 7, 14 e 30 dias; errou, volta hoje mesmo.
 */

export const LESSON_SIZE = 7;
export const LESSON_PASS = 0.8;
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;
const DAY = 86_400_000;
const MAX_HISTORY = 20;

/** O que se treina: um músculo, um osso ou um acidente ósseo. */
export type ItemKind = "muscle" | "bone" | "landmark";

/** As etapas de cada região, na ordem em que aparecem. */
export type LessonTrack = "ossos" | "acidentes" | "superficiais" | "profundos";

export const TRACKS: readonly {
  readonly id: LessonTrack;
  readonly label: string;
  readonly kind: ItemKind;
  /** Uma linha sobre o que a etapa ensina. */
  readonly hint: string;
}[] = [
  { id: "ossos", label: "Ossos", kind: "bone", hint: "O esqueleto da região, osso por osso." },
  { id: "acidentes", label: "Acidentes ósseos", kind: "landmark", hint: "Os pontos do osso onde os músculos se prendem." },
  { id: "superficiais", label: "Músculos superficiais", kind: "muscle", hint: "Os que se veem logo abaixo da pele." },
  { id: "profundos", label: "Músculos profundos", kind: "muscle", hint: "Os que ficam embaixo dos superficiais." },
];

export function trackOf(id: LessonTrack) {
  return TRACKS.find((t) => t.id === id) ?? TRACKS[0]!;
}

export interface Lesson {
  /** "coxa-ossos-1", "coxa-superficiais-2" */
  readonly id: string;
  readonly region: string;
  readonly track: LessonTrack;
  readonly kind: ItemKind;
  /** Posição dentro da etapa (1, 2…) e quantas lições a etapa tem. */
  readonly number: number;
  readonly of: number;
  /** "Coxa · Músculos superficiais 2" */
  readonly title: string;
  /** "Músculos superficiais 2" — o título dentro da página da região. */
  readonly short: string;
  /** Ids dos itens: estruturas (músculo, osso) ou acidentes. */
  readonly itemIds: readonly string[];
}

const filled = (texts: readonly (string | undefined)[]) =>
  texts.every((t) => typeof t === "string" && t.trim().length > 0);

/** Entra em lição: músculo ou osso com ficha completa e peça no modelo. */
export function isTrainable(s: AnatomyStructure): boolean {
  if (s.parts.length === 0) return false;
  if (s.kind === "muscle" && s.ficha) {
    const f = s.ficha;
    return filled([f.origin, f.insertion, f.action, f.innervation, f.clue, f.explanation]);
  }
  if (s.kind === "bone" && s.bone) {
    const b = s.bone;
    return filled([b.location, b.articulations, b.clue, b.explanation]);
  }
  return false;
}

/** A dica e a explicação que o treino mostra, de músculo ou de osso. */
export function trainingText(s: AnatomyStructure): { clue: string; explanation: string } | null {
  const card = s.ficha ?? s.bone;
  return card ? { clue: card.clue, explanation: card.explanation } : null;
}

/**
 * Divide por igual, no menor número de lições de até `size` itens: 29 viram
 * 6+6+6+6+5 e 31 viram 7+6+6+6+6 — nunca uma lição de sobra com dois.
 */
export function chunk<T>(items: readonly T[], size = LESSON_SIZE): T[][] {
  if (items.length === 0) return [];
  const count = Math.ceil(items.length / size);
  const base = Math.floor(items.length / count);
  const extra = items.length % count;
  const out: T[][] = [];
  let start = 0;
  for (let i = 0; i < count; i++) {
    const n = base + (i < extra ? 1 : 0);
    out.push(items.slice(start, start + n));
    start += n;
  }
  return out;
}

const difficulty = (s: AnatomyStructure) => (s.ficha ?? s.bone)?.difficulty ?? 3;

export function buildLessons(data: AnatomyData, landmarks: LandmarkIndex = {}): Lesson[] {
  const lessons: Lesson[] = [];
  for (const region of data.regions) {
    const here = data.structures
      .map((s, order) => ({ s, order }))
      .filter(({ s }) => s.region === region.id && isTrainable(s));
    const sorted = (pick: (s: AnatomyStructure) => boolean) =>
      here
        .filter(({ s }) => pick(s))
        .sort((a, b) => difficulty(a.s) - difficulty(b.s) || a.order - b.order)
        .map(({ s }) => s.id);

    const bones = sorted((s) => s.kind === "bone");
    const pools: Record<LessonTrack, string[]> = {
      ossos: bones,
      // Acidentes na ordem dos ossos, para cada lição girar em torno de poucos ossos.
      acidentes: bones.flatMap((id) => (landmarks[id] ?? []).map((m) => m.id)),
      superficiais: sorted((s) => s.kind === "muscle" && s.layer === "superficial"),
      profundos: sorted((s) => s.kind === "muscle" && s.layer === "deep"),
    };

    for (const track of TRACKS) {
      const parts = chunk(pools[track.id]);
      parts.forEach((itemIds, i) => {
        const short = parts.length > 1 ? `${track.label} ${i + 1}` : track.label;
        lessons.push({
          id: `${region.id}-${track.id}-${i + 1}`,
          region: region.id,
          track: track.id,
          kind: track.kind,
          number: i + 1,
          of: parts.length,
          title: `${region.name} · ${short}`,
          short,
          itemIds,
        });
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
