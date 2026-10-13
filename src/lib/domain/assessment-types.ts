import type { AssessmentKind, ExamId } from "./exam-types";
import type { DisciplineId, Visibility } from "./types";

/**
 * An assessment on the class calendar.
 *
 * Dates are the one thing nobody can derive from a teaching plan, change
 * through the term, and cost a grade when missed — so they are entered by
 * the admin and never guessed. Each one can name what it covers and which
 * simulados rehearse it, which is what turns a date into a study plan.
 */
export interface Assessment {
  readonly id: string;
  readonly disciplineId: DisciplineId;
  readonly kind: AssessmentKind;
  /** Overrides the default label ("N1", "N2"…) when the exam has a name. */
  readonly title?: string;
  /** ISO date, YYYY-MM-DD, in the class's local calendar. */
  readonly date: string;
  /** HH:MM, when the class knows it. */
  readonly time?: string;
  readonly room?: string;
  /** What it is worth, as the plan states it: "6,0", "8,0"… */
  readonly weight?: string;
  /** The content it covers, one line per topic. */
  readonly content: readonly string[];
  /** Simulados that rehearse this assessment. */
  readonly examIds: readonly ExamId[];
  readonly note?: string;
  readonly visibility: Visibility;
  readonly origin: "seed" | "admin";
}

/** An assessment with the days left and its discipline resolved. */
export interface UpcomingAssessment {
  readonly assessment: Assessment;
  /** Negative once it has passed, 0 on the day itself. */
  readonly daysLeft: number;
  readonly past: boolean;
}

/** Whole days from today to the assessment, in the class's own timezone. */
export function daysUntil(date: string, today = new Date()): number {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const target = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - now) / 86_400_000);
}

export function assessmentLabel(assessment: Assessment): string {
  return assessment.title ?? assessment.kind;
}

/** "em 3 dias", "amanhã", "hoje", "há 2 dias". */
export function countdownLabel(daysLeft: number): string {
  if (daysLeft === 0) return "hoje";
  if (daysLeft === 1) return "amanhã";
  if (daysLeft === -1) return "ontem";
  return daysLeft > 0 ? `em ${daysLeft} dias` : `há ${Math.abs(daysLeft)} dias`;
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "14 de novembro" — the way a date is said out loud. */
export function formatAssessmentDate(date: string, withYear = false): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const base = `${d} de ${MESES[m - 1]}`;
  return withYear ? `${base} de ${y}` : base;
}
