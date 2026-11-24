import { seedDecks } from "@/lib/data/flashcards";
import { bankQuestions, questionAreas } from "@/lib/data/questions";
import type { BankQuestion, QuestionArea } from "@/lib/domain/exam-types";
import {
  sharedRecordToDeck,
  summariseDeck,
  type DeckImage,
  type DeckSummary,
  type FlashDeck,
  type Flashcard,
} from "@/lib/domain/flashcard-types";
import type { DisciplineId } from "@/lib/domain/types";
import { readSharedStore } from "@/lib/flashcard-store";

/**
 * O lado de leitura dos flashcards — a mesma fronteira que o resto dos
 * dados atravessa, para que trocar de armazenamento não mexa em página.
 */

export function deckHref(deck: Pick<FlashDeck, "origin" | "slug">): string {
  if (deck.origin === "turma") return `/flashcards/turma/${deck.slug}`;
  if (deck.origin === "meu") return `/flashcards/meus/${deck.slug}`;
  return `/flashcards/${deck.slug}`;
}

/* ---------- baralhos gerados do banco de questões ---------- */

const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/**
 * Uma questão do banco vira cartão sem ser copiada: a frente é o caso e o
 * comando; o verso, o gabarito e o comentário. Discursiva vira um cartão por
 * item, com o padrão de resposta no verso — é exatamente o que se quer
 * conseguir dizer de cabeça.
 */
export function cardsFromQuestion(question: BankQuestion): Flashcard[] {
  const image = question.figureId ? { imageId: `banco-${question.figureId}` } : {};
  if (question.kind === "objetiva") {
    const statements = question.statements?.length
      ? `\n\n${question.statements.map((s, i) => `${roman[i] ?? i + 1}. ${s}`).join("\n")}`
      : "";
    return [
      {
        id: `banco-${question.id}`,
        kind: "texto",
        front: `${question.stem}${statements}\n\n**${question.command}**`,
        back: `**${question.options[question.answer]}**\n\n${question.explanation}`,
        tip: { label: question.topic, text: "Questão objetiva do banco da turma." },
        axisId: question.axisId,
        ...image,
      },
    ];
  }
  return question.items.map((item) => ({
    id: `banco-${question.id}-${item.label}`,
    kind: "texto" as const,
    front: `${question.stem}\n\n**${item.label}) ${item.prompt}**`,
    back: item.expected.map((idea) => `• ${idea}`).join("\n"),
    tip: { label: question.topic, text: "Padrão de resposta da discursiva." },
    axisId: question.axisId,
    ...image,
  }));
}

function bankDeck(area: QuestionArea): FlashDeck {
  const questions = bankQuestions.filter((q) => q.areaId === area.id);
  const figureIds = new Set(questions.flatMap((q) => (q.figureId ? [q.figureId] : [])));
  const images: DeckImage[] = area.figures
    .filter((figure) => figureIds.has(figure.id))
    .map((figure) => ({
      id: `banco-${figure.id}`,
      file: figure.path,
      width: figure.width,
      height: figure.height,
      caption: `Figura ${figure.number}: ${figure.caption}`,
      folder: "simulados" as const,
    }));
  return {
    id: `banco:${area.id}`,
    slug: `banco-${area.id}`,
    origin: "banco",
    title: area.label,
    description: `As questões do banco de ${area.shortLabel.toLowerCase()} em forma de cartão: o caso na frente, o gabarito e o comentário no verso.`,
    disciplineId: area.disciplineId,
    areaId: area.id,
    collection: "Do banco de questões",
    cards: questions.flatMap(cardsFromQuestion),
    images,
    sourceNote: area.sourceNote,
  };
}

let bankCache: readonly FlashDeck[] | null = null;

export function getBankDecks(): readonly FlashDeck[] {
  bankCache ??= questionAreas.map(bankDeck).filter((deck) => deck.cards.length > 0);
  return bankCache;
}

/* ---------- leitura ---------- */

export function getOfficialDecks(disciplineId?: DisciplineId): readonly FlashDeck[] {
  return seedDecks.filter((deck) => !disciplineId || deck.disciplineId === disciplineId);
}

/** Oficiais e do banco, pelo endereço curto. */
export function getStaticDeck(slug: string): FlashDeck | undefined {
  return [...seedDecks, ...getBankDecks()].find((deck) => deck.slug === slug);
}

export async function getSharedDecks(): Promise<readonly FlashDeck[]> {
  const store = await readSharedStore();
  return store.decks
    .filter((record) => record.visibility === "visivel")
    .map(sharedRecordToDeck)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function getSharedDeck(id: string): Promise<FlashDeck | undefined> {
  const store = await readSharedStore();
  const record = store.decks.find((d) => d.id === id && d.visibility === "visivel");
  return record ? sharedRecordToDeck(record) : undefined;
}

/** Tudo o que a página de flashcards lista, sem os cartões. */
export async function getDeckSummaries(): Promise<{
  readonly oficiais: readonly DeckSummary[];
  readonly banco: readonly DeckSummary[];
  readonly turma: readonly DeckSummary[];
}> {
  const shared = await getSharedDecks().catch((error: unknown) => {
    // Sem o arquivo da turma a página ainda serve os oficiais.
    console.error("[flashcards] baralhos da turma indisponíveis", error);
    return [] as readonly FlashDeck[];
  });
  const summarise = (deck: FlashDeck) => summariseDeck(deck, deckHref(deck));
  return {
    oficiais: seedDecks.map(summarise),
    // Os cartões gerados das questões deram lugar aos baralhos curtos por
    // eixo (curados.json); seguem abrindo pelo endereço antigo.
    banco: [],
    turma: shared.map(summarise),
  };
}

/**
 * Os cartões com figura — o material do simulado de imagem. Oclusão e foto
 * servem os dois: a foto mostra a lesão inteira, a oclusão esconde uma
 * estrutura; em ambos a pessoa escreve o nome antes de ver.
 */
export function getImageDecks(): readonly FlashDeck[] {
  return seedDecks.filter((deck) => deck.cards.some((card) => card.kind !== "texto"));
}
