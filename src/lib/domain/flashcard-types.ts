/**
 * Flashcards: o modelo.
 *
 * Um baralho tem dono de quatro jeitos, e o dono decide onde ele mora:
 *
 * - `oficial`: escrito pela turma a partir dos livros e versionado aqui, como
 *   o banco de questões. Pode ter figuras (as de oclusão e as fotos).
 * - `banco`: gerado na hora a partir do banco de questões — nada é copiado,
 *   então uma questão corrigida corrige o cartão junto.
 * - `turma`: publicado por um aluno para todo mundo; mora no servidor, ao
 *   lado do catálogo, e o admin pode ocultar.
 * - `meu`: criado por um aluno e guardado só no aparelho dele.
 *
 * Os dois últimos são só texto. Figura de aluno exigiria upload aberto a
 * qualquer pessoa com a senha da turma, e isso é outra conversa.
 */

import type { DisciplineId } from "./types";

export type DeckOrigin = "oficial" | "banco" | "turma" | "meu";

/**
 * Texto dos cartões: `**negrito**` é a única marcação aceita, e é desenhada
 * por um componente que monta elementos — nunca HTML cru, porque o texto de
 * um baralho da turma foi escrito por qualquer pessoa.
 */
export type CardText = string;

export interface CardTip {
  /** "Atenção", "Correlação clínica", "Para memorizar", "Como identificar"… */
  readonly label: string;
  readonly text: CardText;
}

export interface TextCard {
  readonly id: string;
  readonly kind: "texto";
  readonly front: CardText;
  readonly back: CardText;
  readonly tip?: CardTip;
  /** Eixo do banco, quando o cartão vem de uma questão. */
  readonly axisId?: string;
  /** Figura que acompanha a frente (as questões do banco que citam uma). */
  readonly imageId?: string;
  /**
   * Figuras que só aparecem com a resposta — o esquema do livro que explica
   * o que o verso diz, e que na frente entregaria a resposta.
   */
  readonly backImageIds?: readonly string[];
}

/**
 * Image occlusion: uma estrutura da figura fica coberta por um "?" e a
 * pergunta é o nome dela. A caixa é em porcentagem da figura, para não
 * depender do tamanho em que ela aparece.
 */
export interface OcclusionCard {
  readonly id: string;
  readonly kind: "oclusao";
  readonly imageId: string;
  /** [esquerda, topo, largura, altura], em % da figura. */
  readonly box: readonly [number, number, number, number];
  readonly answer: string;
}

/**
 * Reconhecimento por foto: a imagem inteira, sem legenda, como na TV da
 * prova prática. O verso explica como reconhecer e com o que não confundir.
 */
export interface PhotoCard {
  readonly id: string;
  readonly kind: "foto";
  readonly imageId: string;
  readonly answer: string;
  /** O que a foto mostra, quando ajuda (ex.: "repouso e sorriso"). */
  readonly note?: string;
  readonly description?: CardText;
  readonly howToSpot?: CardText;
  readonly association?: CardText;
  readonly confuseWith?: readonly string[];
}

export type Flashcard = TextCard | OcclusionCard | PhotoCard;
export type CardKind = Flashcard["kind"];

/**
 * Uma figura de baralho. As dos baralhos oficiais ficam em
 * storage/flashcards; as dos cartões gerados do banco são as mesmas
 * figuras dos simulados, servidas de onde já estão.
 */
export interface DeckImage {
  readonly id: string;
  readonly file: string;
  readonly width: number;
  readonly height: number;
  readonly caption?: string;
  readonly folder?: "flashcards" | "simulados";
}

/** O endereço da figura, atrás da senha da turma. */
export function deckImageSrc(image: DeckImage): string {
  return image.folder === "simulados"
    ? `/api/simulados/${image.file}`
    : `/api/flashcards/figuras/${image.file}`;
}

export interface FlashDeck {
  /** Único entre todos os baralhos: `oficial:…`, `banco:…`, `turma:…`, `meu:…`. */
  readonly id: string;
  readonly slug: string;
  readonly origin: DeckOrigin;
  readonly title: string;
  readonly description: string;
  readonly disciplineId: DisciplineId;
  /** Área do banco de questões, quando o baralho é dela. */
  readonly areaId?: string;
  /** Agrupa baralhos de uma mesma coleção ("Membros superiores"). */
  readonly collection?: string;
  /** Cor de destaque, em hex. */
  readonly color?: string;
  readonly cards: readonly Flashcard[];
  readonly images: readonly DeckImage[];
  /** De onde vem o conteúdo — livro, capítulo, figuras. */
  readonly sourceNote?: string;
  /** Quem publicou (baralhos da turma). Livre e opcional. */
  readonly author?: string;
  readonly updatedAt?: string;
}

/** O que a lista de baralhos precisa, sem carregar os cartões. */
export interface DeckSummary {
  readonly id: string;
  readonly slug: string;
  readonly origin: DeckOrigin;
  readonly title: string;
  readonly description: string;
  readonly disciplineId: DisciplineId;
  readonly collection?: string;
  readonly color?: string;
  readonly cardIds: readonly string[];
  readonly imageCards: number;
  readonly author?: string;
  readonly updatedAt?: string;
  readonly href: string;
}

export function summariseDeck(deck: FlashDeck, href: string): DeckSummary {
  return {
    id: deck.id,
    slug: deck.slug,
    origin: deck.origin,
    title: deck.title,
    description: deck.description,
    disciplineId: deck.disciplineId,
    ...(deck.collection ? { collection: deck.collection } : {}),
    ...(deck.color ? { color: deck.color } : {}),
    cardIds: deck.cards.map((card) => card.id),
    imageCards: deck.cards.filter((card) => card.kind !== "texto").length,
    ...(deck.author ? { author: deck.author } : {}),
    ...(deck.updatedAt ? { updatedAt: deck.updatedAt } : {}),
    href,
  };
}

/**
 * Até onde vai um baralho da turma. O arquivo inteiro é lido a cada página,
 * e um baralho de dez mil cartões deixaria a lista lenta para todo mundo.
 * Mora aqui para o editor e o servidor concordarem.
 */
export const SHARED_DECK_LIMITS = {
  cardsPerDeck: 400,
  decks: 300,
  front: 1200,
  back: 2400,
  title: 100,
  description: 400,
  author: 60,
} as const;

/** Um baralho publicado para a turma, como fica guardado no servidor. */
export interface SharedDeckRecord {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly disciplineId: DisciplineId;
  readonly author?: string;
  readonly cards: readonly { readonly id: string; readonly front: string; readonly back: string }[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly visibility: "visivel" | "oculto";
  /**
   * Hash do segredo que o aparelho de quem publicou guardou. Só quem tem o
   * segredo edita ou retira — sem conta individual, é o que dá para fazer.
   */
  readonly tokenHash: string;
}

export interface SharedDeckStore {
  readonly version: 1;
  readonly decks: readonly SharedDeckRecord[];
}

export const emptySharedStore: SharedDeckStore = { version: 1, decks: [] };

export function sharedRecordToDeck(record: SharedDeckRecord): FlashDeck {
  return {
    id: `turma:${record.id}`,
    slug: record.id,
    origin: "turma",
    title: record.title,
    description: record.description,
    disciplineId: record.disciplineId,
    ...(record.author ? { author: record.author } : {}),
    updatedAt: record.updatedAt,
    cards: record.cards.map((card) => ({
      id: card.id,
      kind: "texto" as const,
      front: card.front,
      back: card.back,
    })),
    images: [],
  };
}
