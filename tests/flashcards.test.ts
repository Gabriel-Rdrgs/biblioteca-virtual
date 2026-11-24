import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seedDecks } from "@/lib/data/flashcards";
import { bankQuestions, questionAreas } from "@/lib/data/questions";
import { disciplines } from "@/lib/data/disciplines";
import {
  buildQueue,
  cardStatus,
  countDeck,
  MASTERED_BOX,
  requeue,
  review,
  type CardReview,
} from "@/lib/domain/flashcard-review";
import { dayKey, summariseStudy, type StatEvent } from "@/lib/domain/study-stats";
import { deckFromText, deckToFile } from "@/lib/flashcard-storage";
import { readSharedStore, resetSharedStoreCache } from "@/lib/flashcard-store";
import { cardsFromQuestion, getBankDecks, getSharedDeck } from "@/lib/repository/flashcards";
import { pickQuickQuestions } from "@/lib/repository/exams";
import {
  publishSharedDeck,
  setSharedDeckVisibility,
  SharedDeckError,
  sharedDeckInputSchema,
  updateSharedDeck,
  withdrawSharedDeck,
} from "@/lib/shared-decks";
import { loadErrorQueue, updateErrorQueue } from "@/lib/study-log";

const NOW = new Date("2026-11-20T12:00:00Z");
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

describe("os baralhos oficiais", () => {
  it("têm ids únicos, entre todos os baralhos e entre todos os cartões", () => {
    const deckIds = seedDecks.map((d) => d.id);
    expect(new Set(deckIds).size).toBe(deckIds.length);
    const slugs = seedDecks.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const cardIds = seedDecks.flatMap((d) => d.cards.map((c) => c.id));
    expect(new Set(cardIds).size).toBe(cardIds.length);
  });

  it("apontam para matérias que existem", () => {
    const ids = new Set(disciplines.map((d) => d.id));
    for (const deck of seedDecks) expect(ids.has(deck.disciplineId), deck.id).toBe(true);
  });

  it("cada cartão tem a forma do seu tipo, e cada figura citada está no baralho", () => {
    for (const deck of seedDecks) {
      const images = new Set(deck.images.map((i) => i.id));
      for (const card of deck.cards) {
        if (card.kind === "texto") {
          expect(card.front.trim(), card.id).not.toBe("");
          expect(card.back.trim(), card.id).not.toBe("");
          for (const id of card.backImageIds ?? []) {
            expect(images.has(id), `${card.id} -> ${id}`).toBe(true);
          }
        } else {
          expect(images.has(card.imageId), `${card.id} -> ${card.imageId}`).toBe(true);
          expect(card.answer.trim(), card.id).not.toBe("");
        }
        if (card.kind === "oclusao") {
          const [x, y, w, h] = card.box;
          expect(card.box, card.id).toHaveLength(4);
          expect(x >= 0 && y >= 0 && w > 0 && h > 0, card.id).toBe(true);
          expect(x + w <= 100.5 && y + h <= 100.5, card.id).toBe(true);
        }
      }
      for (const image of deck.images) {
        expect(image.width > 0 && image.height > 0, image.id).toBe(true);
        expect(image.file, image.id).toMatch(/^[a-z0-9][a-z0-9.-]{2,120}$/i);
      }
    }
  });

  it("trazem as duas coleções importadas", () => {
    const collections = new Set(seedDecks.map((d) => d.collection));
    expect(collections.has("Membros superiores")).toBe(true);
    expect(collections.has("Semiologia de cabeça e pescoço")).toBe(true);
    expect(collections.has("Lesões elementares de pele")).toBe(true);
    expect(collections.has("Vírus")).toBe(true);
    expect(seedDecks.reduce((n, d) => n + d.cards.length, 0)).toBeGreaterThan(400);
  });
});

