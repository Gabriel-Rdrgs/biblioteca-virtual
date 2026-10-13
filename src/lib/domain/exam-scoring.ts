import type {
  AreaResult,
  AxisResult,
  BankQuestion,
  ExamAttempt,
  ExamResult,
  LoadedExam,
  ObjectiveQuestion,
  QuestionId,
} from "./exam-types";

/**
 * Turns an attempt into a result.
 *
 * Objective questions are marked against the key; discursive ones take the
 * marks the student gave themselves against the scheme, clamped to what the
 * item is worth so a generous reading cannot inflate the total. Everything
 * is then totalled per área and per eixo, which is the number that says
 * what to study next.
 */

export function isObjective(question: BankQuestion): question is ObjectiveQuestion {
  return question.kind === "objetiva";
}

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, max);
}

/** Marks one question, objective or discursive. */
export function scoreQuestion(question: BankQuestion, attempt: ExamAttempt): number {
  if (isObjective(question)) {
    return attempt.choices[question.id] === question.answer ? question.points : 0;
  }
  const given = attempt.selfMarks[question.id] ?? {};
  const sum = question.items.reduce(
    (total, item) => total + clamp(given[item.label] ?? 0, item.points),
    0,
  );
  return clamp(sum, question.points);
}

/** True once the student has recorded something for this question. */
export function isAnswered(question: BankQuestion, attempt: ExamAttempt): boolean {
  if (isObjective(question)) return Boolean(attempt.choices[question.id]);
  const given = attempt.selfMarks[question.id];
  return Boolean(given && Object.keys(given).length > 0);
}

export function emptyAttempt(examId: string): ExamAttempt {
  return { examId, startedAt: new Date().toISOString(), choices: {}, selfMarks: {} };
}

export function scoreExam(loaded: LoadedExam, attempt: ExamAttempt): ExamResult {
  let objectiveEarned = 0;
  let objectivePossible = 0;
  let discursiveEarned = 0;
  let discursivePossible = 0;
  let answered = 0;
  const wrongIds: QuestionId[] = [];
  const blankIds: QuestionId[] = [];

  const perAxis = new Map<string, { earned: number; possible: number; ids: QuestionId[] }>();
  const perArea = new Map<string, { earned: number; possible: number }>();

  for (const { question } of loaded.questions) {
    const earned = scoreQuestion(question, attempt);

    const axis = perAxis.get(question.axisId) ?? { earned: 0, possible: 0, ids: [] };
    axis.earned += earned;
    axis.possible += question.points;
    axis.ids.push(question.id);
    perAxis.set(question.axisId, axis);

    const area = perArea.get(question.areaId) ?? { earned: 0, possible: 0 };
    area.earned += earned;
    area.possible += question.points;
    perArea.set(question.areaId, area);

    if (isObjective(question)) {
      objectiveEarned += earned;
      objectivePossible += question.points;
      if (!attempt.choices[question.id]) blankIds.push(question.id);
      else if (earned === 0) wrongIds.push(question.id);
    } else {
      discursiveEarned += earned;
      discursivePossible += question.points;
    }

    if (isAnswered(question, attempt)) answered++;
  }

  const axes: AxisResult[] = loaded.axes.flatMap((axis) => {
    const bucket = perAxis.get(axis.id);
    if (!bucket || bucket.possible === 0) return [];
    const areaId =
      loaded.questions.find((p) => p.question.axisId === axis.id)?.question.areaId ?? "";
    return [
      {
        axis,
        areaId,
        earned: bucket.earned,
        possible: bucket.possible,
        percent: (bucket.earned / bucket.possible) * 100,
        questionIds: bucket.ids,
      },
    ];
  });

  const areas: AreaResult[] = loaded.areas.flatMap((area) => {
    const bucket = perArea.get(area.id);
    if (!bucket || bucket.possible === 0) return [];
    return [
      {
        area,
        earned: bucket.earned,
        possible: bucket.possible,
        percent: (bucket.earned / bucket.possible) * 100,
      },
    ];
  });

  const total = objectiveEarned + discursiveEarned;

  return {
    objectiveEarned,
    objectivePossible,
    discursiveEarned,
    discursivePossible,
    total,
    possible: objectivePossible + discursivePossible,
    scaled: loaded.exam.scaleDivisor > 0 ? total / loaded.exam.scaleDivisor : 0,
    answered,
    areas,
    axes,
    wrongIds,
    blankIds,
  };
}

/** The printed sheet's three bands: under 60%, 60–80%, over 80%. */
export type AxisBand = "fraco" | "medio" | "forte";

export function axisBand(percent: number): AxisBand {
  if (percent < 60) return "fraco";
  if (percent <= 80) return "medio";
  return "forte";
}

/** Weakest axes first — the revision order. */
export function revisionOrder(result: ExamResult): readonly AxisResult[] {
  return [...result.axes].sort((a, b) => a.percent - b.percent || b.possible - a.possible);
}

export function formatMark(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
