import { describe, expect, it } from "vitest";
import { bankQuestions, questionAreas } from "@/lib/data/questions";
import { seedExams } from "@/lib/data/exams";
import {
  axisBand,
  emptyAttempt,
  isObjective,
  revisionOrder,
  scoreExam,
} from "@/lib/domain/exam-scoring";
import type { ExamAttempt, OptionLetter } from "@/lib/domain/exam-types";
import { buildDrill, countAreaQuestions, loadExam, loadExamBySlug } from "@/lib/repository/exams";

const paras = loadExamBySlug("mac-1-n1-parasitologia");

/** An attempt that answers every objective question correctly. */
function perfectAttempt(examId: string): ExamAttempt {
  const choices: Record<string, OptionLetter> = {};
  const selfMarks: Record<string, Record<string, number>> = {};
  for (const { question } of paras!.questions) {
    if (isObjective(question)) choices[question.id] = question.answer;
    else {
      selfMarks[question.id] = Object.fromEntries(
        question.items.map((item) => [item.label, item.points]),
      );
    }
  }
  return { ...emptyAttempt(examId), choices, selfMarks };
}

describe("question bank", () => {
  it("every question points at an área and an eixo that exist", () => {
    for (const question of bankQuestions) {
      const area = questionAreas.find((a) => a.id === question.areaId);
      expect(area, `área de ${question.id}`).toBeDefined();
      expect(
        area!.axes.some((axis) => axis.id === question.axisId),
        `eixo ${question.axisId} de ${question.id}`,
      ).toBe(true);
    }
  });

  it("every figure referenced by a question exists in its área", () => {
    for (const question of bankQuestions) {
      if (!question.figureId) continue;
      const area = questionAreas.find((a) => a.id === question.areaId)!;
      expect(
        area.figures.some((f) => f.id === question.figureId),
        `figura ${question.figureId} de ${question.id}`,
      ).toBe(true);
    }
  });

  it("question ids are unique", () => {
    const ids = bankQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("objective questions have four options and a key among them", () => {
    for (const question of bankQuestions) {
      if (!isObjective(question)) continue;
      expect(Object.keys(question.options).sort()).toEqual(["a", "b", "c", "d"]);
      expect(question.options[question.answer], `gabarito de ${question.id}`).toBeTruthy();
      expect(question.explanation.length).toBeGreaterThan(20);
    }
  });

  it("discursive items add up to what the question is worth", () => {
    for (const question of bankQuestions) {
      if (isObjective(question)) continue;
      const sum = question.items.reduce((total, item) => total + item.points, 0);
      expect(sum, `soma dos itens de ${question.id}`).toBeCloseTo(question.points, 5);
      for (const item of question.items) expect(item.expected.length).toBeGreaterThan(1);
    }
  });

  it("counts the Parasitologia bank", () => {
    expect(countAreaQuestions("parasitologia")).toEqual({ discursivas: 15, objetivas: 45 });
  });
});

describe("simulado N1 de Parasitologia", () => {
  it("has 60 questions worth 60 points, discursivas first", () => {
    expect(paras).toBeDefined();
    expect(paras!.questions).toHaveLength(60);
    expect(paras!.totalPoints).toBe(60);
    expect(paras!.questions.slice(0, 15).every((p) => p.question.kind === "discursiva")).toBe(true);
    expect(paras!.questions.slice(15).every((p) => p.question.kind === "objetiva")).toBe(true);
    expect(paras!.questions[15]?.number).toBe(16);
  });

  it("collects only the axes and figures its questions use", () => {
    expect(paras!.axes).toHaveLength(10);
    expect(paras!.figures).toHaveLength(22);
    expect(paras!.areas.map((a) => a.id)).toEqual(["parasitologia"]);
  });

  it("scores a perfect attempt as 60 points, 6,0 on the real scale", () => {
    const result = scoreExam(paras!, perfectAttempt(paras!.exam.id));
    expect(result.total).toBe(60);
    expect(result.objectiveEarned).toBe(45);
    expect(result.discursiveEarned).toBe(15);
    expect(result.scaled).toBe(6);
    expect(result.wrongIds).toHaveLength(0);
    expect(result.blankIds).toHaveLength(0);
    expect(result.axes.every((a) => a.percent === 100)).toBe(true);
  });

  it("scores a blank attempt as zero and lists every objective as blank", () => {
    const result = scoreExam(paras!, emptyAttempt(paras!.exam.id));
    expect(result.total).toBe(0);
    expect(result.answered).toBe(0);
    expect(result.blankIds).toHaveLength(45);
  });

  it("marks wrong answers and points at the weakest axis", () => {
    const attempt = perfectAttempt(paras!.exam.id);
    // Miss every objective question of one axis.
    const target = "tenia";
    const choices = { ...attempt.choices };
    for (const { question } of paras!.questions) {
      if (question.axisId === target && isObjective(question)) {
        choices[question.id] = question.answer === "a" ? "b" : "a";
      }
    }
    const result = scoreExam(paras!, { ...attempt, choices });
    expect(result.wrongIds).toHaveLength(4);
    const weakest = revisionOrder(result)[0];
    expect(weakest?.axis.id).toBe(target);
    expect(axisBand(weakest!.percent)).toBe("fraco");
    expect(weakest!.axis.remedy).toBeTruthy();
  });

  it("never lets self-marking exceed what an item is worth", () => {
    const first = paras!.questions[0]!.question;
    const attempt: ExamAttempt = {
      ...emptyAttempt(paras!.exam.id),
      selfMarks: { [first.id]: { a: 99, b: 99 } },
    };
    expect(scoreExam(paras!, attempt).discursiveEarned).toBe(1);
  });
});

describe("treinos montados do banco", () => {
  it("draws the requested number of questions from an área", () => {
    const drill = buildDrill("mac-1", {
      parts: [{ areaId: "parasitologia", discursivas: 2, objetivas: 10 }],
      seed: 7,
    });
    expect(drill.questions).toHaveLength(12);
    expect(drill.questions.filter((p) => p.question.kind === "discursiva")).toHaveLength(2);
    expect(drill.totalPoints).toBe(12);
    // Scaled out of 10 by default.
    const result = scoreExam(drill, emptyAttempt(drill.exam.id));
    expect(result.possible).toBe(12);
    expect(drill.exam.scaleMax).toBe(10);
  });

  it("is reproducible from its seed and spreads across axes", () => {
    const a = buildDrill("mac-1", {
      parts: [{ areaId: "parasitologia", discursivas: 0, objetivas: 10 }],
      seed: 42,
    });
    const b = buildDrill("mac-1", {
      parts: [{ areaId: "parasitologia", discursivas: 0, objetivas: 10 }],
      seed: 42,
    });
    expect(a.exam.questionIds).toEqual(b.exam.questionIds);
    // Ten questions over ten axes should touch most of them, not pile up.
    expect(new Set(a.questions.map((p) => p.question.axisId)).size).toBeGreaterThanOrEqual(8);
  });

  it("rebuilds a drill from the questions someone got wrong", () => {
    const wrong = ["paras-o16", "paras-o41", "paras-o58"];
    const drill = buildDrill("mac-1", {
      parts: [{ areaId: "parasitologia", discursivas: 0, objetivas: 10 }],
      onlyIds: wrong,
      seed: 3,
    });
    expect(drill.exam.questionIds.slice().sort()).toEqual([...wrong].sort());
  });

  it("stops at the pool size instead of repeating questions", () => {
    const drill = buildDrill("mac-1", {
      parts: [{ areaId: "parasitologia", discursivas: 50, objetivas: 0 }],
      seed: 1,
    });
    expect(drill.questions).toHaveLength(15);
    expect(new Set(drill.exam.questionIds).size).toBe(15);
  });
});

describe("catálogo de simulados", () => {
  it("every seed exam resolves all of its question ids", () => {
    for (const exam of seedExams) {
      const loaded = loadExam(exam);
      expect(loaded.questions.length, exam.slug).toBe(exam.questionIds.length);
    }
  });
});

describe("duas áreas na mesma unidade curricular", () => {
  it("counts both banks of MAC I", () => {
    expect(countAreaQuestions("anatomia")).toEqual({ discursivas: 15, objetivas: 45 });
    expect(countAreaQuestions("parasitologia")).toEqual({ discursivas: 15, objetivas: 45 });
  });

  it("counts the banks of IC I and AES 2", () => {
    expect(countAreaQuestions("iniciacao-cientifica")).toEqual({ discursivas: 15, objetivas: 45 });
    expect(countAreaQuestions("biologia-celular")).toEqual({ discursivas: 15, objetivas: 45 });
    // Quatro áreas de 60 — nenhuma questão duplicada entre elas.
    expect(bankQuestions).toHaveLength(240);
    expect(new Set(bankQuestions.map((q) => q.id)).size).toBe(240);
  });

  it("the combined N1 draws from both áreas and reports each separately", () => {
    const loaded = loadExamBySlug("mac-1-n1-completo");
    expect(loaded).toBeDefined();
    expect(loaded!.questions).toHaveLength(30);
    expect(loaded!.areas.map((a) => a.id).sort()).toEqual(["anatomia", "parasitologia"]);

    const perArea = (id: string) =>
      loaded!.questions.filter((p) => p.question.areaId === id).length;
    expect(perArea("anatomia")).toBe(15);
    expect(perArea("parasitologia")).toBe(15);

    // Discursives still come first, whichever área they belong to.
    expect(loaded!.questions.slice(0, 8).every((p) => p.question.kind === "discursiva")).toBe(true);

    const result = scoreExam(loaded!, emptyAttempt(loaded!.exam.id));
    expect(result.areas).toHaveLength(2);
    expect(result.possible).toBe(30);
    // All 30 points map onto the real exam's 6,0.
    expect(result.possible / loaded!.exam.scaleDivisor).toBe(loaded!.exam.scaleMax);
  });

  it("a perfect attempt at the combined N1 scores 6,0", () => {
    const loaded = loadExamBySlug("mac-1-n1-completo")!;
    const choices: Record<string, OptionLetter> = {};
    const selfMarks: Record<string, Record<string, number>> = {};
    for (const { question } of loaded.questions) {
      if (isObjective(question)) choices[question.id] = question.answer;
      else {
        selfMarks[question.id] = Object.fromEntries(
          question.items.map((item) => [item.label, item.points]),
        );
      }
    }
    const result = scoreExam(loaded, { ...emptyAttempt(loaded.exam.id), choices, selfMarks });
    expect(result.total).toBe(30);
    expect(result.scaled).toBe(6);
    expect(result.areas.every((a) => a.percent === 100)).toBe(true);
  });

  it("a drill can mix the two áreas", () => {
    const drill = buildDrill("mac-1", {
      parts: [
        { areaId: "anatomia", discursivas: 1, objetivas: 5 },
        { areaId: "parasitologia", discursivas: 1, objetivas: 5 },
      ],
      seed: 11,
    });
    expect(drill.questions).toHaveLength(12);
    expect(drill.areas).toHaveLength(2);
    expect(drill.questions.filter((p) => p.question.areaId === "anatomia")).toHaveLength(6);
  });

  it("the Anatomia simulado keeps its own 60 questions and 14 figures", () => {
    const loaded = loadExamBySlug("mac-1-n1-anatomia")!;
    expect(loaded.questions).toHaveLength(60);
    expect(loaded.totalPoints).toBe(60);
    expect(loaded.figures).toHaveLength(14);
    expect(loaded.axes).toHaveLength(9);
  });
});

describe("identidade de um treino", () => {
  it("gives the same id to the same set of questions, whenever it is built", () => {
    const options = {
      parts: [{ areaId: "parasitologia", discursivas: 0, objetivas: 3 }],
      onlyIds: ["paras-o16", "paras-o41", "paras-o58"],
    };
    const a = buildDrill("mac-1", { ...options, seed: 1 });
    const b = buildDrill("mac-1", { ...options, seed: 999 });
    // Different draw order, same questions: the same simulado.
    expect(a.exam.id).toBe(b.exam.id);
    expect(a.exam.id).toMatch(/^treino-/);
  });

  it("gives different ids to different sets", () => {
    const base = { parts: [{ areaId: "parasitologia", discursivas: 0, objetivas: 2 }] };
    const a = buildDrill("mac-1", { ...base, onlyIds: ["paras-o16", "paras-o17"] });
    const b = buildDrill("mac-1", { ...base, onlyIds: ["paras-o16", "paras-o18"] });
    expect(a.exam.id).not.toBe(b.exam.id);
  });
});

describe("os simulados de IC I e AES 2", () => {
  it("monta cada caderno com as 60 questões da sua área", () => {
    for (const [slug, areaId, scaleMax, divisor] of [
      ["ic-1-n1", "iniciacao-cientifica", 10, 6],
      ["aes-2-n1", "biologia-celular", 8, 7.5],
    ] as const) {
      const loaded = loadExamBySlug(slug);
      expect(loaded, slug).toBeDefined();
      expect(loaded!.questions, slug).toHaveLength(60);
      expect(loaded!.totalPoints, slug).toBe(60);
      expect(
        loaded!.areas.map((a) => a.id),
        slug,
      ).toEqual([areaId]);
      // A escala de cada unidade é diferente: 60 pontos não valem o mesmo.
      expect(loaded!.exam.scaleMax, slug).toBe(scaleMax);
      expect(loaded!.exam.scaleDivisor, slug).toBe(divisor);
      // Discursivas primeiro, como no caderno impresso.
      expect(loaded!.questions.slice(0, 15).every((p) => p.question.kind === "discursiva")).toBe(
        true,
      );
      expect(loaded!.questions.slice(15).every((p) => p.question.kind === "objetiva")).toBe(true);
    }
  });

  it("aponta cada figura citada para uma figura que existe", () => {
    for (const slug of ["ic-1-n1", "aes-2-n1"]) {
      const loaded = loadExamBySlug(slug)!;
      const have = new Set(loaded.figures.map((f) => f.id));
      for (const placed of loaded.questions) {
        if (placed.question.figureId) {
          expect(have.has(placed.question.figureId), `${slug} ${placed.question.id}`).toBe(true);
        }
      }
    }
    // As doze figuras do caderno de IC são todas usadas.
    const ic = loadExamBySlug("ic-1-n1")!;
    const usadas = new Set(ic.questions.map((p) => p.question.figureId).filter(Boolean));
    expect(usadas.size).toBe(12);
  });

  it("cobre todos os eixos declarados pela área", () => {
    for (const slug of ["ic-1-n1", "aes-2-n1"]) {
      const loaded = loadExamBySlug(slug)!;
      const cobertos = new Set(loaded.questions.map((p) => p.question.axisId));
      for (const axis of loaded.axes) {
        expect(cobertos.has(axis.id), `${slug} ${axis.id}`).toBe(true);
      }
    }
  });
});