describe("os baralhos gerados do banco", () => {
  it("transformam cada objetiva em um cartão e cada item discursivo em outro", () => {
    for (const deck of getBankDecks()) {
      const questions = bankQuestions.filter((q) => q.areaId === deck.areaId);
      const expected = questions.reduce(
        (n, q) => n + (q.kind === "objetiva" ? 1 : q.items.length),
        0,
      );
      expect(deck.cards, deck.id).toHaveLength(expected);
    }
    expect(getBankDecks().length).toBe(
      questionAreas.filter((a) => bankQuestions.some((q) => q.areaId === a.id)).length,
    );
  });

  it("levam o gabarito e o comentário para o verso", () => {
    const question = bankQuestions.find((q) => q.kind === "objetiva");
    if (!question || question.kind !== "objetiva") throw new Error("sem objetiva no banco");
    const [card] = cardsFromQuestion(question);
    expect(card?.kind).toBe("texto");
    if (card?.kind !== "texto") return;
    expect(card.back).toContain(question.options[question.answer]);
    expect(card.back).toContain(question.explanation);
    expect(card.front).toContain(question.command);
  });

  it("citam só figuras que o baralho carrega", () => {
    for (const deck of getBankDecks()) {
      const images = new Set(deck.images.map((i) => i.id));
      for (const card of deck.cards) {
        if (card.kind === "texto" && card.imageId) {
          expect(images.has(card.imageId), card.id).toBe(true);
        }
      }
    }
  });
});

describe("a revisão espaçada", () => {
  it("sobe uma caixa a cada acerto e volta ao começo no erro", () => {
    let state = review(undefined, "sei", NOW);
    expect(state.box).toBe(1);
    state = review(state, "sei", day(1));
    state = review(state, "sei", day(4));
    expect(state.box).toBe(3);
    expect(cardStatus(state, day(5))).toBe("dominado");

    const lapsed = review(state, "errei", day(20));
    expect(lapsed.box).toBe(0);
    expect(lapsed.lapses).toBe(1);
    expect(cardStatus(lapsed, day(20))).toBe("revisar");
  });

  it("'quase' não sobe nem zera, e volta amanhã", () => {
    const start = review(review(undefined, "sei", NOW), "sei", day(1));
    const almost = review(start, "quase", day(4));
    expect(almost.box).toBe(start.box);
    expect(almost.due).toBe(day(5).toISOString());
  });

  it("não passa da última caixa", () => {
    let state: CardReview | undefined;
    for (let i = 0; i < 20; i++) state = review(state, "sei", day(i * 40));
    expect(state!.box).toBe(5);
  });

  it("monta a fila com o vencido primeiro, depois os novos, depois o resto", () => {
    const states: Record<string, CardReview> = {
      atrasado: { ...review(undefined, "errei", day(-3)) },
      vencido: { ...review(undefined, "errei", day(-1)) },
      futuro: review(undefined, "sei", NOW),
    };
    const queue = buildQueue(["novo", "futuro", "vencido", "atrasado"], states, NOW);
    expect(queue).toEqual(["atrasado", "vencido", "novo", "futuro"]);
    expect(buildQueue(["novo", "futuro"], states, NOW, { onlyPending: true })).toEqual(["novo"]);
    expect(buildQueue(["a", "b", "c"], {}, NOW, { newLimit: 2 })).toEqual(["a", "b"]);
  });

  it("devolve o cartão errado à fila da sessão, mais perto que o 'quase'", () => {
    const queue = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];
    expect(requeue(queue, 0, "errei").indexOf("a", 1)).toBe(5);
    expect(requeue(queue, 0, "quase").indexOf("a", 1)).toBe(9);
    expect(requeue(queue, 0, "sei")).toEqual(queue);
    // Perto do fim, vai para o fim.
    expect(requeue(["a", "b"], 0, "errei")).toEqual(["a", "b", "a"]);
  });

  it("conta um baralho por situação", () => {
    const states = {
      x: review(undefined, "errei", day(-1)),
      y: { ...review(undefined, "sei", NOW), box: MASTERED_BOX },
    };
    expect(countDeck(["x", "y", "z"], states, NOW)).toEqual({
      total: 3,
      novos: 1,
      revisar: 1,
      aprendendo: 0,
      dominados: 1,
    });
  });
});

