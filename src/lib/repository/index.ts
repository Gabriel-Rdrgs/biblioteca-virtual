import { books } from "@/lib/data/books";
import { bookDisciplines } from "@/lib/data/book-disciplines";
import { disciplines } from "@/lib/data/disciplines";
import { teachingPlans } from "@/lib/data/teaching-plans";
import { findDuplicateCandidates } from "@/lib/domain/dedupe";
import type {
  Book,
  BookWithLinks,
  CatalogEntry,
  DisciplineId,
  DuplicateCandidate,
  Discipline,
  LibraryStats,
  TeachingPlan,
} from "@/lib/domain/types";

/**
 * The data boundary. Every page reads through this module, never from the
 * seed files directly — so swapping the local seeds for Supabase later means
 * reimplementing this surface and nothing else.
 */

const disciplineById = new Map<DisciplineId, Discipline>(
  disciplines.map((discipline) => [discipline.id, discipline]),
);

/** Books joined to their disciplines, built once per process. */
const catalog: readonly BookWithLinks[] = books.map((book) => ({
  book,
  links: bookDisciplines
    .filter((link) => link.bookId === book.id)
    .flatMap((link) => {
      const discipline = disciplineById.get(link.disciplineId);
      return discipline ? [{ ...link, discipline }] : [];
    })
    .sort((a, b) => a.priority - b.priority),
}));

const catalogById = new Map(catalog.map((entry) => [entry.book.id, entry]));
const catalogBySlug = new Map(catalog.map((entry) => [entry.book.slug, entry]));

export function getCatalog(): readonly BookWithLinks[] {
  return catalog;
}

export function getBookBySlug(slug: string): BookWithLinks | undefined {
  return catalogBySlug.get(slug);
}

export function getBookById(id: string): BookWithLinks | undefined {
  return catalogById.get(id);
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
export function getBooksForDiscipline(id: DisciplineId): BookWithLinks[] {
  return catalog
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
export function getSharedBooks(): BookWithLinks[] {
  return catalog
    .filter((entry) => entry.links.length > 1)
    .sort((a, b) => b.links.length - a.links.length);
}

/** Core reading: everything a plan lists as "básica". */
export function getCoreBibliography(): BookWithLinks[] {
  return catalog
    .filter((entry) => entry.links.some((link) => link.bibliographyType === "basica"))
    .sort((a, b) => {
      const byLinks = b.links.length - a.links.length;
      if (byLinks !== 0) return byLinks;
      return a.book.title.localeCompare(b.book.title, "pt-BR");
    });
}

export function getRecentlyAdded(limit: number): BookWithLinks[] {
  return [...catalog].sort((a, b) => b.book.addedAt.localeCompare(a.book.addedAt)).slice(0, limit);
}

/** Same-topic neighbours, preferring books that share a discipline. */
export function getRelatedBooks(slug: string, limit: number): BookWithLinks[] {
  const target = catalogBySlug.get(slug);
  if (!target) return [];

  const topics = new Set(target.book.topics);
  const disciplineIds = new Set(target.links.map((link) => link.disciplineId));

  return catalog
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

export function getBooksPendingReview(): BookWithLinks[] {
  return catalog.filter((entry) => entry.book.provenance.reviewStatus === "pendente");
}

export function getDuplicateCandidates(): DuplicateCandidate[] {
  return findDuplicateCandidates(books);
}

/** Every distinct topic, with how many books carry it. */
export function getTopics(): { topic: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const { book } of catalog) {
    for (const topic of book.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic, "pt-BR"));
}

export function getStats(): LibraryStats {
  return {
    books: books.length,
    disciplines: disciplines.length,
    teachingPlans: teachingPlans.length,
    sharedBooks: catalog.filter((entry) => entry.links.length > 1).length,
    pendingReview: books.filter((book) => book.provenance.reviewStatus === "pendente").length,
    institutionalAccess: books.filter((book) => book.accessType === "institutional").length,
  };
}

/** Books linked to a discipline, counted for the discipline cards. */
export function getDisciplineBookCounts(): Map<DisciplineId, number> {
  const counts = new Map<DisciplineId, number>();
  for (const discipline of disciplines) counts.set(discipline.id, 0);
  for (const link of bookDisciplines) {
    counts.set(link.disciplineId, (counts.get(link.disciplineId) ?? 0) + 1);
  }
  return counts;
}

/**
 * Strips each link's discipline down to what a card renders. Server
 * components call this before handing rows to a client component, so the
 * syllabus is not serialised once per book.
 */
export function toCatalogEntries(entries: readonly BookWithLinks[]): CatalogEntry[] {
  return entries.map(({ book, links }) => ({
    book,
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
