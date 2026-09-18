/**
 * Domain model for Atlas.
 *
 * The central rule: one Book record, many BookDiscipline links. A title used
 * by three disciplines is stored once and linked three times — never copied.
 */

export type BibliographyType = "basica" | "basica_virtual" | "complementar" | "outras_referencias";

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

/** Where a reference came from in the source PDF, so any claim is auditable. */
export interface Provenance {
  readonly sourcePlanId: DisciplineId;
  readonly sourceSection: string;
  readonly sourcePage: number;
  readonly rawCitation: string;
  readonly reviewStatus: ReviewStatus;
  /** Why this needs a human look. Present only when reviewStatus is not "ok". */
  readonly reviewNote?: string;
}

export type BookId = string;
export type DisciplineId = "mac-1" | "ha-1" | "iescg-1" | "hm-1" | "ic-1" | "aes-1" | "aes-2";

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
  readonly period: string;
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
  readonly teachingPlanFile: string;
  readonly notes?: readonly string[];
}

export interface TeachingPlan {
  readonly id: string;
  readonly disciplineId: DisciplineId;
  readonly title: string;
  readonly fileUrl: string;
  readonly semester: string;
  readonly pages: number;
  readonly sourceFileName: string;
  readonly extractedTextStatus: "extraido" | "pendente" | "falhou";
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
  "id" | "slug" | "name" | "shortName" | "color" | "colorSoft"
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