describe("o painel de desempenho", () => {
  const event = (daysAgo: number, ok: boolean, extra: Partial<StatEvent> = {}): StatEvent => ({
    t: day(-daysAgo).getTime(),
    mode: "rapido",
    ref: "q",
    ok,
    ...extra,
  });

  it("soma acertos, dias e a sequência, que pode terminar ontem", () => {
    const stats = summariseStudy(
      [event(1, true), event(1, false), event(2, true), event(4, true)],
      NOW,
    );
    expect(stats.answered).toBe(4);
    expect(stats.percent).toBe(75);
    expect(stats.activeDays).toBe(3);
    expect(stats.streak).toBe(2);
    expect(stats.days).toHaveLength(14);
    expect(stats.days.at(-1)?.key).toBe(dayKey(NOW));
  });

  it("só aponta eixo fraco com três respostas ou mais", () => {
    const stats = summariseStudy(
      [
        event(0, false, { axis: "a", axisLabel: "A" }),
        event(0, false, { axis: "a", axisLabel: "A" }),
        event(0, true, { axis: "a", axisLabel: "A" }),
        event(0, false, { axis: "b", axisLabel: "B" }),
      ],
      NOW,
    );
    expect(stats.weakest.map((r) => r.id)).toEqual(["a"]);
    expect(stats.weakest[0]?.percent).toBe(33);
  });
});

describe("importar e exportar baralhos", () => {
  it("lê o próprio formato de volta", () => {
    const text = deckToFile({
      title: "Plexo",
      description: "d",
      disciplineId: "mac-1",
      cards: [{ id: "c1", front: "F", back: "V" }],
    });
    const parsed = deckFromText(text, "x");
    expect(parsed?.title).toBe("Plexo");
    expect(parsed?.disciplineId).toBe("mac-1");
    expect(parsed?.cards.map((c) => [c.front, c.back])).toEqual([["F", "V"]]);
  });

  it("aceita o texto com TAB do Anki e do Quizlet", () => {
    const parsed = deckFromText("Frente 1\tVerso 1\nlinha ruim\nFrente 2\tVerso 2\n", "Anki");
    expect(parsed?.title).toBe("Anki");
    expect(parsed?.cards).toHaveLength(2);
  });

  it("recusa o que não reconhece", () => {
    expect(deckFromText("", "x")).toBeNull();
    expect(deckFromText('{"outro":"formato"}', "x")).toBeNull();
    expect(deckFromText("sem tab nenhum", "x")).toBeNull();
  });
});

describe("a fila de erros", () => {
  beforeEach(() => window.localStorage.clear());

  it("entra no erro e só sai com dois acertos seguidos", () => {
    const q = { id: "q1", areaId: "anatomia", topic: "Crânio" };
    expect(updateErrorQueue(q, true)).toBeNull();
    expect(updateErrorQueue(q, false)).toBe("entrou");
    expect(updateErrorQueue(q, true)).toBe("continua");
    expect(updateErrorQueue(q, false)).toBe("continua");
    expect(loadErrorQueue()[0]?.misses).toBe(2);
    expect(updateErrorQueue(q, true)).toBe("continua");
    expect(updateErrorQueue(q, true)).toBe("saiu");
    expect(loadErrorQueue()).toHaveLength(0);
  });
});

