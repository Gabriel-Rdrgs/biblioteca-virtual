import type { Summary } from "./summary-types";
import type { Assessment } from "./assessment-types";

/**
 * Domain model for Atlas.
 *
 * The central rule: one Book record, many BookDiscipline links. A title used
 * by three disciplines is stored once and linked three times — never copied.
 */

export type BibliographyType =
  | "basica"
  | "basica_virtual"
  | "complementar"
  | "outras_referencias"
  /** Posted by the class; not cited by any teaching plan. */
  | "acervo_da_turma";

export type MaterialKind =
  "livro" | "norma" | "documento" | "apostila" | "artigo" | "roteiro" | "plano_de_ensino";

/**
 * How a reader may reach the item.
 *
 * - `class_only`: a PDF posted by the class, served only behind the class
 *   password, with its origin and authorisation recorded on the file.
 * - `public`: an open-access document linked at its official source.
 * - `reference_only`: catalogued from the plan, no file available.
 * - `restricted`: needs case-by-case authorisation.
 */
export type AccessType = "public" | "class_only" | "restricted" | "reference_only";

/** The library hides rather than deletes, so provenance is never lost. */
export type Visibility = "visivel" | "oculto";

/**
 * A file the class posted for a book. Every file names who supplied it and
 * on what basis, so a questioned upload can be traced and removed quickly.
 */
export interface BookFile {
  /** File name inside storage/livros — never a public URL. */
  readonly path: string;
  /** Where the file came from, e.g. "Enviado pela turma, cópia própria". */
  readonly origin: string;
  /** The basis for sharing it with the class. */
  readonly authorization: string;
  readonly sizeBytes?: number;
  readonly addedAt: string;
  /** Anything a reader should know, e.g. the file is an older edition. */
  readonly note?: string;
}

export type ReviewStatus = "ok" | "pendente" | "corrigido";

export type CoverSource = "placeholder" | "fornecida" | "editora" | "institucional";

/** Visual family used to draw a placeholder cover when no artwork exists. */
export type CoverMotif =
  | "anatomia"
  | "histologia"
  | "bioquimica"
  | "semiologia"
  | "humanidades"
  | "saude-coletiva"
  | "metodologia";

/**
 * Where a record came from, so any claim is auditable: a section and page of
 * a teaching plan, or a file the class added on its own initiative.
 */
export interface Provenance {
  readonly sourceKind: "plano_de_ensino" | "acervo_da_turma";
  readonly sourcePlanId?: DisciplineId;
  readonly sourceSection?: string;
  readonly sourcePage?: number;
  /** The plan's literal citation, or the description built from the file itself. */
  readonly rawCitation: string;
  readonly reviewStatus: ReviewStatus;
  /** Why this needs a human look. Present only when reviewStatus is not "ok". */
  readonly reviewNote?: string;
}

export type BookId = string;
/** Slug-like id; seeds use short codes ("mac-1"), admin-created ones a slug. */
export type DisciplineId = string;

/** Course period, 1st to 12th — the axis the library is organised on. */
export type PeriodNumber = number;

export function periodLabel(period: PeriodNumber): string {
  return `${period}º período`;
}

export interface Book {
  readonly id: BookId;
  readonly slug: string;
  readonly title: string;
  readonly subtitle?: string;
  /** Display form, e.g. ["BICKLEY, Lynn S.", "SZILAGYI, Peter G."]. */
  readonly authors: readonly string[];
  readonly publisher?: string;
  readonly publicationYear?: number;
  readonly edition?: string;
  readonly isbn?: string;
  readonly description?: string;
  readonly kind: MaterialKind;
  readonly accessType: AccessType;
  readonly visibility: Visibility;
  /** Official open-access source, for `public` items only. */
  readonly externalUrl?: string;
  /** Present when the class has posted a PDF for this book. */
  readonly file?: BookFile;
  readonly coverSource: CoverSource;
  readonly coverUrl?: string;
  readonly coverMotif: CoverMotif;
  readonly topics: readonly string[];
  readonly provenance: Provenance;
  readonly addedAt: string;
}

export interface BookDisciplineLink {
  readonly bookId: BookId;
  readonly disciplineId: DisciplineId;
  readonly bibliographyType: BibliographyType;
  /** 1 = core reading for the discipline; higher = further out. */
  readonly priority: number;
  readonly notes?: string;
}

export interface SyllabusUnit {
  readonly title: string;
  readonly items: readonly string[];
}

