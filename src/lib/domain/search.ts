import type { BibliographyType, CatalogEntry, Discipline, TeachingPlan } from "./types";
import { normalizeText, tokenize } from "./normalize";

/**
 * Search and filtering over the catalogue.
 *
 * Matching is accent- and case-insensitive: "etica", "Ética" and "ÉTICA"
 * all find the same book. Every term must match somewhere (AND), but it may
 * match a different field for each term, so "bates anamnese" works.
 */

export type SortKey = "relevancia" | "titulo" | "ano" | "disciplinas" | "recentes";

export type AvailabilityFilter = "todos" | "institucional" | "publico" | "somente_referencia";

export interface CatalogFilters {
  readonly query: string;
  readonly disciplines: readonly string[];
  readonly bibliographyTypes: readonly BibliographyType[];
  readonly topics: readonly string[];
  readonly availability: AvailabilityFilter;
  readonly sharedOnly: boolean;
  readonly sort: SortKey;
}

export const emptyFilters: CatalogFilters = {
  query: "",
  disciplines: [],
  bibliographyTypes: [],
  topics: [],
  availability: "todos",
  sharedOnly: false,
  sort: "relevancia",
};

/** Field weights: a title hit should outrank a topic hit. */
const WEIGHT = { title: 10, author: 6, discipline: 4, topic: 3, publisher: 2, rest: 1 } as const;

function buildHaystack(entry: CatalogEntry) {
  const { book, links } = entry;
  return {
    title: normalizeText(`${book.title} ${book.subtitle ?? ""}`),
    author: normalizeText(book.authors.join(" ")),
    discipline: normalizeText(
      links.map((l) => `${l.discipline.name} ${l.discipline.shortName}`).join(" "),
    ),
    topic: normalizeText(book.topics.join(" ")),
    publisher: normalizeText(book.publisher ?? ""),
    rest: normalizeText(
      `${book.edition ?? ""} ${book.isbn ?? ""} ${book.publicationYear ?? ""} ${book.kind}`,
    ),
  };
}

/** Score for one book against one query. Returns 0 when any term misses. */
export function scoreBook(entry: CatalogEntry, query: string): number {
  const terms = tokenize(query);
  if (terms.length === 0) return 1;

  const fields = buildHaystack(entry);
  let total = 0;

  for (const term of terms) {
    let best = 0;
    for (const [field, weight] of Object.entries(WEIGHT) as [keyof typeof WEIGHT, number][]) {
      const haystack = fields[field];
      if (!haystack.includes(term)) continue;
      // A term that starts a word counts for more than one buried mid-word.
      const startsWord = new RegExp(`\\b${term}`).test(haystack);
      best = Math.max(best, startsWord ? weight * 2 : weight);
    }
    if (best === 0) return 0;
    total += best;
  }

  return total;
}

function matchesFilters(entry: CatalogEntry, filters: CatalogFilters): boolean {
  const { book, links } = entry;

  if (filters.disciplines.length > 0) {
    const ids = new Set(links.map((l) => l.disciplineId));
    if (!filters.disciplines.some((id) => ids.has(id as never))) return false;
  }

  if (filters.bibliographyTypes.length > 0) {
    const types = new Set(links.map((l) => l.bibliographyType));
    if (!filters.bibliographyTypes.some((type) => types.has(type))) return false;
  }

  if (filters.topics.length > 0) {
    const topics = new Set(book.topics.map(normalizeText));
    if (!filters.topics.some((topic) => topics.has(normalizeText(topic)))) return false;
  }

  if (filters.sharedOnly && links.length < 2) return false;

  switch (filters.availability) {
    case "institucional":
      return book.accessType === "institutional";
    case "publico":
      return book.accessType === "public";
    case "somente_referencia":
      return book.accessType === "reference_only";
    case "todos":
      return true;
  }
}

function compare(a: CatalogEntry, b: CatalogEntry, sort: SortKey): number {
  switch (sort) {
    case "titulo":
      return a.book.title.localeCompare(b.book.title, "pt-BR");
    case "ano":
      return (b.book.publicationYear ?? 0) - (a.book.publicationYear ?? 0);
    case "disciplinas":
      return b.links.length - a.links.length;
    case "recentes":
      return b.book.addedAt.localeCompare(a.book.addedAt);
    case "relevancia":
      return 0;
  }
}

