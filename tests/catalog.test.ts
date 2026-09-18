import { describe, expect, it } from "vitest";
import { books } from "@/lib/data/books";
import { bookDisciplines } from "@/lib/data/book-disciplines";
import { disciplines } from "@/lib/data/disciplines";
import { teachingPlans } from "@/lib/data/teaching-plans";
import {
  getBooksForDiscipline,
  getCatalog,
  getDuplicateCandidates,
  getSharedBooks,
  getStats,
} from "@/lib/repository";

describe("catalogue integrity", () => {
  it("gives every book a unique id and slug", () => {
    expect(new Set(books.map((b) => b.id)).size).toBe(books.length);
    expect(new Set(books.map((b) => b.slug)).size).toBe(books.length);
  });

  it("points every link at a real book and a real discipline", () => {
    const bookIds = new Set(books.map((b) => b.id));
    const disciplineIds = new Set(disciplines.map((d) => d.id));

    for (const link of bookDisciplines) {
      expect(bookIds, `livro ausente: ${link.bookId}`).toContain(link.bookId);
      expect(disciplineIds, `disciplina ausente: ${link.disciplineId}`).toContain(
        link.disciplineId,
      );
    }
  });

  it("never links the same book to the same discipline twice", () => {
    const pairs = bookDisciplines.map((l) => `${l.bookId}::${l.disciplineId}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("leaves no book orphaned from a discipline", () => {
    const linked = new Set(bookDisciplines.map((l) => l.bookId));
    const orphans = books.filter((b) => !linked.has(b.id)).map((b) => b.id);
    expect(orphans).toEqual([]);
  });

  it("gives every discipline a teaching plan", () => {
    for (const discipline of disciplines) {
      const plan = teachingPlans.find((p) => p.disciplineId === discipline.id);
      expect(plan, `sem plano: ${discipline.id}`).toBeDefined();
      expect(plan?.fileUrl).toBe(discipline.teachingPlanFile);
    }
  });

  it("traces every book back to the plan it was read from", () => {
    const disciplineIds = new Set(disciplines.map((d) => d.id));
    for (const book of books) {
      expect(disciplineIds).toContain(book.provenance.sourcePlanId);
      expect(book.provenance.rawCitation.length).toBeGreaterThan(20);
      expect(book.provenance.sourcePage).toBeGreaterThan(0);
    }
  });

  it("explains every pending record", () => {
    for (const book of books) {
      if (book.provenance.reviewStatus !== "pendente") continue;
      expect(book.provenance.reviewNote, `sem nota: ${book.id}`).toBeTruthy();
    }
  });
});

describe("one book, many disciplines", () => {
  it("stores a shared title once and links it twice", () => {
    const shared = getSharedBooks();
    const ids = shared.map((entry) => entry.book.id);

    expect(ids).toContain("gartner-tratado-de-histologia");
    expect(ids).toContain("semiologia-do-adulto");
    expect(ids).toContain("etica-em-pesquisa");
    expect(ids).toContain("tratado-medicina-familia-comunidade");

    // Exactly one record each, despite appearing in two plans.
    expect(books.filter((b) => b.id === "gartner-tratado-de-histologia")).toHaveLength(1);
  });

  it("keeps the bibliography weight each discipline assigned", () => {
    const mattos = getCatalog().find((e) => e.book.id === "semiologia-do-adulto");
    const byDiscipline = new Map(
      mattos?.links.map((l) => [l.disciplineId, l.bibliographyType]) ?? [],
    );

    expect(byDiscipline.get("hm-1")).toBe("basica");
    expect(byDiscipline.get("ha-1")).toBe("complementar");
  });

  it("lists a shared book under both of its disciplines", () => {
    const inMac = getBooksForDiscipline("mac-1").map((e) => e.book.id);
    const inAes2 = getBooksForDiscipline("aes-2").map((e) => e.book.id);

    expect(inMac).toContain("gartner-tratado-de-histologia");
    expect(inAes2).toContain("gartner-tratado-de-histologia");
  });
});

describe("deduplication", () => {
  it("does not merge two different books that share a title", () => {
    const candidates = getDuplicateCandidates();
    const pair = candidates.find(
      (c) =>
        [c.leftId, c.rightId].includes("rocco-semiologia-medica") &&
        [c.leftId, c.rightId].includes("porto-semiologia-medica"),
    );

    expect(pair).toBeDefined();
    expect(pair?.reason).toBe("Mesmo título, autores diferentes");
    expect(pair?.confidence).toBe("baixa");
  });

  it("flags the two Código de Ética Médica editions without merging them", () => {
    const candidates = getDuplicateCandidates();
    const pair = candidates.find(
      (c) =>
        [c.leftId, c.rightId].includes("codigo-de-etica-medica-2019") &&
        [c.leftId, c.rightId].includes("codigo-de-etica-medica-2010"),
    );

    expect(pair).toBeDefined();
    expect(pair?.reason).toContain("anos de publicação diferentes");
    expect(books.filter((b) => b.title === "Código de Ética Médica")).toHaveLength(2);
  });

  it("never reports a book against itself", () => {
    for (const candidate of getDuplicateCandidates()) {
      expect(candidate.leftId).not.toBe(candidate.rightId);
    }
  });
});

describe("stats", () => {
  it("counts what the home page claims", () => {
    const stats = getStats();

    expect(stats.books).toBe(books.length);
    expect(stats.disciplines).toBe(7);
    expect(stats.teachingPlans).toBe(7);
    expect(stats.sharedBooks).toBe(getSharedBooks().length);
    expect(stats.sharedBooks).toBeGreaterThan(0);
  });

  it("derives shared count from links, not from titles", () => {
    const expected = books.filter(
      (b) => bookDisciplines.filter((l) => l.bookId === b.id).length > 1,
    ).length;
    expect(getStats().sharedBooks).toBe(expected);
  });
});