export interface Discipline {
  readonly id: DisciplineId;
  readonly slug: string;
  readonly name: string;
  readonly shortName: string;
  readonly code?: string;
  /** 1–12. */
  readonly period: PeriodNumber;
  /** Calendar term this offering ran in, e.g. "2026.2". */
  readonly semester: string;
  readonly workload?: string;
  readonly weeklyWorkload?: string;
  readonly description: string;
  readonly syllabus: readonly SyllabusUnit[];
  readonly teachers: readonly string[];
  /** Hue anchoring the discipline's header and chips. */
  readonly color: string;
  readonly colorSoft: string;
  readonly motif: CoverMotif;
  /** URL of the plan PDF: under /planos for seeds, /api/planos/<id> when uploaded. */
  readonly teachingPlanFile?: string;
  readonly notes?: readonly string[];
  readonly visibility: Visibility;
  /** Seeds come from the repository; the rest were created in /admin. */
  readonly origin: "seed" | "admin";
}

export interface TeachingPlan {
  readonly id: string;
  readonly disciplineId: DisciplineId;
  readonly title: string;
  readonly fileUrl: string;
  readonly semester: string;
  readonly pages?: number;
  readonly sourceFileName: string;
  readonly extractedTextStatus: "extraido" | "pendente" | "falhou";
  /** Where the PDF lives: bundled under public/, or in class storage. */
  readonly storage?: "public" | "storage";
  readonly storagePath?: string;
}

/** A pair the importer refused to merge on its own. */
export interface DuplicateCandidate {
  readonly leftId: BookId;
  readonly rightId: BookId;
  readonly reason: string;
  readonly confidence: "alta" | "media" | "baixa";
}

export interface BookWithLinks {
  readonly book: Book;
  readonly links: readonly (BookDisciplineLink & { readonly discipline: Discipline })[];
}

/**
 * The slice of a discipline a book card needs. Sending the full record would
 * ship every syllabus unit to the browser once per link.
 */
export type DisciplineRef = Pick<
  Discipline,
  "id" | "slug" | "name" | "shortName" | "color" | "colorSoft" | "period"
>;

/**
 * Client-side shape of a catalogue row. `BookWithLinks` is assignable to it,
 * so server code can pass either.
 */
export interface CatalogEntry {
  readonly book: Book;
  readonly links: readonly (BookDisciplineLink & { readonly discipline: DisciplineRef })[];
}

export interface LibraryStats {
  readonly books: number;
  readonly disciplines: number;
  readonly teachingPlans: number;
  readonly sharedBooks: number;
  readonly pendingReview: number;
  readonly withFile: number;
}

/** One admin action, kept so changes can be traced. */
export interface CatalogLogEntry {
  readonly at: string;
  readonly action:
    | "livro_criado"
    | "arquivo_anexado"
    | "arquivo_removido"
    | "visibilidade"
    | "registro_excluido"
    | "materia_criada"
    | "materia_editada"
    | "materia_visibilidade"
    | "materia_excluida"
    | "periodo_atual"
    | "prova_criada"
    | "prova_editada"
    | "prova_excluida";
  readonly bookId: BookId;
  readonly detail?: string;
}

export interface LibrarySettings {
  /** Period shown first on the home page and the shelf. */
  readonly currentPeriod?: PeriodNumber;
}

/**
 * Everything the admin area changes, kept apart from the seed files so a
 * running deployment can be edited without a rebuild. Seeds plus manifest
 * are merged by the repository.
 */
export interface CatalogManifest {
  readonly version: 1;
  /** Books created through the admin area. */
  readonly books: readonly Book[];
  readonly links: readonly BookDisciplineLink[];
  /** Per-book changes applied over a seed (or manifest) record. */
  readonly overrides: Readonly<
    Record<BookId, { readonly visibility?: Visibility; readonly file?: BookFile | null }>
  >;
  readonly log: readonly CatalogLogEntry[];
  /** Times each book was opened in the reader — no one is identified. */
  readonly accessCounts?: Readonly<Record<BookId, number>>;
  /** Disciplines created through the admin area. */
  readonly disciplines?: readonly Discipline[];
  /** Per-discipline changes applied over a seed (or manifest) record. */
  readonly disciplineOverrides?: Readonly<
    Record<DisciplineId, Partial<Omit<Discipline, "id" | "slug" | "origin">>>
  >;
  readonly teachingPlans?: readonly TeachingPlan[];
  /** Dates the admin added on top of the ones in the teaching plans. */
  readonly assessments?: readonly Assessment[];
  /** Corrections applied over a date that came from a plan. */
  /** Resumos criados pelo painel. */
  readonly summaries?: readonly Summary[];
  /** Correções aplicadas sobre um resumo publicado. */
  readonly summaryOverrides?: Readonly<Record<string, Partial<Summary>>>;
  readonly assessmentOverrides?: Readonly<Record<string, Partial<Assessment>>>;
  readonly settings?: LibrarySettings;
}

export const emptyManifest: CatalogManifest = {
  version: 1,
  books: [],
  links: [],
  overrides: {},
  log: [],
  accessCounts: {},
  disciplines: [],
  disciplineOverrides: {},
  teachingPlans: [],
  assessments: [],
  assessmentOverrides: {},
  settings: {},
};
