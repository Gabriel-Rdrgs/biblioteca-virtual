import type { Book, DuplicateCandidate } from "./types";
import { normalizeAuthor, normalizeIsbn, normalizeTitle } from "./normalize";

/**
 * Duplicate detection for imported bibliography.
 *
 * The rule is deliberately conservative: only a matching ISBN is treated as
 * proof. Everything else is reported for a human to decide, because the real
 * catalogue contains two different books both titled "Semiologia Médica"
 * (Rocco and Porto) and two editions of the Código de Ética Médica that must
 * stay apart.
 */

export interface DuplicateVerdict {
  readonly duplicate: boolean;
  readonly reason: string;
  readonly confidence: "alta" | "media" | "baixa";
}

function sharesAuthor(left: Book, right: Book): boolean {
  const leftAuthors = new Set(left.authors.map(normalizeAuthor));
  return right.authors.some((author) => leftAuthors.has(normalizeAuthor(author)));
}

/**
 * Compares two records. Returns `duplicate: true` only for an ISBN match;
 * softer signals come back as candidates for review.
 */
export function compareBooks(left: Book, right: Book): DuplicateVerdict {
  if (left.isbn && right.isbn && normalizeIsbn(left.isbn) === normalizeIsbn(right.isbn)) {
    return { duplicate: true, reason: "ISBN idêntico", confidence: "alta" };
  }

  const sameTitle = normalizeTitle(left.title) === normalizeTitle(right.title);

  if (sameTitle && sharesAuthor(left, right)) {
    const sameYear = left.publicationYear === right.publicationYear;
    return {
      duplicate: false,
      reason: sameYear
        ? "Mesmo título e autor, sem ISBN para confirmar"
        : "Mesmo título e autor, anos de publicação diferentes",
      confidence: sameYear ? "alta" : "media",
    };
  }

  if (sameTitle) {
    return {
      duplicate: false,
      reason: "Mesmo título, autores diferentes",
      confidence: "baixa",
    };
  }

  return { duplicate: false, reason: "Sem indício de duplicidade", confidence: "baixa" };
}

/**
 * Scans the catalogue for pairs worth a second look. Nothing here is merged
 * automatically — the result feeds the admin review queue.
 */
export function findDuplicateCandidates(books: readonly Book[]): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];

  for (let i = 0; i < books.length; i++) {
    for (let j = i + 1; j < books.length; j++) {
      const left = books[i];
      const right = books[j];
      if (!left || !right) continue;

      const verdict = compareBooks(left, right);
      if (verdict.reason === "Sem indício de duplicidade") continue;

      candidates.push({
        leftId: left.id,
        rightId: right.id,
        reason: verdict.duplicate ? `${verdict.reason} — unificar` : verdict.reason,
        confidence: verdict.confidence,
      });
    }
  }

  return candidates;
}
