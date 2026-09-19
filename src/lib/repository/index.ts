import { books as seedBooks } from "@/lib/data/books";
import { bookDisciplines as seedLinks } from "@/lib/data/book-disciplines";
import { disciplines as seedDisciplines } from "@/lib/data/disciplines";
import { teachingPlans as seedPlans } from "@/lib/data/teaching-plans";
import { findDuplicateCandidates } from "@/lib/domain/dedupe";
import { readManifest, updateManifest } from "@/lib/catalog-store";
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
  PeriodNumber,
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

interface BuiltCatalog {
  readonly all: readonly Book[];
  readonly visible: readonly BookWithLinks[];
  readonly links: readonly BookDisciplineLink[];
  readonly bySlug: Map<string, BookWithLinks>;
  readonly byId: Map<string, BookWithLinks>;
  /** Every discipline, hidden ones included. */
  readonly disciplines: readonly Discipline[];
  readonly disciplineById: Map<DisciplineId, Discipline>;
  readonly teachingPlans: readonly TeachingPlan[];
  readonly currentPeriod: PeriodNumber;
}

/** Seeds plus admin-created disciplines, with overrides applied. Pure. */
export function mergeDisciplines(manifest: CatalogManifest): Discipline[] {
  return [...seedDisciplines, ...(manifest.disciplines ?? [])].map((discipline) => {
    const override = manifest.disciplineOverrides?.[discipline.id];
    return override ? { ...discipline, ...override } : discipline;
  });
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
  const disciplines = mergeDisciplines(manifest);
  const disciplineById = new Map(disciplines.map((d) => [d.id, d]));
  const teachingPlans = [...seedPlans, ...(manifest.teachingPlans ?? [])];
  const visibleDisciplineIds = new Set(
    disciplines.filter((d) => d.visibility === "visivel").map((d) => d.id),
  );
  // Without an explicit setting, the newest period with a visible discipline.
  const currentPeriod =
    manifest.settings?.currentPeriod ??
    Math.max(1, ...disciplines.filter((d) => d.visibility === "visivel").map((d) => d.period));

  const visible = books
    .filter((book) => book.visibility === "visivel")
    .map<BookWithLinks>((book) => ({
      book,
      links: links
        .filter((link) => link.bookId === book.id)
        .flatMap((link) => {
          const discipline = disciplineById.get(link.disciplineId);
          // A link to a hidden discipline is kept off the class-facing rows.
          return discipline && visibleDisciplineIds.has(discipline.id)
            ? [{ ...link, discipline }]
            : [];
        })
        .sort((a, b) => a.priority - b.priority),
    }));

  return {
    all: books,
    visible,
    links,
    bySlug: new Map(visible.map((entry) => [entry.book.slug, entry])),
    byId: new Map(visible.map((entry) => [entry.book.id, entry])),
    disciplines,
    disciplineById,
    teachingPlans,
    currentPeriod,
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
  const { all, links, disciplineById } = await current();
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

/** Visible disciplines, ordered by period then name. */
export async function getDisciplines(): Promise<Discipline[]> {
  return (await current()).disciplines
    .filter((d) => d.visibility === "visivel")
    .sort((a, b) => a.period - b.period || a.name.localeCompare(b.name, "pt-BR"));
}

/** Every discipline, hidden ones included — for the admin area. */
export async function getAllDisciplinesForAdmin(): Promise<Discipline[]> {
  return [...(await current()).disciplines].sort(
    (a, b) => a.period - b.period || a.name.localeCompare(b.name, "pt-BR"),
  );
}

export async function getDisciplineBySlug(slug: string): Promise<Discipline | undefined> {
  return (await current()).disciplines.find((d) => d.slug === slug && d.visibility === "visivel");
}

export async function getCurrentPeriod(): Promise<PeriodNumber> {
  return (await current()).currentPeriod;
}

/** Visible disciplines grouped by period, current period first. */
export async function getDisciplinesByPeriod(): Promise<
  { period: PeriodNumber; current: boolean; disciplines: Discipline[] }[]
> {
  const { currentPeriod } = await current();
  const groups = new Map<PeriodNumber, Discipline[]>();
  for (const d of await getDisciplines()) {
    groups.set(d.period, [...(groups.get(d.period) ?? []), d]);
  }
  return [...groups.entries()]
    .map(([period, disciplines]) => ({ period, current: period === currentPeriod, disciplines }))
    .sort((a, b) => Number(b.current) - Number(a.current) || b.period - a.period);
}

export async function getTeachingPlans(): Promise<readonly TeachingPlan[]> {
  const { teachingPlans, disciplineById } = await current();
  return teachingPlans.filter(
    (plan) => disciplineById.get(plan.disciplineId)?.visibility === "visivel",
  );
}

export async function getTeachingPlanForDiscipline(
  id: DisciplineId,
): Promise<TeachingPlan | undefined> {
  return (await current()).teachingPlans.find((plan) => plan.disciplineId === id);
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

/**
 * Counts one opening of a book. Called when the reader page renders, so a
 * long read is one access and a range request is not. Nothing about who
 * opened it is stored.
 */
export async function recordAccess(bookId: string): Promise<void> {
  await updateManifest((current) => ({
    ...current,
    accessCounts: {
      ...current.accessCounts,
      [bookId]: (current.accessCounts?.[bookId] ?? 0) + 1,
    },
  }));
}

/**
 * Most opened first. Ties (and a fresh library with no counts yet) fall
 * back to the plans' core bibliography, then title.
 */
export async function getMostAccessed(limit: number): Promise<BookWithLinks[]> {
  const manifest = await readManifest();
  const counts = manifest.accessCounts ?? {};
  return [...(await current()).visible]
    .sort((a, b) => {
      const byCount = (counts[b.book.id] ?? 0) - (counts[a.book.id] ?? 0);
      if (byCount !== 0) return byCount;
      const core = (e: BookWithLinks) =>
        e.links.some((l) => l.bibliographyType === "basica") ? 0 : 1;
      if (core(a) !== core(b)) return core(a) - core(b);
      return a.book.title.localeCompare(b.book.title, "pt-BR");
    })
    .slice(0, limit);
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
  const { visible, disciplines, teachingPlans } = await current();
  const visibleDisciplines = disciplines.filter((d) => d.visibility === "visivel");
  return {
    books: visible.length,
    disciplines: visibleDisciplines.length,
    teachingPlans: teachingPlans.filter((p) =>
      visibleDisciplines.some((d) => d.id === p.disciplineId),
    ).length,
    sharedBooks: visible.filter((entry) => entry.links.length > 1).length,
    pendingReview: visible.filter((entry) => entry.book.provenance.reviewStatus === "pendente")
      .length,
    withFile: visible.filter((entry) => entry.book.file !== undefined).length,
  };
}

/** Visible books per discipline, for the discipline cards. */
export async function getDisciplineBookCounts(): Promise<Map<DisciplineId, number>> {
  const { visible, disciplines } = await current();
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
        period: link.discipline.period,
      },
    })),
  }));
}

export type { Book, BookWithLinks, CatalogEntry, Discipline, TeachingPlan };
