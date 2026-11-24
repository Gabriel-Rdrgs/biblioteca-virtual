import { describe, expect, it } from "vitest";
import { anatomyData } from "@/lib/data/anatomia";
import { fold, meshKey, structureNames } from "@/lib/domain/anatomy-types";
import {
  giveUp,
  isCorrect,
  keyOf,
  pressKey,
  splitQualifier,
  startTyping,
  toSlots,
  wordsPerMinute,
  type TypingState,
} from "@/lib/domain/anatomy-typing";
import {
  buildLessons,
  cardStatus,
  dueIds,
  isDue,
  scheduleAnswer,
  shuffle,
} from "@/lib/domain/anatomy-lessons";

describe("os dados da anatomia 3D", () => {
  it("têm ids únicos, cada estrutura numa região que existe", () => {
    const ids = anatomyData.structures.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const regions = new Set(anatomyData.regions.map((r) => r.id));
    for (const s of anatomyData.structures) expect(regions.has(s.region), s.id).toBe(true);
  });

  it("toda estrutura aponta para ao menos uma peça do modelo", () => {
    for (const s of anatomyData.structures) {
      expect(s.parts.length, s.id).toBeGreaterThan(0);
      for (const part of s.parts) expect(part, s.id).toBe(part.toLowerCase());
    }
  });

  it("todo músculo tem a ficha completa", () => {
    const muscles = anatomyData.structures.filter((s) => s.kind === "muscle");
    expect(muscles.length).toBe(141);
    for (const s of muscles) {
      const f = s.ficha;
      expect(f, s.id).toBeDefined();
      for (const field of ["origin", "insertion", "action", "innervation"] as const) {
        expect(f?.[field].trim(), `${s.id}.${field}`).not.toBe("");
      }
    }
  });

  it("cada músculo tem a própria ficha, não a do vizinho", () => {
    // Regressão: a extração lia além do fim de algumas fichas e as trocava.
    const names = anatomyData.structures.flatMap((s) => (s.ficha ? [s.ficha.nameEn] : []));
    expect(new Set(names).size).toBe(names.length);
    const frontal = anatomyData.structures.find((s) => s.id === "occipitofrontal-ventre-frontal");
    expect(frontal?.ficha?.nameEn).toMatch(/frontal/i);
  });

  it("uma peça não pertence a duas estruturas", () => {
    const seen = new Map<string, string>();
    for (const s of anatomyData.structures) {
      for (const part of s.parts) {
        expect(seen.get(part), `${part} em ${s.id} e ${seen.get(part)}`).toBeUndefined();
        seen.set(part, s.id);
      }
    }
  });
});

describe("a chave que liga malha e estrutura", () => {
  it("tira o lado e normaliza", () => {
    expect(meshKey("Left Pronator teres")).toBe("pronator teres");
    expect(meshKey("right  superficial part of masseter")).toBe("superficial part of masseter");
    expect(meshKey("Atlas")).toBe("atlas");
  });

  it("busca sem acento e por qualquer nome", () => {
    const esterno = anatomyData.structures.find((s) => s.id === "esternocleidomastoideo");
    expect(esterno).toBeDefined();
    const nomes = structureNames(esterno!).map(fold);
    expect(nomes).toContain(fold("Esternocleidomastóideo"));
    expect(nomes.some((n) => n.includes("sternocleidomastoid"))).toBe(true);
  });
});

/* ------------------------------------------------ digitar o nome */

function typeAll(text: string, name: string, maxWrong = 3): TypingState {
  const slots = toSlots(name);
  let state = startTyping(slots);
  for (const ch of text) state = pressKey(state, slots, ch, maxWrong).state;
  return state;
}

