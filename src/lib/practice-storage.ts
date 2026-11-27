"use client";

import { useSyncExternalStore } from "react";

/**
 * O que a prova prática guarda no aparelho: o modo de treino rápido, o
 * histórico dos simulados e quantas vezes cada tema foi errado (para dizer
 * "seus erros mais frequentes" e apontar o que revisar).
 */

const KEY = "atlas:pratica:v1";
const MAX_HISTORY = 50;

export interface PracticeRun {
  /** Quando terminou, em ms. */
  readonly at: number;
  readonly correct: number;
  readonly total: number;
  readonly fast: boolean;
}

export interface PracticeState {
  readonly fast: boolean;
  readonly runs: readonly PracticeRun[];
  /** Erros acumulados por tema. */
  readonly errors: Readonly<Record<string, number>>;
  /** Temas marcados como estudados. */
  readonly studied: readonly string[];
}

const EMPTY: PracticeState = { fast: false, runs: [], errors: {}, studied: [] };
let cache: PracticeState | null = null;
const listeners = new Set<() => void>();

function read(): PracticeState {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<PracticeState>) : {};
    cache = {
      fast: parsed.fast ?? false,
      runs: parsed.runs ?? [],
      errors: parsed.errors ?? {},
      studied: parsed.studied ?? [],
    };
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: PracticeState): void {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Sem armazenamento, o simulado funciona; só não guarda o histórico.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePracticeState(): PracticeState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function setPracticeFast(fast: boolean): void {
  write({ ...read(), fast });
}

export function toggleStudied(topic: string): void {
  const state = read();
  const studied = state.studied.includes(topic)
    ? state.studied.filter((t) => t !== topic)
    : [...state.studied, topic];
  write({ ...state, studied });
}

export function savePracticeRun(run: PracticeRun, wrongTopics: readonly string[]): void {
  const state = read();
  const errors = { ...state.errors };
  for (const t of wrongTopics) errors[t] = (errors[t] ?? 0) + 1;
  write({ ...state, runs: [...state.runs, run].slice(-MAX_HISTORY), errors });
}
