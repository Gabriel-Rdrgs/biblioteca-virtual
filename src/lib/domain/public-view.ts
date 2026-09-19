import type { Book } from "./types";

/**
 * The class-facing shape of a record: same book, none of the housekeeping.
 *
 * Provenance — the plan's literal citation, review notes about broken author
 * strings or older editions, who supplied a file and on what basis — matters
 * to whoever maintains the catalogue and is noise for a student who just
 * wants to open the book. Everything client-bound goes through this unless
 * the request is an admin's.
 */
export function publicBook(book: Book): Book {
  return {
    ...book,
    provenance: {
      sourceKind: book.provenance.sourceKind,
      rawCitation: "",
      reviewStatus: "ok",
    },
    ...(book.file
      ? {
          file: {
            path: book.file.path,
            origin: "",
            authorization: "",
            addedAt: book.file.addedAt,
            ...(book.file.sizeBytes ? { sizeBytes: book.file.sizeBytes } : {}),
          },
        }
      : {}),
  };
}
