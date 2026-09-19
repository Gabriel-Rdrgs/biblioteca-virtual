import { books as seedBooks } from "@/lib/data/books";
import { bookDisciplines as seedLinks } from "@/lib/data/book-disciplines";
import { disciplines } from "@/lib/data/disciplines";
import { teachingPlans } from "@/lib/data/teaching-plans";
import { findDuplicateCandidates } from "@/lib/domain/dedupe";
import { readManifest } from "@/lib/catalog-store";
import { publicBook } from "@/lib/domain/public-view";
import type {
  Book,
  BookDisciplineLink,
  BookWithLinks,
  CatalogEntry,
  CatalogManifest,
  DisciplineId,
  DuplicateCandidate,
  Discipline,
  LibraryStats,
  TeachingPlan,
} from "@/lib/domain/types";

/**
 * The data boundary. Every page reads through this module, never from the
 * seed files directly.
 *
 * Two sources are merged: the seeds transcribed from the teaching plans, and
 * the manifest the admin area writes (books it created, files it attached,
 * visibility it changed). Because the manifest can change while the app is
 * running, the catalogue is rebuilt whenever a different manifest comes
 * back from the store — and reused otherwise.
 */

const disciplineById = new Map<DisciplineId, Discipline>(
  disciplines.map((discipline) => [discipline.id, discipline]),
);

interface BuiltCatalog {
  readonly all: readonly Book[];
  readonly visible: readonly BookWithLinks[];
  readonly links: readonly BookDisciplineLink[];
  readonly bySlug: Map<string, BookWithLinks>;
  readonly byId: Map<string, BookWithLinks>;
}

/** Applies manifest overrides and additions to the seeds. Pure. */
export function mergeCatalog(manifest: CatalogManifest): {
  books: Book[];
  links: BookDisciplineLink[];
} {
  const books = [...seedBooks, ...manifest.books].map((book) => {
    const override = manifest.overrides[book.id];
    if (!override) return book;

    let next: Book = book;
    if (override.file === null) {
      const { file: _dropped, ...rest } = next;
      next = { ...rest, accessType: rest.externalUrl ? "public" : "reference_only" };
    } else if (override.file) {
      next = { ...next, file: override.file, accessType: "class_only" };
    }
    if (override.visibility) next = { ...next, visibility: override.visibility };
    return next;
  });

  return { books, links: [...seedLinks, ...manifest.links] };
}

function build(manifest: CatalogManifest): BuiltCatalog {
  const { books, links } = mergeCatalog(manifest);

  const visible = books
    .filter((book) => book.visibility === "visivel")
    .map<BookWithLinks>((book) => ({
      book,
      links: links
        .filter((link) => link.bookId === book.id)
        .flatMap((link) => {
          const discipline = disciplineById.get(link.disciplineId);
          return discipline ? [{ ...link, discipline }] : [];
        })
        .sort((a, b) => a.priority - b.priority),
    }));

  return {
    all: books,
    visible,
    links,
    bySlug: new Map(visible.map((entry) => [entry.book.slug, entry])),
    byId: new Map(visible.map((entry) => [entry.book.id, entry])),
  };
}

let built: { manifest: CatalogManifest; catalog: BuiltCatalog } | null = null;

async function current(): Promise<BuiltCatalog> {
  const manifest = await readManifest();
  if (!built || built.manifest !== manifest) {
    built = { manifest, catalog: build(manifest) };
  }
  return built.catalog;
}

export async function getCatalog(): Promise<readonly BookWithLinks[]> {
  return (await current()).visible;
}

export async function getBookBySlug(slug: string): Promise<BookWithLinks | undefined> {
  return (await current()).bySlug.get(slug);
}

export async function getBookById(id: string): Promise<BookWithLinks | undefined> {
  return (await current()).byId.get(id);
}

/** Every record, hidden ones included — for the admin area only. */
export async function getAllBooksForAdmin(): Promise<
  readonly (Book & { readonly disciplines: readonly Discipline[] })[]
> {
  const { all, links } = await current();
  return all.map((book) => ({
    ...book,
    disciplines: links
      .filter((link) => link.bookId === book.id)
      .flatMap((link) => {
        const discipline = disciplineById.get(link.disciplineId);
        return discipline ? [discipline] : [];
      }),
  }));
}

export function getDisciplines(): readonly Discipline[] {
  return disciplines;
}

export function getDisciplineBySlug(slug: string): Discipline | undefined {
  return disciplines.find((discipline) => discipline.slug === slug);
}

export function getTeachingPlans(): readonly TeachingPlan[] {
  return teachingPlans;
}

export function getTeachingPlanForDiscipline(id: DisciplineId): TeachingPlan | undefined {
  return teachingPlans.find((plan) => plan.disciplineId === id);
}

