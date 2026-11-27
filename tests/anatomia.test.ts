import { describe, expect, it } from "vitest";
import { allTrainableMuscles, anatomyData, anatomyLandmarks, regionIndex } from "@/lib/data/anatomia";
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
  chunk,
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
    // 141 do MioLab + o oponente do dedo mínimo do pé, que faltava.
    expect(muscles.length).toBe(142);
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

describe("os ossos", () => {
  const bones = anatomyData.structures.filter((s) => s.kind === "bone");

  it("são 52, cada um com a ficha completa", () => {
    expect(bones).toHaveLength(52);
    for (const s of bones) {
      const b = s.bone;
      expect(b, s.id).toBeDefined();
      expect(s.layer).toBe("skeleton");
      for (const field of ["classification", "location", "articulations", "explanation", "clue", "examTip"] as const) {
        expect(b?.[field].trim(), `${s.id}.${field}`).not.toBe("");
      }
      expect(b?.landmarks.length, s.id).toBeGreaterThan(0);
      // A dica do treino não pode entregar o nome (o qualificador entre parênteses não conta).
      const name = fold(s.namePt.replace(/\s*\(.*\)\s*$/, ""));
      expect(fold(b?.clue ?? "").includes(name), `${s.id}: dica com o nome`).toBe(false);
    }
  });

  it("acham-se pelo nome em latim e pelo sinônimo", () => {
    const ulna = anatomyData.structures.find((s) => s.id === "ulna");
    expect(structureNames(ulna!)).toContain("cúbito");
    const patela = anatomyData.structures.find((s) => s.id === "patela");
    expect(structureNames(patela!).map(fold)).toContain("rotula");
  });

  it("cobrem as 165 peças do esqueleto do modelo, sem repetir nenhuma", () => {
    const skeleton = anatomyData.structures.filter((s) => s.layer === "skeleton");
    const parts = skeleton.flatMap((s) => s.parts);
    expect(new Set(parts).size).toBe(parts.length);
    expect(parts).toHaveLength(165);
  });
});

describe("os acidentes ósseos no modelo", () => {
  const all = Object.entries(anatomyLandmarks).flatMap(([id, list]) => list.map((m) => ({ id, m })));

  it("estão em ossos que existem, numa peça do próprio osso", () => {
    expect(all.length).toBe(120);
    for (const { id, m } of all) {
      const bone = anatomyData.structures.find((s) => s.id === id);
      expect(bone?.kind, id).toBe("bone");
      expect(bone?.parts, `${id}/${m.id}`).toContain(m.part);
    }
  });

  it("têm id único e posição dentro do corpo", () => {
    const ids = all.map(({ m }) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { m } of all) {
      expect(m.pos).toHaveLength(3);
      const [x = 0, y = 0, z = 0] = m.pos;
      // O corpo do modelo vai de 0 a 1,72 m de altura e ±0,33 m de largura.
      expect(Math.abs(x), m.id).toBeLessThan(0.35);
      expect(y, m.id).toBeGreaterThan(0);
      expect(y, m.id).toBeLessThan(1.75);
      expect(Math.abs(z), m.id).toBeLessThan(0.3);
      // Osso par: o ponto guardado é o do lado esquerdo (+X).
      if (m.mirror) expect(x, m.id).toBeGreaterThan(0);
    }
  });
});

describe("os acidentes em linha", () => {
  const lines = Object.values(anatomyLandmarks)
    .flat()
    .filter((m) => m.path);

  it("são as cristas, margens e a linha áspera, com 2 a 8 pontos dentro do corpo", () => {
    expect(lines.map((m) => m.id).sort()).toEqual(
      [
        "crista-iliaca",
        "crista-sacral-mediana",
        "espinha-escapula",
        "linha-aspera",
        "margem-anterior-tibia",
        "margem-lateral",
        "margem-medial",
      ].sort(),
    );
    for (const m of lines) {
      const path = m.path ?? [];
      expect(path.length, m.id).toBeGreaterThanOrEqual(2);
      // O shader recebe no máximo 8 pontos.
      expect(path.length, m.id).toBeLessThanOrEqual(8);
      for (const [x = 0, y = 0] of path) {
        expect(Math.abs(x), m.id).toBeLessThan(0.35);
        expect(y, m.id).toBeGreaterThan(0);
        if (m.mirror) expect(x, m.id).toBeGreaterThan(0);
      }
    }
  });
});

