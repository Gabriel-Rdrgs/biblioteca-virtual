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

  it("traces every plan-sourced book back to a section and page", () => {
    const disciplineIds = new Set(disciplines.map((d) => d.id));
    for (const book of books) {
      expect(book.provenance.rawCitation.length).toBeGreaterThan(20);
      if (book.provenance.sourceKind !== "plano_de_ensino") continue;
      expect(disciplineIds).toContain(book.provenance.sourcePlanId);
      expect(book.provenance.sourcePage).toBeGreaterThan(0);
    }
  });

  it("only lets class-posted books skip the plan and always with a file", () => {
    for (const book of books) {
      if (book.provenance.sourceKind !== "acervo_da_turma") continue;
      expect(book.file, `sem arquivo: ${book.id}`).toBeDefined();
      const links = bookDisciplines.filter((l) => l.bookId === book.id);
      expect(links.length).toBeGreaterThan(0);
      expect(links.every((l) => l.bibliographyType === "acervo_da_turma")).toBe(true);
    }
  });

  it("records origin and authorisation on every posted file", () => {
    for (const book of books) {
      if (!book.file) continue;
      expect(book.file.origin.length).toBeGreaterThan(5);
      expect(book.file.authorization.length).toBeGreaterThan(5);
      expect(book.accessType).toBe("class_only");
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
  it("stores a shared title once and links it twice", async () => {
    const shared = await getSharedBooks();
    const ids = shared.map((entry) => entry.book.id);

    // Only the shared title with a posted file is visible today.
    expect(ids).toContain("gartner-tratado-de-histologia");
    const linkCount = (id: string) => bookDisciplines.filter((l) => l.bookId === id).length;
    for (const id of [
      "semiologia-do-adulto",
      "etica-em-pesquisa",
      "tratado-medicina-familia-comunidade",
    ]) {
      expect(linkCount(id)).toBe(2);
    }

    // Exactly one record each, despite appearing in two plans.
    expect(books.filter((b) => b.id === "gartner-tratado-de-histologia")).toHaveLength(1);
  });

  it("keeps the bibliography weight each discipline assigned", async () => {
    const byDiscipline = new Map(
      bookDisciplines
        .filter((l) => l.bookId === "semiologia-do-adulto")
        .map((l) => [l.disciplineId, l.bibliographyType]),
    );

    expect(byDiscipline.get("hm-1")).toBe("basica");
    expect(byDiscipline.get("ha-1")).toBe("complementar");
  });

  it("lists a shared book under both of its disciplines", async () => {
    const inMac = (await getBooksForDiscipline("mac-1")).map((e) => e.book.id);
    const inAes2 = (await getBooksForDiscipline("aes-2")).map((e) => e.book.id);

    expect(inMac).toContain("gartner-tratado-de-histologia");
    expect(inAes2).toContain("gartner-tratado-de-histologia");
  });
});

describe("deduplication", () => {
  it("does not merge two different books that share a title", async () => {
    const candidates = await getDuplicateCandidates();
    const pair = candidates.find(
      (c) =>
        [c.leftId, c.rightId].includes("rocco-semiologia-medica") &&
        [c.leftId, c.rightId].includes("porto-semiologia-medica"),
    );

    expect(pair).toBeDefined();
    expect(pair?.reason).toBe("Mesmo título, autores diferentes");
    expect(pair?.confidence).toBe("baixa");
  });

  it("flags the two Código de Ética Médica editions without merging them", async () => {
    const candidates = await getDuplicateCandidates();
    const pair = candidates.find(
      (c) =>
        [c.leftId, c.rightId].includes("codigo-de-etica-medica-2019") &&
        [c.leftId, c.rightId].includes("codigo-de-etica-medica-2010"),
    );

    expect(pair).toBeDefined();
    expect(pair?.reason).toContain("anos de publicação diferentes");
    expect(books.filter((b) => b.title === "Código de Ética Médica")).toHaveLength(2);
  });

  it("never reports a book against itself", async () => {
    for (const candidate of await getDuplicateCandidates()) {
      expect(candidate.leftId).not.toBe(candidate.rightId);
    }
  });
});

describe("visibility", () => {
  it("hides a book until it has a file or an open link", () => {
    for (const book of books) {
      const hasSomethingToOpen = Boolean(book.file || book.externalUrl);
      expect(book.visibility, book.id).toBe(hasSomethingToOpen ? "visivel" : "oculto");
    }
  });

  it("never lists a hidden book in the catalogue", async () => {
    const ids = new Set((await getCatalog()).map((e) => e.book.id));
    for (const book of books) {
      if (book.visibility === "oculto") expect(ids.has(book.id), book.id).toBe(false);
    }
  });
});

describe("stats", () => {
  it("counts what the home page claims", async () => {
    const stats = await getStats();

    const visible = books.filter((b) => b.visibility === "visivel");
    expect(stats.books).toBe(visible.length);
    expect(visible.length).toBeGreaterThan(0);
    expect(stats.disciplines).toBe(7);
    expect(stats.teachingPlans).toBe(7);
    expect(stats.sharedBooks).toBe((await getSharedBooks()).length);
    expect(stats.sharedBooks).toBeGreaterThan(0);
  });

  it("derives shared count from links, not from titles", async () => {
    const expected = books.filter(
      (b) =>
        b.visibility === "visivel" && bookDisciplines.filter((l) => l.bookId === b.id).length > 1,
    ).length;
    expect((await getStats()).sharedBooks).toBe(expected);
  });
});

describe("access counts", () => {
  it("puts the most opened book first and falls back to core bibliography", async () => {
    const { getMostAccessed, recordAccess } = await import("@/lib/repository");
    const { resetManifestCache } = await import("@/lib/catalog-store");
    const before = await getMostAccessed(3);
    expect(before.length).toBeGreaterThan(0);

    const target = before[before.length - 1]!.book.id;
    for (let i = 0; i < 3; i++) await recordAccess(target);
    resetManifestCache();

    const after = await getMostAccessed(3);
    expect(after[0]?.book.id).toBe(target);
  });
});
