/**
 * Text normalisation shared by search and deduplication.
 *
 * Bibliographies from different teaching plans spell the same book many ways:
 * "PORTO, C.C." vs "PORTO, Celmo Celeno", "4ª edição" vs "4. ed.", stray
 * double spaces from PDF extraction. These helpers fold that noise away
 * without ever mutating the stored citation.
 */

/** Strips diacritics, case and punctuation noise. "Ética" -> "etica". */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[‘’'`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const TITLE_NOISE =
  /\b(\d+\s*(a|ed|edicao|edition)\b[a-z]*|ebook|e book|volumes?|vols?|tomo\s*\d+)\b/g;

/**
 * Normalises a title for equality checks: drops edition markers, format
 * words and subtitle tails so "Parasitologia, 4ª edição" and
 * "Parasitologia" compare equal.
 */
export function normalizeTitle(title: string): string {
  const withoutSubtitle = title.split(/\s[:–—-]\s/u)[0] ?? title;
  return normalizeText(withoutSubtitle).replace(TITLE_NOISE, " ").replace(/\s+/g, " ").trim();
}

/**
 * Reduces an author to surname plus initials, so "PORTO, C.C." and
 * "PORTO, Celmo Celeno" both become "porto c c".
 */
export function normalizeAuthor(author: string): string {
  const cleaned = author.replace(/\b(et\s*al|orgs?|organizadores?|eds?)\b\.?/gi, " ");
  const [surnamePart, givenPart] = cleaned.split(",");
  const surname = normalizeText(surnamePart ?? cleaned);
  if (!givenPart) return surname;

  const initials = normalizeText(givenPart)
    .split(" ")
    .filter(Boolean)
    .map((token) => token[0])
    .join(" ");

  return initials ? `${surname} ${initials}` : surname;
}

/** Digits only, so "978-85-277-2027-4" and "9788527720274" compare equal. */
export function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[^0-9xX]/g, "").toUpperCase();
}

/** URL-safe slug: "Ética em pesquisa" -> "etica-em-pesquisa". */
export function slugify(input: string): string {
  return normalizeText(input).replace(/\s+/g, "-");
}

const STOPWORDS = new Set([
  "a",
  "as",
  "ao",
  "aos",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por",
  "com",
  "um",
  "uma",
]);

/**
 * Splits a query into terms, dropping words too short or too common to
 * narrow anything down.
 */
export function tokenize(query: string): string[] {
  return normalizeText(query)
    .split(" ")
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}
