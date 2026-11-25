"use client";

import { useSyncExternalStore } from "react";
import { scheduleAnswer, type ReviewCard } from "@/lib/domain/anatomy-lessons";
import { recordAnswer, recordSession } from "@/lib/study-log";

/**
 * O progresso da anatomia 3D, no aparelho: a revisão espaçada de cada
 * músculo, a melhor marca de cada lição e se o som está ligado.
 *
 * Cada resposta de memória também vai para o diário de estudo, para o painel
 * de Desempenho e a sequência de dias contarem a anatomia junto do resto.
 */

const KEY = "atlas:anatomia:v1";

export interface LessonRecord {
  readonly best: number;
  readonly times: number;
  readonly at: number;
}

export interface AnatomyProgress {
  readonly cards: Readonly<Record<string, ReviewCard>>;
  readonly lessons: Readonly<Record<string, LessonRecord>>;
  readonly sound: boolean;
  /** Como o treino mostra o corpo: inteiro e apagado ("corpo") ou em raio-X. */
  readonly view: TrainerView;
}

export type TrainerView = "corpo" | "raiox";

const EMPTY: AnatomyProgress = { cards: {}, lessons: {}, sound: true, view: "corpo" };

let cache: AnatomyProgress | null = null;
const listeners = new Set<() => void>();

function read(): AnatomyProgress {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<AnatomyProgress>) : {};
    cache = {
      cards: parsed.cards ?? {},
      lessons: parsed.lessons ?? {},
      sound: parsed.sound ?? true,
      view: parsed.view === "raiox" ? "raiox" : "corpo",
    };
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: AnatomyProgress): void {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Sem armazenamento, a sessão continua; só não fica guardada.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAnatomyProgress(): AnatomyProgress {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function getAnatomyProgress(): AnatomyProgress {
  return read();
}

export function recordMuscleAnswer(
  muscle: {
    readonly id: string;
    readonly namePt: string;
    readonly region: string;
    readonly regionName: string;
    readonly kind?: "muscle" | "bone";
  },
  ok: boolean,
  now = Date.now(),
): void {
  const bone = muscle.kind === "bone";
  const state = read();
  write({ ...state, cards: { ...state.cards, [muscle.id]: scheduleAnswer(state.cards[muscle.id], ok, now) } });
  recordAnswer({
    mode: "anatomia",
    ref: `anatomia:${muscle.id}`,
    ok,
    t: now,
    group: muscle.region,
    groupLabel: `Anatomia · ${muscle.regionName}`,
    axis: `anatomia${bone ? "-ossos" : ""}:${muscle.region}`,
    axisLabel: `${bone ? "Ossos" : "Músculos"} · ${muscle.regionName}`,
  });
}

export function recordLessonResult(
  lesson: { readonly id: string; readonly title: string },
  correct: number,
  total: number,
  seconds: number,
): void {
  const state = read();
  const prev = state.lessons[lesson.id];
  const score = total ? correct / total : 0;
  write({
    ...state,
    lessons: {
      ...state.lessons,
      [lesson.id]: { best: Math.max(prev?.best ?? 0, score), times: (prev?.times ?? 0) + 1, at: Date.now() },
    },
  });
  recordSession({ mode: "anatomia", title: `Lição · ${lesson.title}`, correct, total, seconds });
}

export function setAnatomySound(on: boolean): void {
  write({ ...read(), sound: on });
}

export function setTrainerView(view: TrainerView): void {
  write({ ...read(), view });
}