describe("o índice por região", () => {
  it("põe cada estrutura em exatamente um grupo de uma região", () => {
    const listed = regionIndex().flatMap((r) => [...r.bones, ...r.superficial, ...r.deep, ...r.others]);
    expect(listed).toHaveLength(anatomyData.structures.length);
    expect(new Set(listed.map((s) => s.id)).size).toBe(listed.length);
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
  const lessons = buildLessons(anatomyData, anatomyLandmarks);
  const landmarkIds = new Set(Object.values(anatomyLandmarks).flatMap((l) => l.map((m) => m.id)));

  it("cobrem cada músculo, osso e acidente uma vez, com no máximo sete por lição", () => {
    const ids = lessons.flatMap((l) => l.itemIds);
    expect(new Set(ids).size).toBe(ids.length);
    const of = (kind: string) => lessons.filter((l) => l.kind === kind).flatMap((l) => l.itemIds);
    expect(of("muscle")).toHaveLength(142);
    expect(of("bone")).toHaveLength(52);
    expect(of("landmark")).toHaveLength(120);
    for (const l of lessons) {
      expect(l.itemIds.length).toBeGreaterThan(0);
      expect(l.itemIds.length).toBeLessThanOrEqual(7);
      for (const id of l.itemIds) {
        if (l.kind === "landmark") expect(landmarkIds.has(id), id).toBe(true);
        else expect(anatomyData.structures.find((s) => s.id === id)?.kind, id).toBe(l.kind);
      }
    }
  });

  it("seguem a ordem do atlas em cada região: ossos, acidentes, superficiais, profundos", () => {
    const order = ["ossos", "acidentes", "superficiais", "profundos"];
    for (const region of anatomyData.regions) {
      const tracks = lessons.filter((l) => l.region === region.id).map((l) => order.indexOf(l.track));
      expect([...tracks].sort((a, b) => a - b), region.id).toEqual(tracks);
    }
    const head = lessons.filter((l) => l.region === "cabeca-pescoco");
    expect(head[0]?.id).toBe("cabeca-pescoco-ossos-1");
    expect(head[0]?.title).toBe("Cabeça e pescoço · Ossos 1");
    // 31 acidentes da cabeça: divididos por igual, sem lição de sobra.
    expect(head.filter((l) => l.track === "acidentes").map((l) => l.itemIds.length)).toEqual([7, 6, 6, 6, 6]);
    const thigh = lessons.filter((l) => l.region === "coxa" && l.track === "ossos");
    expect(thigh.map((l) => l.short)).toEqual(["Ossos"]);
  });

  it("dividem sem sobras", () => {
    expect(chunk([...Array(29).keys()]).map((c) => c.length)).toEqual([6, 6, 6, 6, 5]);
    expect(chunk([...Array(14).keys()]).map((c) => c.length)).toEqual([7, 7]);
    expect(chunk([1, 2])).toEqual([[1, 2]]);
    expect(chunk([])).toEqual([]);
  });

  it("os músculos começam pelos fáceis", () => {
    const first = lessons.find((l) => l.track === "superficiais");
    const structure = anatomyData.structures.find((s) => s.id === first?.itemIds[0]);
    expect(structure?.ficha?.difficulty).toBe(1);
    expect(structure?.layer).toBe("superficial");
  });

  it("acidente vira item de treino com o ponto e sem entregar o nome na dica", () => {
    const items = allTrainableMuscles();
    const marks = items.filter((m) => m.kind === "landmark");
    expect(marks).toHaveLength(120);
    for (const m of marks) {
      expect(m.marker, m.id).toBeDefined();
      expect(m.parts).toHaveLength(1);
      const name = fold(m.namePt.replace(/\s*\(.*\)\s*$/, ""));
      expect(fold(m.clue).includes(name), `${m.id}: dica com o nome`).toBe(false);
    }
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