/** Every book linked to one discipline, ordered by bibliography weight. */
export async function getBooksForDiscipline(id: DisciplineId): Promise<BookWithLinks[]> {
  return (await current()).visible
    .filter((entry) => entry.links.some((link) => link.disciplineId === id))
    .sort((a, b) => {
      const aLink = a.links.find((l) => l.disciplineId === id);
      const bLink = b.links.find((l) => l.disciplineId === id);
      const byPriority = (aLink?.priority ?? 9) - (bLink?.priority ?? 9);
      if (byPriority !== 0) return byPriority;
      return a.book.title.localeCompare(b.book.title, "pt-BR");
    });
}

/** Books cited by more than one discipline — the catalogue's headline feature. */
export async function getSharedBooks(): Promise<BookWithLinks[]> {
  return (await current()).visible
    .filter((entry) => entry.links.length > 1)
    .sort((a, b) => b.links.length - a.links.length);
}

/** Core reading: everything a plan lists as "básica". */
export async function getCoreBibliography(): Promise<BookWithLinks[]> {
  return (await current()).visible
    .filter((entry) => entry.links.some((link) => link.bibliographyType === "basica"))
    .sort((a, b) => {
      const byLinks = b.links.length - a.links.length;
      if (byLinks !== 0) return byLinks;
      return a.book.title.localeCompare(b.book.title, "pt-BR");
    });
}

export async function getRecentlyAdded(limit: number): Promise<BookWithLinks[]> {
  return [...(await current()).visible]
    .sort((a, b) => {
      const aDate = a.book.file?.addedAt ?? a.book.addedAt;
      const bDate = b.book.file?.addedAt ?? b.book.addedAt;
      return bDate.localeCompare(aDate);
    })
    .slice(0, limit);
}

/** Same-topic neighbours, preferring books that share a discipline. */
export async function getRelatedBooks(slug: string, limit: number): Promise<BookWithLinks[]> {
  const { visible, bySlug } = await current();
  const target = bySlug.get(slug);
  if (!target) return [];

  const topics = new Set(target.book.topics);
  const disciplineIds = new Set(target.links.map((link) => link.disciplineId));

  return visible
    .filter((entry) => entry.book.id !== target.book.id)
    .map((entry) => {
      const sharedTopics = entry.book.topics.filter((topic) => topics.has(topic)).length;
      const sharedDisciplines = entry.links.filter((link) =>
        disciplineIds.has(link.disciplineId),
      ).length;
      return { entry, score: sharedTopics * 3 + sharedDisciplines * 2 };
    })
    .filter((scored) => scored.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((scored) => scored.entry);
}

export async function getBooksPendingReview(): Promise<BookWithLinks[]> {
  return (await current()).visible.filter(
    (entry) => entry.book.provenance.reviewStatus === "pendente",
  );
}

export async function getDuplicateCandidates(): Promise<DuplicateCandidate[]> {
  return findDuplicateCandidates((await current()).all);
}

/** Every distinct topic among visible books, with how many carry it. */
export async function getTopics(): Promise<{ topic: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const { book } of (await current()).visible) {
    for (const topic of book.topics) counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic, "pt-BR"));
}

export async function getStats(): Promise<LibraryStats> {
  const { visible } = await current();
  return {
    books: visible.length,
    disciplines: disciplines.length,
    teachingPlans: teachingPlans.length,
    sharedBooks: visible.filter((entry) => entry.links.length > 1).length,
    pendingReview: visible.filter((entry) => entry.book.provenance.reviewStatus === "pendente")
      .length,
    withFile: visible.filter((entry) => entry.book.file !== undefined).length,
  };
}

/** Visible books per discipline, for the discipline cards. */
export async function getDisciplineBookCounts(): Promise<Map<DisciplineId, number>> {
  const { visible } = await current();
  const counts = new Map<DisciplineId, number>();
  for (const discipline of disciplines) counts.set(discipline.id, 0);
  for (const entry of visible) {
    for (const link of entry.links) {
      counts.set(link.disciplineId, (counts.get(link.disciplineId) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Prepares rows for a client component: each link's discipline is cut down
 * to what a card renders (never the whole syllabus), and unless the caller
 * is an admin the book loses its provenance and review notes.
 */
export function toCatalogEntries(
  entries: readonly BookWithLinks[],
  options: { admin?: boolean } = {},
): CatalogEntry[] {
  return entries.map(({ book, links }) => ({
    book: options.admin ? book : publicBook(book),
    links: links.map((link) => ({
      bookId: link.bookId,
      disciplineId: link.disciplineId,
      bibliographyType: link.bibliographyType,
      priority: link.priority,
      ...(link.notes ? { notes: link.notes } : {}),
      discipline: {
        id: link.discipline.id,
        slug: link.discipline.slug,
        name: link.discipline.name,
        shortName: link.discipline.shortName,
        color: link.discipline.color,
        colorSoft: link.discipline.colorSoft,
      },
    })),
  }));
}

export type { Book, BookWithLinks, CatalogEntry, Discipline, TeachingPlan };
