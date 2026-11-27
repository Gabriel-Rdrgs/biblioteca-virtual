import { describe, expect, it } from "vitest";
import { practiceData, TOPIC_ATLAS } from "@/lib/data/pratica";
import { anatomyData } from "@/lib/data/anatomia";
import {
  buildExam,
  scoreByTopic,
  timings,
  weakTopics,
  type ExamAnswer,
} from "@/lib/domain/practice";

const topicIds = new Set(practiceData.topics.map((t) => t.id));

describe("os dados da prova prática", () => {
  it("têm os 15 temas, as 57 estações, o banco de 80 e as 5 cadeias", () => {
    expect(practiceData.topics).toHaveLength(15);
    expect(practiceData.stations).toHaveLength(57);
    expect(practiceData.bank).toHaveLength(80);
    expect(practiceData.chains).toHaveLength(5);
    expect(practiceData.case.length).toBeGreaterThan(0);
  });

  it("cada estação aponta para um tema e uma figura que existem", () => {
    for (const s of practiceData.stations) {
      expect(topicIds.has(s.topic), s.id).toBe(true);
      expect(practiceData.figures[s.figure], s.id).toBeDefined();
      expect(s.questions.length, s.id).toBe(2);
      for (const q of s.questions) {
        if (q.figure) expect(practiceData.figures[q.figure], `${s.id}: ${q.figure}`).toBeDefined();
        if (q.type === "mc") {
          expect(q.options.length, s.id).toBeGreaterThanOrEqual(2);
          expect(q.options[q.answer], s.id).toBeDefined();
          expect(new Set(q.options).size, `${s.id}: alternativas repetidas`).toBe(q.options.length);
        } else {
          expect(q.model.trim(), s.id).not.toBe("");
        }
      }
      for (const p of s.points ?? []) {
        expect(practiceData.figures[s.figure]?.points?.[p], `${s.id}: ponto ${p}`).toBeDefined();
      }
    }
  });

  it("as figuras têm arquivo com nome servível e tamanho", () => {
    for (const [key, f] of Object.entries(practiceData.figures)) {
      // A rota das figuras só aceita este formato de nome.
      expect(f.file, key).toMatch(/^pratica-[a-z0-9][a-z0-9.-]{2,120}$/);
      expect(f.width, key).toBeGreaterThan(0);
      expect(f.height, key).toBeGreaterThan(0);
    }
  });

  it("o texto não traz HTML — só **negrito** e quebras de linha", () => {
    const json = JSON.stringify(practiceData);
    expect(json).not.toMatch(/<\/?(b|br|i|span|div|p)\b/i);
  });

  it("os atalhos para o corpo em 3D apontam para estruturas que existem", () => {
    const ids = new Set(anatomyData.structures.map((s) => s.id));
    for (const [topic, links] of Object.entries(TOPIC_ATLAS)) {
      expect(topicIds.has(topic), topic).toBe(true);
      for (const l of links) expect(ids.has(l.id), `${topic} → ${l.id}`).toBe(true);
    }
  });
});

describe("o simulado", () => {
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  it("tem dez estações alternando Anatomia com Embriologia/Histologia, sem repetir", () => {
    for (let n = 0; n < 20; n++) {
      const exam = buildExam(practiceData.stations, random);
      expect(exam).toHaveLength(10);
      expect(new Set(exam.map((s) => s.id)).size).toBe(10);
      exam.forEach((s, i) => {
        if (i % 2 === 0) expect(s.area).toBe("anatomia");
        else expect(s.area).not.toBe("anatomia");
      });
      const other = exam.filter((s) => s.area !== "anatomia");
      expect(other.filter((s) => s.area === "embriologia").length).toBeGreaterThanOrEqual(2);
      expect(other.filter((s) => s.area === "histologia").length).toBeGreaterThanOrEqual(2);
    }
  });

  it("usa o tempo da prova ou o do treino rápido", () => {
    expect(timings(false)).toEqual({ read: 90, answer: 90 });
    expect(timings(true)).toEqual({ read: 30, answer: 60 });
  });

  it("aponta os temas abaixo de 70%", () => {
    const a = (topic: string, ok: boolean): ExamAnswer => ({
      stationId: "x",
      topic,
      area: "anatomia",
      q: "?",
      answer: "!",
      ok,
      figure: "n400",
    });
    const answers = [a("umero", true), a("umero", true), a("femur", true), a("femur", false)];
    expect(scoreByTopic(answers)).toEqual([
      { topic: "umero", correct: 2, total: 2 },
      { topic: "femur", correct: 1, total: 2 },
    ]);
    expect(weakTopics(answers)).toEqual(["femur"]);
  });
});