describe("digitar o nome", () => {
  it("ignora acento e maiúscula", () => {
    expect(keyOf("Ó")).toBe("o");
    expect(keyOf("ç")).toBe("c");
    expect(keyOf("-")).toBeNull();
    const name = "Esternocleidomastóideo";
    const state = typeAll("esternocleidomastoideo", name);
    expect(state.done).toBe(true);
    expect(isCorrect(state, toSlots(name))).toBe(true);
  });

  it("aceita omitir o espaço e pula a pontuação", () => {
    const state = typeAll("orbicularda boca", "Orbicular da boca");
    expect(state.done).toBe(true);
    expect(state.errors).toBe(0);
    expect(typeAll("tibialanterior", "Tibial-anterior").done).toBe(true);
  });

  it("três erros na mesma letra revelam e a resposta de memória não conta", () => {
    const name = "Masseter";
    const slots = toSlots(name);
    let state = startTyping(slots);
    for (const ch of "mas") state = pressKey(state, slots, ch, 3).state;
    for (const ch of "xxx") state = pressKey(state, slots, ch, 3).state;
    expect(state.revealed).toEqual([3]);
    for (const ch of "eter") state = pressKey(state, slots, ch, 3).state;
    expect(state.done).toBe(true);
    expect(isCorrect(state, slots)).toBe(false);
  });

  it("na primeira rodada nunca revela", () => {
    const slots = toSlots("Temporal");
    let state = startTyping(slots);
    for (let i = 0; i < 10; i++) state = pressKey(state, slots, "x", Infinity).state;
    expect(state.revealed).toEqual([]);
    expect(state.pos).toBe(0);
  });

  it("um deslize passa; muitos não", () => {
    const slots = toSlots("Masseter");
    let state = startTyping(slots);
    state = pressKey(state, slots, "n", 3).state;
    for (const ch of "masseter") state = pressKey(state, slots, ch, 3).state;
    expect(isCorrect(state, slots)).toBe(true);
    state = pressKey(state, slots, "x", 3).state; // terminado: ignora
    expect(state.errors).toBe(1);
  });

  it("não sei revela o resto", () => {
    const slots = toSlots("Platisma");
    const state = giveUp(startTyping(slots), slots);
    expect(state.done).toBe(true);
    expect(state.revealed).toHaveLength(8);
    expect(isCorrect(state, slots)).toBe(false);
  });

  it("separa o qualificador e calcula a velocidade", () => {
    expect(splitQualifier("Abdutor do dedo mínimo (pé)")).toEqual({
      text: "Abdutor do dedo mínimo",
      qualifier: "pé",
    });
    expect(splitQualifier("Masseter")).toEqual({ text: "Masseter", qualifier: null });
    expect(wordsPerMinute(100, 60_000)).toBe(20);
    expect(wordsPerMinute(10, 500)).toBe(0);
  });
});

describe("lições e revisão espaçada", () => {
  const lessons = buildLessons(anatomyData);

  it("cobrem cada músculo treinável uma vez, com no máximo sete por lição", () => {
    const ids = lessons.flatMap((l) => l.muscleIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(141);
    for (const l of lessons) {
      expect(l.muscleIds.length).toBeGreaterThan(0);
      expect(l.muscleIds.length).toBeLessThanOrEqual(7);
    }
    expect(lessons.filter((l) => l.region === "cabeca-pescoco").map((l) => l.muscleIds.length)).toEqual([
      6, 6, 6, 6, 5,
    ]);
  });

  it("começam pelos fáceis e superficiais", () => {
    const first = lessons[0];
    const structure = anatomyData.structures.find((s) => s.id === first?.muscleIds[0]);
    expect(structure?.ficha?.difficulty).toBe(1);
    expect(structure?.layer).toBe("superficial");
  });

  it("acerto espaça 1, 3, 7, 14, 30 dias; erro volta hoje", () => {
    const day = 86_400_000;
    let t = new Date(2026, 10, 24, 10).getTime();
    let card = scheduleAnswer(undefined, true, t);
    expect(card.intervalDays).toBe(1);
    expect(isDue(card, t)).toBe(false);
    expect(cardStatus(card)).toBe("learning");
    for (const expected of [3, 7, 14, 30]) {
      t = card.due;
      card = scheduleAnswer(card, true, t);
      expect(card.intervalDays).toBe(expected);
    }
    expect(cardStatus(card)).toBe("mastered");
    // Acertar de novo antes da hora não adianta.
    const early = scheduleAnswer(card, true, t + day);
    expect(early.intervalDays).toBe(30);
    const missed = scheduleAnswer(card, false, t + day);
    expect(missed.intervalDays).toBe(0);
    expect(isDue(missed, t + day)).toBe(true);
    expect(dueIds({ a: missed, b: card }, t + day)).toEqual(["a"]);
  });

  it("embaralha sem perder ninguém", () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const out = shuffle([1, 2, 3, 4, 5], random);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
