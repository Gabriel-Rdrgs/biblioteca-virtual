"use client";

/**
 * O diário de estudo e a fila de erros.
 *
 * Cada resposta dada em qualquer modo — questão rápida, foto do simulado de
 * imagem, cartão — vira uma linha aqui. É o que alimenta o painel de
 * desempenho: acerto por área, dias estudados, sessões recentes. O simulado
 * completo continua guardado à parte (exam-storage), porque lá o que conta
 * é a nota da prova inteira, e aqui é o hábito.
 *
 * A fila de erros é a outra metade: toda objetiva errada entra; sai quando
 * a pessoa acerta duas vezes seguidas. Uma vez não basta — acertar logo
 * depois de ver o gabarito é memória de curto prazo, não aprendizado.
 */

const LOG_KEY = "atlas:estudo:v1";
const QUEUE_KEY = "atlas:fila-erros:v1";
const MAX_EVENTS = 5000;
const MAX_SESSIONS = 300;

export type StudyMode = "rapido" | "imagem" | "flashcards" | "simulado";

export interface StudyEvent {
  /** Quando, em ms desde a época — compacto, porque são milhares. */
  readonly t: number;
  readonly mode: StudyMode;
  /** Questão ou cartão. */
  readonly ref: string;
  readonly ok: boolean;
  /** Área do banco ou matéria; agrupa no painel. */
  readonly group?: string;
  readonly groupLabel?: string;
  readonly axis?: string;
  readonly axisLabel?: string;
}

export interface StudySession {
  readonly t: number;
  readonly mode: StudyMode;
  readonly title: string;
  readonly correct: number;
  readonly total: number;
  readonly seconds?: number;
}

interface Log {
  events: StudyEvent[];
  sessions: StudySession[];
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sem armazenamento, o estudo continua; só o painel fica sem histórico.
  }
}

export function loadStudyLog(): Log {
  const log = readJson<Partial<Log>>(LOG_KEY, {});
  return { events: log.events ?? [], sessions: log.sessions ?? [] };
}

export function recordAnswer(event: Omit<StudyEvent, "t"> & { readonly t?: number }): void {
  const log = loadStudyLog();
  log.events.push({ ...event, t: event.t ?? Date.now() });
  if (log.events.length > MAX_EVENTS) log.events = log.events.slice(-MAX_EVENTS);
  writeJson(LOG_KEY, log);
}

export function recordSession(session: Omit<StudySession, "t">): void {
  const log = loadStudyLog();
  log.sessions.push({ ...session, t: Date.now() });
  if (log.sessions.length > MAX_SESSIONS) log.sessions = log.sessions.slice(-MAX_SESSIONS);
  writeJson(LOG_KEY, log);
}

export function clearStudyLog(): void {
  try {
    window.localStorage.removeItem(LOG_KEY);
    window.localStorage.removeItem(QUEUE_KEY);
  } catch {
    // Já estava inacessível.
  }
}

/* ---------- fila de erros ---------- */

export interface QueuedError {
  readonly questionId: string;
  readonly areaId: string;
  readonly topic: string;
  readonly addedAt: string;
  readonly misses: number;
  /** Acertos seguidos desde o último erro; com dois, sai da fila. */
  readonly streak: number;
}

export const STREAK_TO_CLEAR = 2;

type Queue = Record<string, QueuedError>;

export function loadErrorQueue(): QueuedError[] {
  return Object.values(readJson<Queue>(QUEUE_KEY, {})).sort((a, b) =>
    b.addedAt.localeCompare(a.addedAt),
  );
}

export function isQueued(questionId: string): boolean {
  return Boolean(readJson<Queue>(QUEUE_KEY, {})[questionId]);
}

/**
 * Registra o resultado de uma objetiva na fila. Errou: entra (ou zera a
 * sequência). Acertou estando na fila: soma um; com dois seguidos, sai.
 * Devolve o que aconteceu, para a tela poder dizer.
 */
export function updateErrorQueue(
  question: { readonly id: string; readonly areaId: string; readonly topic: string },
  ok: boolean,
  now = new Date(),
): "entrou" | "continua" | "saiu" | null {
  const queue = readJson<Queue>(QUEUE_KEY, {});
  const current = queue[question.id];

  if (!ok) {
    queue[question.id] = {
      questionId: question.id,
      areaId: question.areaId,
      topic: question.topic,
      addedAt: current?.addedAt ?? now.toISOString(),
      misses: (current?.misses ?? 0) + 1,
      streak: 0,
    };
    writeJson(QUEUE_KEY, queue);
    return current ? "continua" : "entrou";
  }

  if (!current) return null;
  const streak = current.streak + 1;
  if (streak >= STREAK_TO_CLEAR) {
    delete queue[question.id];
    writeJson(QUEUE_KEY, queue);
    return "saiu";
  }
  queue[question.id] = { ...current, streak };
  writeJson(QUEUE_KEY, queue);
  return "continua";
}

/** Para o simulado completo: as erradas entram, as certas contam acerto. */
export function feedErrorQueue(
  results: readonly {
    readonly id: string;
    readonly areaId: string;
    readonly topic: string;
    readonly ok: boolean;
  }[],
): void {
  for (const result of results) updateErrorQueue(result, result.ok);
}
