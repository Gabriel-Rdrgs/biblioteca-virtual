/**
 * Digitar o nome do músculo, letra por letra.
 *
 * O nome vira uma fila de "casas". Cada casa tem o caractere como aparece
 * ("ó") e a tecla que vale para ele ("o") — acento e maiúscula não contam,
 * porque o que se treina é o nome, não a ortografia do teclado. Pontuação
 * não tem tecla: o cursor pula por cima. O espaço pode ser omitido: quem
 * digita "orbicularo" em vez de "orbicular o" não é punido.
 *
 * Errar a mesma casa várias vezes revela a letra (fica âmbar) e o cursor
 * segue; na rodada de memória, uma letra revelada já é erro.
 */

export interface Slot {
  readonly char: string;
  /** A tecla que vale para esta casa; null para o que se pula (hífen, ponto). */
  readonly key: string | null;
}

export interface TypingState {
  /** Próxima casa a digitar. */
  readonly pos: number;
  /** Erros seguidos na casa atual. */
  readonly wrongHere: number;
  /** Erros no nome inteiro. */
  readonly errors: number;
  /** Casas reveladas por erro (ou por "não sei"). */
  readonly revealed: readonly number[];
  /** Teclas certas — base da velocidade. */
  readonly hits: number;
  readonly done: boolean;
}

export type KeyResult = "ok" | "wrong" | "revealed" | "ignored";

/** A tecla normalizada: "Ó" → "o"; espaço é espaço; o resto não conta. */
export function keyOf(char: string): string | null {
  if (char === " ") return " ";
  const folded = char
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return /^[a-z0-9]$/.test(folded) ? folded : null;
}

/** "Abdutor do dedo mínimo (pé)" → nome a digitar e o qualificador à parte. */
export function splitQualifier(name: string): { text: string; qualifier: string | null } {
  const match = /^(.*?)\s*\((.+)\)\s*$/.exec(name);
  return match ? { text: match[1] ?? name, qualifier: match[2] ?? null } : { text: name, qualifier: null };
}

export function toSlots(text: string): Slot[] {
  return [...text.normalize("NFC")].map((char) => ({ char, key: keyOf(char) }));
}

function skip(slots: readonly Slot[], from: number): number {
  let i = from;
  while (i < slots.length && slots[i]?.key === null) i++;
  return i;
}

export function startTyping(slots: readonly Slot[]): TypingState {
  const pos = skip(slots, 0);
  return { pos, wrongHere: 0, errors: 0, revealed: [], hits: 0, done: pos >= slots.length };
}

/**
 * Uma tecla. `maxWrong` é quantos erros na mesma casa revelam a letra —
 * infinito na primeira rodada (o nome está à vista), 3 nas outras.
 */
export function pressKey(
  state: TypingState,
  slots: readonly Slot[],
  rawKey: string,
  maxWrong = Infinity,
): { state: TypingState; result: KeyResult } {
  if (state.done) return { state, result: "ignored" };
  const key = keyOf(rawKey);
  if (key === null) return { state, result: "ignored" };

  const expected = slots[state.pos]?.key;
  const advance = (to: number, patch: Partial<TypingState>): TypingState => {
    const pos = skip(slots, to);
    return { ...state, ...patch, pos, wrongHere: 0, done: pos >= slots.length };
  };

  if (key === expected) return { state: advance(state.pos + 1, { hits: state.hits + 1 }), result: "ok" };

  // Esperava espaço e veio a letra seguinte: aceita, o espaço fica implícito.
  if (expected === " ") {
    const next = skip(slots, state.pos + 1);
    if (next < slots.length && slots[next]?.key === key) {
      return { state: advance(next + 1, { hits: state.hits + 2 }), result: "ok" };
    }
  }

  const wrongHere = state.wrongHere + 1;
  const errors = state.errors + 1;
  if (wrongHere >= maxWrong) {
    return {
      state: advance(state.pos + 1, { errors, revealed: [...state.revealed, state.pos] }),
      result: "revealed",
    };
  }
  return { state: { ...state, wrongHere, errors }, result: "wrong" };
}

/** "Não sei": revela o resto do nome. */
export function giveUp(state: TypingState, slots: readonly Slot[]): TypingState {
  const revealed = [...state.revealed];
  for (let i = state.pos; i < slots.length; i++) if (slots[i]?.key !== null) revealed.push(i);
  return { ...state, pos: slots.length, wrongHere: 0, revealed, done: true };
}

export function letterCount(slots: readonly Slot[]): number {
  return slots.filter((s) => s.key !== null && s.key !== " ").length;
}

/** Deslizes tolerados num nome escrito de memória: um a cada dez letras, no mínimo um. */
export function slipAllowance(letters: number): number {
  return Math.max(1, Math.round(letters / 10));
}

/** Escrito de memória: até o fim, sem letra revelada e com poucos deslizes. */
export function isCorrect(state: TypingState, slots: readonly Slot[]): boolean {
  return state.done && state.revealed.length === 0 && state.errors <= slipAllowance(letterCount(slots));
}

/** Palavras por minuto, na convenção de digitação (5 teclas = 1 palavra). */
export function wordsPerMinute(chars: number, ms: number): number {
  return ms < 1000 || chars === 0 ? 0 : Math.round(chars / 5 / (ms / 60_000));
}
