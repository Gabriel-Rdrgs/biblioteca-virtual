import { describe, expect, it } from "vitest";
import { getCatalog } from "@/lib/repository";
import {
  emptyFilters,
  highlightSegments,
  searchCatalog,
  type CatalogFilters,
} from "@/lib/domain/search";

const catalog = getCatalog();

function find(query: string, overrides: Partial<CatalogFilters> = {}) {
  return searchCatalog(catalog, { ...emptyFilters, query, ...overrides }).map((e) => e.book.id);
}

describe("search", () => {
  it("finds a book by a fragment of its title", () => {
    expect(find("bates")).toContain("bates-propedeutica-medica-essencial");
  });

  it("ignores accents and case in both query and data", () => {
    expect(find("semiologia")).toContain("rocco-semiologia-medica");
    expect(find("SEMIOLOGIA")).toEqual(find("semiologia"));
    expect(find("etica")).toContain("etica-em-pesquisa");
    expect(find("ética")).toEqual(find("etica"));
  });

  it("finds books by author surname", () => {
    expect(find("gartner")).toContain("gartner-tratado-de-histologia");
    expect(find("alberts")).toContain("biologia-molecular-da-celula");
  });

  it("finds books by the discipline that uses them", () => {
    const results = find("humanidades");
    expect(results).toContain("por-tras-do-jaleco-branco");
  });

  it("finds books by topic", () => {
    expect(find("anamnese")).toContain("bates-propedeutica-medica-essencial");
    expect(find("metodologia cientifica")).toContain("fundamentos-de-metodologia-cientifica");
  });

  it("requires every term to match somewhere", () => {
    expect(find("bates anamnese")).toContain("bates-propedeutica-medica-essencial");
    expect(find("bates parasitologia")).toEqual([]);
  });

  it("returns the whole catalogue for an empty query", () => {
    expect(find("")).toHaveLength(catalog.length);
  });

  it("ranks a title match above a topic-only match", () => {
    const results = find("histologia");
    expect(results[0]).toBe("gartner-tratado-de-histologia");
  });
});

describe("combined filters", () => {
  it("narrows to one discipline", () => {
    const results = find("", { disciplines: ["ic-1"] });
    expect(results).toContain("saude-baseada-em-evidencias");
    expect(results).not.toContain("moore-anatomia-clinica");
  });

  it("narrows to a bibliography type", () => {
    const results = find("", { bibliographyTypes: ["basica"] });
    expect(results).toContain("bates-propedeutica-medica-essencial");
    expect(results).not.toContain("suporte-basico-a-vida");
  });

  it("combines discipline and bibliography type", () => {
    const results = find("", {
      disciplines: ["ha-1"],
      bibliographyTypes: ["basica"],
    });

    expect(results).toContain("bates-propedeutica-medica-essencial");
    expect(results).toContain("porto-exame-clinico");
    expect(results).not.toContain("porto-semiologia-medica");
  });

  it("isolates books used by more than one discipline", () => {
    const results = find("", { sharedOnly: true });
    expect(results).toContain("gartner-tratado-de-histologia");
    expect(results).not.toContain("moore-anatomia-clinica");
  });

  it("filters by availability", () => {
    const withPdf = find("", { availability: "com_pdf" });
    const open = find("", { availability: "publico" });
    const referenceOnly = find("", { availability: "somente_referencia" });

    expect(open).toContain("codigo-de-etica-medica-2019");
    expect(referenceOnly).toContain("medicina-antiga");
    expect(referenceOnly).not.toContain("codigo-de-etica-medica-2019");
    expect(withPdf.every((id) => !referenceOnly.includes(id))).toBe(true);
  });

  it("returns nothing when filters cannot be satisfied together", () => {
    expect(find("", { disciplines: ["ic-1"], bibliographyTypes: ["outras_referencias"] })).toEqual(
      [],
    );
  });
});

describe("sorting", () => {
  it("sorts by title", () => {
    const titles = searchCatalog(catalog, { ...emptyFilters, sort: "titulo" }).map(
      (e) => e.book.title,
    );
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, "pt-BR")));
  });

  it("sorts by number of disciplines", () => {
    const counts = searchCatalog(catalog, { ...emptyFilters, sort: "disciplinas" }).map(
      (e) => e.links.length,
    );
    expect(counts[0]).toBeGreaterThanOrEqual(counts[counts.length - 1] ?? 0);
  });
});

describe("highlightSegments", () => {
  it("marks the matched run and leaves the rest alone", () => {
    const segments = highlightSegments("Semiologia Médica", "semiologia");
    expect(segments.filter((s) => s.match).map((s) => s.text)).toEqual(["Semiologia"]);
    expect(segments.map((s) => s.text).join("")).toBe("Semiologia Médica");
  });

  it("matches through accents without corrupting the original text", () => {
    const segments = highlightSegments("Ética em pesquisa", "etica");
    expect(segments.filter((s) => s.match).map((s) => s.text)).toEqual(["Ética"]);
    expect(segments.map((s) => s.text).join("")).toBe("Ética em pesquisa");
  });

  it("preserves the text exactly when nothing matches", () => {
    const original = "Tratado de Histologia";
    const segments = highlightSegments(original, "anatomia");
    expect(segments).toEqual([{ text: original, match: false }]);
  });

  it("keeps the source string intact for every query", () => {
    const original = "Bates — Propedêutica Médica Essencial";
    for (const query of ["bates", "propedeutica", "medica essencial", "essencial"]) {
      expect(
        highlightSegments(original, query)
          .map((s) => s.text)
          .join(""),
      ).toBe(original);
    }
  });
});