/** Applies filters, scores against the query and sorts. */
export function searchCatalog(
  entries: readonly CatalogEntry[],
  filters: CatalogFilters,
): CatalogEntry[] {
  const scored: { entry: CatalogEntry; score: number }[] = [];

  for (const entry of entries) {
    if (!matchesFilters(entry, filters)) continue;
    const score = scoreBook(entry, filters.query);
    if (score === 0) continue;
    scored.push({ entry, score });
  }

  scored.sort((a, b) => {
    if (filters.sort === "relevancia") {
      // Within equal relevance, more disciplines means more useful.
      if (b.score !== a.score) return b.score - a.score;
      if (b.entry.links.length !== a.entry.links.length) {
        return b.entry.links.length - a.entry.links.length;
      }
      return a.entry.book.title.localeCompare(b.entry.book.title, "pt-BR");
    }
    return compare(a.entry, b.entry, filters.sort);
  });

  return scored.map((s) => s.entry);
}

export function searchDisciplines(disciplines: readonly Discipline[], query: string): Discipline[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [...disciplines];

  return disciplines.filter((discipline) => {
    const haystack = normalizeText(
      [
        discipline.name,
        discipline.shortName,
        discipline.code ?? "",
        discipline.description,
        discipline.syllabus.flatMap((unit) => [unit.title, ...unit.items]).join(" "),
      ].join(" "),
    );
    return terms.every((term) => haystack.includes(term));
  });
}

export function searchTeachingPlans(
  plans: readonly TeachingPlan[],
  disciplines: readonly Discipline[],
  query: string,
): TeachingPlan[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [...plans];

  const nameById = new Map(disciplines.map((d) => [d.id, `${d.name} ${d.shortName}`]));

  return plans.filter((plan) => {
    const haystack = normalizeText(
      `${plan.title} ${plan.semester} ${nameById.get(plan.disciplineId) ?? ""}`,
    );
    return terms.every((term) => haystack.includes(term));
  });
}

/**
 * Normalises exactly as normalizeText does, while recording which original
 * character each normalised character came from. Doing both in one pass is
 * what keeps highlight offsets trustworthy.
 */
function normalizeWithMap(text: string): { normalized: string; map: number[] } {
  const out: string[] = [];
  const map: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const folded = (text[i] ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[‘’'`´]/g, "")
      .replace(/[^a-z0-9]+/g, "");

    if (folded === "") {
      // A separator becomes a single space, but never leads or doubles.
      if (out.length > 0 && out[out.length - 1] !== " ") {
        out.push(" ");
        map.push(i);
      }
      continue;
    }

    for (const char of folded) {
      out.push(char);
      map.push(i);
    }
  }

  // Drop the trailing space normalizeText would have trimmed.
  if (out[out.length - 1] === " ") {
    out.pop();
    map.pop();
  }

  map.push(text.length);
  return { normalized: out.join(""), map };
}

/**
 * Splits text around query matches so the UI can highlight them without
 * dangerouslySetInnerHTML.
 */
export function highlightSegments(text: string, query: string): { text: string; match: boolean }[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [{ text, match: false }];

  const { normalized, map } = normalizeWithMap(text);
  const ranges: [number, number][] = [];

  for (const term of terms) {
    let from = 0;
    for (;;) {
      const at = normalized.indexOf(term, from);
      if (at === -1) break;
      ranges.push([at, at + term.length]);
      from = at + term.length;
    }
  }

  if (ranges.length === 0) return [{ text, match: false }];

  ranges.sort((a, b) => a[0] - b[0]);

  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) {
      last[1] = Math.max(last[1], range[1]);
    } else {
      merged.push([range[0], range[1]]);
    }
  }

  const segments: { text: string; match: boolean }[] = [];
  let cursor = 0;

  for (const [start, end] of merged) {
    const rawStart = map[start] ?? text.length;
    const rawEnd = map[end] ?? text.length;
    if (rawStart > cursor) segments.push({ text: text.slice(cursor, rawStart), match: false });
    segments.push({ text: text.slice(rawStart, rawEnd), match: true });
    cursor = rawEnd;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
  return segments;
}