describe("o modo rápido", () => {
  it("sorteia só objetivas, da área pedida, sem repetir", () => {
    const pick = pickQuickQuestions({ areaIds: ["anatomia"], count: 15, seed: 3 });
    expect(pick.questions).toHaveLength(15);
    expect(pick.questions.every((q) => q.kind === "objetiva" && q.areaId === "anatomia")).toBe(true);
    expect(new Set(pick.questions.map((q) => q.id)).size).toBe(15);
  });

  it("refaz exatamente a lista pedida", () => {
    const ids = bankQuestions.filter((q) => q.kind === "objetiva").slice(0, 3).map((q) => q.id);
    const pick = pickQuickQuestions({ ids, count: ids.length });
    expect(pick.questions.map((q) => q.id).sort()).toEqual([...ids].sort());
  });
});

describe("baralhos publicados para a turma", () => {
  const input = sharedDeckInputSchema.parse({
    title: "Nervos do braço",
    description: "",
    disciplineId: "mac-1",
    author: "Ana",
    cards: [
      { front: "Nervo do bíceps?", back: "Musculocutâneo" },
      { front: "Mão em garra?", back: "Ulnar" },
    ],
  });

  afterEach(async () => {
    await rm(resolve(process.env.ATLAS_STORAGE_DIR!, "flashcards-turma.json"), { force: true });
    resetSharedStoreCache();
  });

  it("publica, e só quem tem o segredo altera ou retira", async () => {
    const { id, token } = await publishSharedDeck(input);
    expect(id).toMatch(/^nervos-do-braco-[a-f0-9]{6}$/);

    const deck = await getSharedDeck(id);
    expect(deck?.cards).toHaveLength(2);
    expect(deck?.author).toBe("Ana");

    // O servidor não guarda o segredo, só o hash.
    const raw = JSON.stringify(await readSharedStore());
    expect(raw).not.toContain(token);

    await expect(updateSharedDeck(id, "errado", input)).rejects.toMatchObject({ status: 403 });
    await expect(withdrawSharedDeck(id, null)).rejects.toBeInstanceOf(SharedDeckError);

    await updateSharedDeck(id, token, { ...input, title: "Nervos do membro superior" });
    expect((await getSharedDeck(id))?.title).toBe("Nervos do membro superior");

    await withdrawSharedDeck(id, token);
    expect(await getSharedDeck(id)).toBeUndefined();
  });

  it("some da turma quando o admin oculta", async () => {
    const { id } = await publishSharedDeck(input);
    await setSharedDeckVisibility(id, "oculto");
    expect(await getSharedDeck(id)).toBeUndefined();
  });

  it("recusa matéria inexistente e baralho vazio", async () => {
    await expect(publishSharedDeck({ ...input, disciplineId: "nao-existe" })).rejects.toMatchObject({
      status: 400,
    });
    expect(() => sharedDeckInputSchema.parse({ ...input, cards: [] })).toThrow();
  });
});

describe("a ordem dos baralhos por matéria", () => {
  it("cita só baralhos que existem, e cada um na matéria dele", async () => {
    const { deckUnits } = await import("@/lib/data/flashcards/units");
    const all = [...seedDecks, ...getBankDecks()];
    for (const [disciplineId, units] of Object.entries(deckUnits)) {
      for (const unit of units) {
        for (const slug of unit.slugs) {
          const deck = all.find((d) => d.slug === slug);
          expect(deck, `${disciplineId} → ${slug}`).toBeDefined();
          expect(deck?.disciplineId, slug).toBe(disciplineId);
        }
      }
    }
  });

  it("nunca esconde um baralho: o que não está listado vai para o fim", async () => {
    const { orderDecks } = await import("@/lib/data/flashcards/units");
    const decks = [
      { slug: "semio-cranio", origin: "oficial" },
      { slug: "nao-listado", origin: "oficial" },
      { slug: "da-turma", origin: "turma" },
      { slug: "semio-pressao-arterial", origin: "oficial" },
    ];
    const units = orderDecks("ha-1", decks);
    expect(units.map((u) => u.title)).toEqual([
      "Sinais vitais",
      "Cabeça e pescoço",
      "Outros baralhos",
      "Da turma",
    ]);
    expect(units.flatMap((u) => u.decks)).toHaveLength(decks.length);
  });
});
