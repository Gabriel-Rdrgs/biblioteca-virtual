import { describe, expect, it } from "vitest";
import {
  formatDuration,
  summariseProgress,
  trendLabel,
  type ProgressSummary,
} from "@/lib/domain/progress";
import type { StoredAttempt, StoredBreakdown } from "@/lib/exam-storage";

/**
 * The progress page exists for one claim: that the axis you were weak at
 * is or is not still weak. These tests pin that claim down.
 */

function attempt(
  finishedAt: string,
  axes: readonly [string, number, number][],
  extra: Partial<StoredAttempt> = {},
): StoredAttempt {
  const breakdown: StoredBreakdown[] = axes.map(([id, earned, possible]) => ({
    id,
    label: id.toUpperCase(),
    earned,
    possible,
  }));
  const total = breakdown.reduce((sum, a) => sum + a.earned, 0);
  const possible = breakdown.reduce((sum, a) => sum + a.possible, 0);
  return {
    examId: "exame",
    startedAt: finishedAt,
    finishedAt,
    choices: {},
    selfMarks: {},
    seconds: 600,
    title: "Simulado",
    result: {
      total,
      possible,
      scaled: possible > 0 ? (total / possible) * 10 : 0,
      scaleMax: 10,
      objectiveEarned: total,
      objectivePossible: possible,
      axes: breakdown,
      areas: [],
    },
    ...extra,
  };
}

describe("progresso", () => {
  it("is empty and harmless with no history", () => {
    const summary = summariseProgress([]);
    expect(summary.attempts).toBe(0);
    expect(summary.axes).toEqual([]);
    expect(summary.toRevise).toEqual([]);
    expect(summary.totalSeconds).toBe(0);
  });

  it("ignores attempts that were never corrected", () => {
    const open: StoredAttempt = {
      examId: "exame",
      startedAt: "2026-10-01T10:00:00Z",
      choices: {},
      selfMarks: {},
    };
    expect(
      summariseProgress([open, attempt("2026-10-02T10:00:00Z", [["a", 5, 10]])]).attempts,
    ).toBe(1);
  });

  it("reads an axis in chronological order, whatever order it is given", () => {
    const older = attempt("2026-10-01T10:00:00Z", [["tenia", 2, 10]]);
    const newer = attempt("2026-10-20T10:00:00Z", [["tenia", 9, 10]]);

    for (const order of [
      [older, newer],
      [newer, older],
    ]) {
      const axis = summariseProgress(order).axes[0]!;
      expect(axis.first).toBe(20);
      expect(axis.latest).toBe(90);
      expect(Math.round(axis.trend)).toBe(70);
      expect(axis.attempts).toBe(2);
      // The running total spans both attempts.
      expect(axis.earned).toBe(11);
      expect(axis.possible).toBe(20);
    }
  });

  it("judges what to revise by where you stand now, not by the average", () => {
    // A terrible start and a good finish averages under 60, but the person
    // has clearly learned it: it must not be flagged for revision.
    const summary = summariseProgress([
      attempt("2026-10-01T10:00:00Z", [["recuperado", 0, 10]]),
      attempt("2026-10-20T10:00:00Z", [["recuperado", 9, 10]]),
    ]);
    expect(Math.round(summary.axes[0]!.percent)).toBe(45);
    expect(summary.toRevise).toEqual([]);
    expect(summary.solid.map((a) => a.id)).toEqual(["recuperado"]);
  });

  it("flags an axis that got worse, and orders the weakest first", () => {
    const summary: ProgressSummary = summariseProgress([
      attempt("2026-10-01T10:00:00Z", [
        ["piorou", 9, 10],
        ["ruim", 3, 10],
      ]),
      attempt("2026-10-20T10:00:00Z", [
        ["piorou", 2, 10],
        ["ruim", 1, 10],
      ]),
    ]);
    expect(summary.toRevise.map((a) => a.id)).toEqual(["ruim", "piorou"]);
    expect(trendLabel(summary.axes.find((a) => a.id === "piorou")!.trend)).toBe("caiu 70 pontos");
  });

  it("totals time and answers across attempts", () => {
    const summary = summariseProgress([
      attempt("2026-10-01T10:00:00Z", [["a", 1, 2]], {
        seconds: 1800,
        choices: { q1: "a", q2: "b" },
      }),
      attempt("2026-10-02T10:00:00Z", [["a", 2, 2]], {
        seconds: 900,
        choices: { q1: "a" },
        selfMarks: { d1: { a: 0.5 } },
      }),
    ]);
    expect(summary.totalSeconds).toBe(2700);
    expect(summary.questionsAnswered).toBe(4);
  });

  it("keeps each simulado's marks in order and remembers the best", () => {
    const summary = summariseProgress([
      attempt("2026-10-01T10:00:00Z", [["a", 4, 10]]),
      attempt("2026-10-05T10:00:00Z", [["a", 9, 10]]),
      attempt("2026-10-09T10:00:00Z", [["a", 7, 10]]),
    ]);
    const exam = summary.exams[0]!;
    expect(exam.marks).toEqual([4, 9, 7]);
    expect(exam.best).toBe(9);
    expect(exam.latest).toBe(7);
    expect(exam.attempts).toBe(3);
  });

  it("separates different simulados", () => {
    const summary = summariseProgress([
      attempt("2026-10-01T10:00:00Z", [["a", 5, 10]], { examId: "paras", title: "Parasitologia" }),
      attempt("2026-10-02T10:00:00Z", [["b", 8, 10]], { examId: "anat", title: "Anatomia" }),
    ]);
    expect(summary.exams.map((e) => e.examId).sort()).toEqual(["anat", "paras"]);
    expect(summary.axes).toHaveLength(2);
  });

  it("says a single attempt has no trend yet", () => {
    const axis = summariseProgress([attempt("2026-10-01T10:00:00Z", [["a", 5, 10]])]).axes[0]!;
    expect(axis.trend).toBe(0);
    expect(trendLabel(axis.trend)).toBe("estável");
  });

  it("writes durations the way a person says them", () => {
    expect(formatDuration(45)).toBe("45 s");
    expect(formatDuration(600)).toBe("10 min");
    expect(formatDuration(3600)).toBe("1 h");
    expect(formatDuration(8100)).toBe("2 h 15");
  });
});
