"use client";

import type { ExamAttempt, OptionLetter, QuestionId } from "@/lib/domain/exam-types";

/**
 * Attempts live on the device.
 *
 * The library has one shared class password and no individual accounts, so
 * there is nobody to attach a result to on the server — and a simulado score
 * is the kind of thing a person may not want shared anyway. Everything is
 * kept in localStorage, which survives reloads and stays private; when
 * individual accounts arrive, these records are what gets migrated.
 */

const KEY = "atlas:tentativas:v1";

export interface StoredAttempt extends ExamAttempt {
  /** What the student wrote for each discursive item. */
  readonly notes?: Readonly<Record<QuestionId, Record<string, string>>>;
  /** Seconds spent, accumulated while the page is open. */
  readonly seconds?: number;
  /** Set once the attempt has been corrected. */
  readonly score?: number;
  readonly possible?: number;
  /** For a drill, the questions it was built from, so it can be reopened. */
  readonly questionIds?: readonly QuestionId[];
  readonly title?: string;
}

type Store = Record<string, StoredAttempt[]>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Private windows and full quotas are not worth breaking the page over.
  }
}

export function loadAttempts(examId: string): StoredAttempt[] {
  return read()[examId] ?? [];
}

/** The attempt in progress, if the student left one unfinished. */
export function loadOpenAttempt(examId: string): StoredAttempt | undefined {
  return loadAttempts(examId).find((attempt) => !attempt.finishedAt);
}

export function saveAttempt(attempt: StoredAttempt): void {
  const store = read();
  const list = store[attempt.examId] ?? [];
  const index = list.findIndex((a) => a.startedAt === attempt.startedAt);
  if (index >= 0) list[index] = attempt;
  else list.push(attempt);
  store[attempt.examId] = list.slice(-20);
  write(store);
}

export function deleteAttempt(examId: string, startedAt: string): void {
  const store = read();
  store[examId] = (store[examId] ?? []).filter((a) => a.startedAt !== startedAt);
  write(store);
}

/** Every finished attempt, newest first — the data behind "meu progresso". */
export function loadHistory(): StoredAttempt[] {
  return Object.values(read())
    .flat()
    .filter((a) => a.finishedAt)
    .sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""));
}

export function newAttempt(examId: string, extra: Partial<StoredAttempt> = {}): StoredAttempt {
  return {
    examId,
    startedAt: new Date().toISOString(),
    choices: {},
    selfMarks: {},
    notes: {},
    seconds: 0,
    ...extra,
  };
}

export function withChoice(
  attempt: StoredAttempt,
  questionId: QuestionId,
  letter: OptionLetter,
): StoredAttempt {
  const choices = { ...attempt.choices };
  // Tapping the chosen option again clears it, as erasing a pencil mark would.
  if (choices[questionId] === letter) delete choices[questionId];
  else choices[questionId] = letter;
  return { ...attempt, choices };
}

export function withNote(
  attempt: StoredAttempt,
  questionId: QuestionId,
  item: string,
  text: string,
): StoredAttempt {
  return {
    ...attempt,
    notes: {
      ...attempt.notes,
      [questionId]: { ...attempt.notes?.[questionId], [item]: text },
    },
  };
}

export function withSelfMark(
  attempt: StoredAttempt,
  questionId: QuestionId,
  item: string,
  points: number,
): StoredAttempt {
  return {
    ...attempt,
    selfMarks: {
      ...attempt.selfMarks,
      [questionId]: { ...attempt.selfMarks[questionId], [item]: points },
    },
  };
}
