"use client";

import type { CardReview, Grade } from "@/lib/domain/flashcard-review";
import { review } from "@/lib/domain/flashcard-review";

/**
 * O que os flashcards guardam no aparelho.
 *
 * Igual às tentativas de simulado: sem conta individual, o progresso é de
 * quem segura o celular. Três coisas moram aqui — o estado de cada cartão,
 * os baralhos que a pessoa escreveu, e o segredo dos que ela publicou para
 * a turma (sem ele, nem ela consegue editar depois).
 */

const KEY = "atlas:flashcards:v1";

/** Um baralho escrito pelo aluno, ainda só dele. */
export interface OwnDeck {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly disciplineId: string;
  readonly author?: string;
  readonly cards: readonly OwnCard[];
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Preenchido quando o baralho foi publicado para a turma. */
  readonly published?: { readonly id: string; readonly token: string; readonly at: string };
}

export interface OwnCard {
  readonly id: string;
  readonly front: string;
  readonly back: string;
}

interface Store {
  /** id do baralho -> id do cartão -> estado */
  reviews: Record<string, Record<string, CardReview>>;
  decks: OwnDeck[];
}

function read(): Store {
  if (typeof window === "undefined") return { reviews: {}, decks: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    const data = raw ? (JSON.parse(raw) as Partial<Store>) : {};
    return { reviews: data.reviews ?? {}, decks: data.decks ?? [] };
  } catch {
    return { reviews: {}, decks: [] };
  }
}

function write(store: Store): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Janela anônima ou cota cheia: o estudo segue, só não fica guardado.
  }
}

/* ---------- progresso ---------- */

export function loadReviews(deckId: string): Record<string, CardReview> {
  return read().reviews[deckId] ?? {};
}

export function loadAllReviews(): Record<string, Record<string, CardReview>> {
  return read().reviews;
}

export function gradeCard(deckId: string, cardId: string, grade: Grade, now = new Date()) {
  const store = read();
  const deck = { ...store.reviews[deckId] };
  const next = review(deck[cardId], grade, now);
  deck[cardId] = next;
  store.reviews[deckId] = deck;
  write(store);
  return next;
}

export function resetDeckProgress(deckId: string): void {
  const store = read();
  delete store.reviews[deckId];
  write(store);
}

/* ---------- baralhos próprios ---------- */

export function newId(prefix = ""): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}${random}`;
}

export function loadOwnDecks(): OwnDeck[] {
  return read().decks.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function loadOwnDeck(id: string): OwnDeck | undefined {
  return read().decks.find((deck) => deck.id === id);
}

export function saveOwnDeck(deck: OwnDeck): void {
  const store = read();
  const index = store.decks.findIndex((d) => d.id === deck.id);
  if (index >= 0) store.decks[index] = deck;
  else store.decks.push(deck);
  write(store);
}

export function deleteOwnDeck(id: string): void {
  const store = read();
  store.decks = store.decks.filter((d) => d.id !== id);
  delete store.reviews[`meu:${id}`];
  write(store);
}

/** Os baralhos da turma que este aparelho publicou, pelo id público. */
export function publishedTokens(): Record<string, string> {
  return Object.fromEntries(
    read().decks.flatMap((d) => (d.published ? [[d.published.id, d.published.token]] : [])),
  );
}

/* ---------- exportar e importar ---------- */

export interface DeckFile {
  readonly formato: "atlas-baralho";
  readonly versao: 1;
  readonly titulo: string;
  readonly descricao: string;
  readonly materia: string;
  readonly cartoes: readonly { readonly frente: string; readonly verso: string }[];
}

export function deckToFile(deck: Pick<OwnDeck, "title" | "description" | "disciplineId" | "cards">) {
  const file: DeckFile = {
    formato: "atlas-baralho",
    versao: 1,
    titulo: deck.title,
    descricao: deck.description,
    materia: deck.disciplineId,
    cartoes: deck.cards.map((card) => ({ frente: card.front, verso: card.back })),
  };
  return JSON.stringify(file, null, 2);
}

/**
 * Lê um baralho de arquivo. Aceita o formato do Atlas e, por ser o que
 * todo mundo tem, texto do Anki/Quizlet exportado com tabulação: uma linha
 * por cartão, frente e verso separados por TAB.
 */
export function deckFromText(
  text: string,
  fallbackTitle: string,
): Pick<OwnDeck, "title" | "description" | "disciplineId" | "cards"> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed) as Partial<DeckFile>;
      if (data.formato !== "atlas-baralho" || !Array.isArray(data.cartoes)) return null;
      const cards = data.cartoes
        .filter((c) => typeof c?.frente === "string" && typeof c?.verso === "string")
        .map((c) => ({ id: newId("c"), front: c.frente.trim(), back: c.verso.trim() }))
        .filter((c) => c.front && c.back);
      if (cards.length === 0) return null;
      return {
        title: typeof data.titulo === "string" && data.titulo.trim() ? data.titulo : fallbackTitle,
        description: typeof data.descricao === "string" ? data.descricao : "",
        disciplineId: typeof data.materia === "string" ? data.materia : "",
        cards,
      };
    } catch {
      return null;
    }
  }

  const cards = trimmed
    .split(/\r?\n/)
    .map((line) => line.split("\t"))
    .filter((parts) => parts.length >= 2 && parts[0]!.trim() && parts[1]!.trim())
    .map((parts) => ({ id: newId("c"), front: parts[0]!.trim(), back: parts[1]!.trim() }));
  if (cards.length === 0) return null;
  return { title: fallbackTitle, description: "", disciplineId: "", cards };
}
