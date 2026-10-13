import { seedExams } from "@/lib/data/exams";
import { bankQuestions, questionAreas } from "@/lib/data/questions";
import type {
  AreaId,
  BankQuestion,
  Exam,
  ExamAxis,
  ExamBlueprintPart,
  ExamFigure,
  LoadedExam,
  PlacedQuestion,
  QuestionArea,
  QuestionId,
} from "@/lib/domain/exam-types";
import type { DisciplineId } from "@/lib/domain/types";

/**
 * Reading side of the question bank.
 *
 * A simulado is resolved here: its question ids are looked up, numbered in
 * the order of the printed sheet, and the áreas, eixos and figures actually
 * used are collected. Nothing is duplicated — a question cited by three
 * simulados is stored once.
 */

const byId = new Map<QuestionId, BankQuestion>(bankQuestions.map((q) => [q.id, q]));
const areaById = new Map<AreaId, QuestionArea>(questionAreas.map((a) => [a.id, a]));

export function getQuestionAreas(disciplineId?: DisciplineId): readonly QuestionArea[] {
  return disciplineId
    ? questionAreas.filter((a) => a.disciplineId === disciplineId)
    : questionAreas;
}

export function getQuestionArea(id: AreaId): QuestionArea | undefined {
  return areaById.get(id);
}

export function getBankQuestion(id: QuestionId): BankQuestion | undefined {
  return byId.get(id);
}

/** Every question of one área, discursivas first. */
export function getAreaQuestions(areaId: AreaId): readonly BankQuestion[] {
  return bankQuestions.filter((q) => q.areaId === areaId);
}

export function countAreaQuestions(areaId: AreaId): { discursivas: number; objetivas: number } {
  const questions = getAreaQuestions(areaId);
  return {
    discursivas: questions.filter((q) => q.kind === "discursiva").length,
    objetivas: questions.filter((q) => q.kind === "objetiva").length,
  };
}

export function getExams(disciplineId?: DisciplineId): readonly Exam[] {
  return seedExams.filter(
    (exam) =>
      exam.visibility === "visivel" && (!disciplineId || exam.disciplineId === disciplineId),
  );
}

export function getExamBySlug(slug: string): Exam | undefined {
  return seedExams.find((exam) => exam.slug === slug && exam.visibility === "visivel");
}

/** Resolves an exam's question ids into numbered questions with their context. */
export function loadExam(exam: Exam): LoadedExam {
  const questions: PlacedQuestion[] = [];
  for (const id of exam.questionIds) {
    const question = byId.get(id);
    if (question) questions.push({ number: questions.length + 1, question });
  }

  const areaIds = [...new Set(questions.map((p) => p.question.areaId))];
  const areas = areaIds.flatMap((id) => {
    const area = areaById.get(id);
    return area ? [area] : [];
  });

  const usedAxisIds = new Set(questions.map((p) => p.question.axisId));
  const axes: ExamAxis[] = areas.flatMap((area) =>
    area.axes.filter((axis) => usedAxisIds.has(axis.id)),
  );

  const usedFigureIds = new Set(
    questions.flatMap((p) => (p.question.figureId ? [p.question.figureId] : [])),
  );
  const figures: ExamFigure[] = areas.flatMap((area) =>
    area.figures.filter((figure) => usedFigureIds.has(figure.id)),
  );

  return {
    exam,
    questions,
    areas,
    axes,
    figures,
    totalPoints: questions.reduce((sum, p) => sum + p.question.points, 0),
  };
}

export function loadExamBySlug(slug: string): LoadedExam | undefined {
  const exam = getExamBySlug(slug);
  return exam ? loadExam(exam) : undefined;
}

/** Deterministic shuffle, so the same seed rebuilds the same drill. */
function shuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let state = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const j = state % (i + 1);
    const a = out[i]!;
    out[i] = out[j]!;
    out[j] = a;
  }
  return out;
}

export interface DrillOptions {
  readonly parts: readonly ExamBlueprintPart[];
  readonly title?: string;
  readonly seed?: number;
  /** Restrict to these questions — used to redo the ones someone got wrong. */
  readonly onlyIds?: readonly QuestionId[];
  readonly scaleMax?: number;
}

/**
 * Builds a simulado from the bank: so many discursivas and objetivas of
 * each área, drawn at random but spread across the axes so a drill does
 * not land entirely on one theme.
 */
export function buildDrill(disciplineId: DisciplineId, options: DrillOptions): LoadedExam {
  const seed = options.seed ?? Date.now() % 100000;
  const allowed = options.onlyIds ? new Set(options.onlyIds) : null;
  const picked: BankQuestion[] = [];

  for (const part of options.parts) {
    const pool = getAreaQuestions(part.areaId).filter((q) => !allowed || allowed.has(q.id));
    for (const [kind, wanted] of [
      ["discursiva", part.discursivas],
      ["objetiva", part.objetivas],
    ] as const) {
      if (wanted <= 0) continue;
      const ofKind = pool.filter((q) => q.kind === kind);

      // Round-robin over the axes so the draw stays balanced.
      const byAxis = new Map<string, BankQuestion[]>();
      for (const q of shuffle(ofKind, seed + kind.length)) {
        byAxis.set(q.axisId, [...(byAxis.get(q.axisId) ?? []), q]);
      }
      const queues = shuffle([...byAxis.values()], seed);
      const chosen: BankQuestion[] = [];
      while (chosen.length < wanted) {
        const before = chosen.length;
        for (const queue of queues) {
          if (chosen.length >= wanted) break;
          const next = queue.shift();
          if (next) chosen.push(next);
        }
        if (chosen.length === before) break; // pool exhausted
      }
      picked.push(...chosen);
    }
  }

  // Printed order: discursivas first, then objetivas.
  const ordered = [
    ...picked.filter((q) => q.kind === "discursiva"),
    ...picked.filter((q) => q.kind === "objetiva"),
  ];
  const points = ordered.reduce((sum, q) => sum + q.points, 0);
  const scaleMax = options.scaleMax ?? 10;

  const exam: Exam = {
    id: `treino-${seed}`,
    slug: `treino-${seed}`,
    disciplineId,
    title: options.title ?? "Treino",
    assessment: "treino",
    semester: "",
    description: "Simulado montado a partir do banco de questões da turma.",
    instructions: [],
    scaleMax,
    scaleDivisor: points > 0 ? points / scaleMax : 1,
    questionIds: ordered.map((q) => q.id),
    visibility: "visivel",
    origin: "seed",
    addedAt: new Date().toISOString().slice(0, 10),
  };

  // Resolve against the picked set, which may include generated ids.
  const questions: PlacedQuestion[] = ordered.map((question, i) => ({ number: i + 1, question }));
  const areaIds = [...new Set(questions.map((p) => p.question.areaId))];
  const areas = areaIds.flatMap((id) => {
    const area = areaById.get(id);
    return area ? [area] : [];
  });
  const usedAxisIds = new Set(questions.map((p) => p.question.axisId));
  const usedFigureIds = new Set(
    questions.flatMap((p) => (p.question.figureId ? [p.question.figureId] : [])),
  );

  return {
    exam,
    questions,
    areas,
    axes: areas.flatMap((a) => a.axes.filter((axis) => usedAxisIds.has(axis.id))),
    figures: areas.flatMap((a) => a.figures.filter((f) => usedFigureIds.has(f.id))),
    totalPoints: points,
  };
}
