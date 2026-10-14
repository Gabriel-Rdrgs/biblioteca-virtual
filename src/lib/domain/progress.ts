import type { StoredAttempt } from "@/lib/exam-storage";

/**
 * What the history of attempts says about someone's semester.
 *
 * Pure functions over the stored summaries: no bank, no answer key, no
 * network. A single score says little; the point here is the axis seen
 * across attempts — whether the thing you were weak at a month ago is
 * still weak — and that only exists once there is more than one attempt.
 */

export interface AxisProgress {
  readonly id: string;
  readonly label: string;
  /** How many attempts included this axis. */
  readonly attempts: number;
  readonly earned: number;
  readonly possible: number;
  readonly percent: number;
  /** Percentage in the earliest and the most recent attempt that had it. */
  readonly first: number;
  readonly latest: number;
  /** latest − first, in points of percentage. Zero with a single attempt. */
  readonly trend: number;
}

export interface ExamProgress {
  readonly examId: string;
  readonly title: string;
  readonly attempts: number;
  /** Scaled marks in order, oldest first — the line of a small chart. */
  readonly marks: readonly number[];
  readonly scaleMax: number;
  readonly best: number;
  readonly latest: number;
  readonly href?: string;
}

export interface ProgressSummary {
  readonly attempts: number;
  readonly totalSeconds: number;
  readonly questionsAnswered: number;
  readonly axes: readonly AxisProgress[];
  readonly exams: readonly ExamProgress[];
  /** Weakest first, among axes seen at least once. */
  readonly toRevise: readonly AxisProgress[];
  /** Axes at 80% or more in the most recent attempt that had them. */
  readonly solid: readonly AxisProgress[];
  readonly firstAt?: string;
  readonly lastAt?: string;
}

const pct = (earned: number, possible: number) => (possible > 0 ? (earned / possible) * 100 : 0);

/** Oldest first: progress only reads in chronological order. */
function chronological(attempts: readonly StoredAttempt[]): StoredAttempt[] {
  return [...attempts]
    .filter((a) => a.finishedAt && a.result)
    .sort((a, b) => (a.finishedAt ?? "").localeCompare(b.finishedAt ?? ""));
}

export function summariseProgress(attempts: readonly StoredAttempt[]): ProgressSummary {
  const history = chronological(attempts);

  const axisBuckets = new Map<
    string,
    { label: string; earned: number; possible: number; marks: number[] }
  >();
  const examBuckets = new Map<
    string,
    { title: string; marks: number[]; scaleMax: number; href?: string }
  >();

  let totalSeconds = 0;
  let questionsAnswered = 0;

  for (const attempt of history) {
    const result = attempt.result!;
    totalSeconds += attempt.seconds ?? 0;
    questionsAnswered +=
      Object.keys(attempt.choices).length + Object.keys(attempt.selfMarks).length;

    for (const axis of result.axes) {
      const bucket = axisBuckets.get(axis.id) ?? {
        label: axis.label,
        earned: 0,
        possible: 0,
        marks: [],
      };
      bucket.earned += axis.earned;
      bucket.possible += axis.possible;
      bucket.marks.push(pct(axis.earned, axis.possible));
      axisBuckets.set(axis.id, bucket);
    }

    const exam = examBuckets.get(attempt.examId) ?? {
      title: attempt.title ?? attempt.examId,
      marks: [],
      scaleMax: result.scaleMax,
      ...(attempt.href ? { href: attempt.href } : {}),
    };
    exam.marks.push(result.scaled);
    examBuckets.set(attempt.examId, exam);
  }

  const axes: AxisProgress[] = [...axisBuckets.entries()].map(([id, bucket]) => {
    const first = bucket.marks[0] ?? 0;
    const latest = bucket.marks[bucket.marks.length - 1] ?? 0;
    return {
      id,
      label: bucket.label,
      attempts: bucket.marks.length,
      earned: bucket.earned,
      possible: bucket.possible,
      percent: pct(bucket.earned, bucket.possible),
      first,
      latest,
      trend: latest - first,
    };
  });

  const exams: ExamProgress[] = [...examBuckets.entries()].map(([examId, bucket]) => ({
    examId,
    title: bucket.title,
    attempts: bucket.marks.length,
    marks: bucket.marks,
    scaleMax: bucket.scaleMax,
    best: Math.max(...bucket.marks),
    latest: bucket.marks[bucket.marks.length - 1] ?? 0,
    ...(bucket.href ? { href: bucket.href } : {}),
  }));

  return {
    attempts: history.length,
    totalSeconds,
    questionsAnswered,
    axes: [...axes].sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    exams,
    // Judge by where the person stands now, not by the average of a bad start.
    toRevise: [...axes].filter((a) => a.latest < 60).sort((a, b) => a.latest - b.latest),
    solid: [...axes].filter((a) => a.latest >= 80).sort((a, b) => b.latest - a.latest),
    ...(history[0]?.finishedAt ? { firstAt: history[0].finishedAt } : {}),
    ...(history[history.length - 1]?.finishedAt
      ? { lastAt: history[history.length - 1]!.finishedAt }
      : {}),
  };
}

/** "2 h 15" / "48 min" — study time as a person would say it. */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
}

/** "subiu 18 pontos" / "caiu 5 pontos" / "estável". */
export function trendLabel(trend: number): string {
  const rounded = Math.round(trend);
  if (rounded === 0) return "estável";
  return rounded > 0 ? `subiu ${rounded} pontos` : `caiu ${Math.abs(rounded)} pontos`;
}
