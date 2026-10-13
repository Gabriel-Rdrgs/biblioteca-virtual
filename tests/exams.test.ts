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
