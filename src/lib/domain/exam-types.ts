/**
 * Model for the question bank and for the simulados built on top of it.
 *
 * The bank is the asset, not any single simulado. A unidade curricular like
 * MAC I covers parasitologia, anatomia, histologia and embriologia, and a
 * real N1 draws from two or three of those; so a question belongs to an
 * **área** (the subject it comes from) and to an **eixo** (the theme inside
 * that área), and a simulado is just an ordered selection over the bank.
 *
 * That separation is what lets the same bank produce the printed N1, a
 * shorter drill on one área, or a sheet rebuilt from the questions someone
 * got wrong — without the questions being copied anywhere.
 */

import type { DisciplineId } from "./types";

export type QuestionId = string;
export type AreaId = string;
export type ExamId = string;
export type OptionLetter = "a" | "b" | "c" | "d";
export const optionLetters: readonly OptionLetter[] = ["a", "b", "c", "d"];

/**
 * What a date on the calendar is.
 *
 * Not only provas: a devolutiva and a hand-in date change what someone
 * does that week just as much, and both are written in the plans.
 */
export type AssessmentKind =
  "N1" | "N2" | "N3" | "ARA" | "final" | "substitutiva" | "devolutiva" | "entrega" | "treino";

/**
 * A thematic axis — the unit of feedback. Scores are totalled per axis
 * because "você foi mal em helmintos" is actionable and "você tirou 42"
 * is not.
 */
export interface ExamAxis {
  readonly id: string;
  readonly label: string;
  /** Broad family, shown as a legend ("conceitos", "protozoários"…). */
  readonly group?: string;
  /** What to do when this axis comes out weak. */
  readonly remedy?: string;
}

/** A figure from the printed material, served from storage/simulados. */
export interface ExamFigure {
  readonly id: string;
  /** The number the printed sheet gives it, which the stems refer to. */
  readonly number: number;
  readonly path: string;
  readonly caption: string;
  /** Where the image comes from, kept visible for attribution. */
  readonly source: string;
  readonly width: number;
  readonly height: number;
}

/**
 * One subject inside a unidade curricular — parasitologia, anatomia,
 * histologia, embriologia. It owns its axes and its figures, so a new área
 * can be added without touching the others.
 */
export interface QuestionArea {
  readonly id: AreaId;
  readonly disciplineId: DisciplineId;
  readonly label: string;
  /** Short form for chips and filters. */
  readonly shortLabel: string;
  readonly axes: readonly ExamAxis[];
  readonly figures: readonly ExamFigure[];
  /** Books and chapters this área is studied from. */
  readonly sourceNote: string;
}

interface QuestionBase {
  readonly id: QuestionId;
  readonly areaId: AreaId;
  readonly axisId: string;
  /** Short label shown beside the number, e.g. "Giardíase". */
  readonly topic: string;
  readonly points: number;
  /** The clinical case or context. */
  readonly stem: string;
  readonly figureId?: string;
}

/**
 * A multiple-choice question. `statements` carries the roman-numeral list
 * of the "analise as afirmações" format, which the command then asks about.
 */
export interface ObjectiveQuestion extends QuestionBase {
  readonly kind: "objetiva";
  readonly statements?: readonly string[];
  /** The sentence that introduces the options. */
  readonly command: string;
  readonly options: Readonly<Record<OptionLetter, string>>;
  readonly answer: OptionLetter;
  /** Why that one is right — shown only after the attempt is corrected. */
  readonly explanation: string;
}

/** One lettered part of a discursive question, with its own marks. */
export interface DiscursiveItem {
  readonly label: string;
  readonly points: number;
  readonly prompt: string;
  /**
   * The marking scheme, one element per idea expected. The student ticks
   * what they wrote; nothing is auto-graded, since a written answer cannot
   * be judged by string comparison.
   */
  readonly expected: readonly string[];
}

export interface DiscursiveQuestion extends QuestionBase {
  readonly kind: "discursiva";
  readonly items: readonly DiscursiveItem[];
}

export type BankQuestion = ObjectiveQuestion | DiscursiveQuestion;

/** A question placed in a simulado, with the number it carries there. */
export interface PlacedQuestion {
  readonly number: number;
  readonly question: BankQuestion;
}

/**
 * How many questions to take from each área. Used both to describe a fixed
 * simulado and to generate a new one from the bank.
 */
export interface ExamBlueprintPart {
  readonly areaId: AreaId;
  readonly discursivas: number;
  readonly objetivas: number;
}

export interface Exam {
  readonly id: ExamId;
  readonly slug: string;
  readonly disciplineId: DisciplineId;
  readonly title: string;
  readonly subtitle?: string;
  readonly assessment: AssessmentKind;
  readonly semester: string;
  readonly description: string;
  readonly instructions: readonly string[];
  /** Minutes the printed sheet suggests. */
  readonly suggestedMinutes?: number;
  /**
   * How the simulado's points map to the real exam's scale: the score is
   * divided by `scaleDivisor` to reach a mark out of `scaleMax`.
   */
  readonly scaleMax: number;
  readonly scaleDivisor: number;
  /**
   * The questions, in the order of the printed sheet: discursivas first,
   * then objetivas, exactly as the real exam is laid out.
   */
  readonly questionIds: readonly QuestionId[];
  /** The printable PDF, under storage/simulados. */
  readonly pdfPath?: string;
  readonly pdfSizeBytes?: number;
  readonly note?: string;
  readonly visibility: "visivel" | "oculto";
  readonly origin: "seed" | "admin";
  readonly addedAt: string;
}

/** An exam with its questions resolved and numbered. */
export interface LoadedExam {
  readonly exam: Exam;
  readonly questions: readonly PlacedQuestion[];
  readonly areas: readonly QuestionArea[];
  /** Every axis used by the questions, in área order. */
  readonly axes: readonly ExamAxis[];
  readonly figures: readonly ExamFigure[];
  readonly totalPoints: number;
}

/** What a student records while taking a simulado. Lives on their device. */
export interface ExamAttempt {
  readonly examId: ExamId;
  readonly startedAt: string;
  readonly finishedAt?: string;
  /** question id -> chosen letter */
  readonly choices: Readonly<Record<QuestionId, OptionLetter>>;
  /** question id -> item label -> marks the student gave themselves */
  readonly selfMarks: Readonly<Record<QuestionId, Record<string, number>>>;
}

export interface AxisResult {
  readonly axis: ExamAxis;
  readonly areaId: AreaId;
  readonly earned: number;
  readonly possible: number;
  readonly percent: number;
  readonly questionIds: readonly QuestionId[];
}

export interface AreaResult {
  readonly area: QuestionArea;
  readonly earned: number;
  readonly possible: number;
  readonly percent: number;
}

export interface ExamResult {
  readonly objectiveEarned: number;
  readonly objectivePossible: number;
  readonly discursiveEarned: number;
  readonly discursivePossible: number;
  readonly total: number;
  readonly possible: number;
  /** The total converted to the real exam's scale. */
  readonly scaled: number;
  readonly answered: number;
  readonly areas: readonly AreaResult[];
  readonly axes: readonly AxisResult[];
  readonly wrongIds: readonly QuestionId[];
  readonly blankIds: readonly QuestionId[];
}
