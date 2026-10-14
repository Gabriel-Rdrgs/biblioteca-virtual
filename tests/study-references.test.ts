import { describe, expect, it } from "vitest";
import { books } from "@/lib/data/books";
import { questionAreas } from "@/lib/data/questions";
import { readerHref, referencesForAxis, studyReferences } from "@/lib/data/study-references";

/**
 * The chapter map is what turns "você está fraco em teníase" into
 * something to do. A reference that points at the wrong book, or at a
 * book nobody can open, is worse than none.
 */

describe("onde estudar cada eixo", () => {
  it("points only at eixos that exist", () => {
    const axes = new Set(questionAreas.flatMap((area) => area.axes.map((axis) => axis.id)));
    for (const reference of studyReferences) {
      expect(axes.has(reference.axisId), reference.axisId).toBe(true);
    }
  });

  it("points only at books the class can actually open", () => {
    for (const reference of studyReferences) {
      const book = books.find((b) => b.id === reference.bookId);
      expect(book, reference.bookId).toBeDefined();
      // No file means no reader, and the link would go nowhere.
      expect(book!.file, `${reference.bookId} sem PDF`).toBeDefined();
      expect(book!.visibility).toBe("visivel");
    }
  });

  it("cites a page of the PDF, never a page zero", () => {
    for (const reference of studyReferences) {
      expect(Number.isInteger(reference.page), reference.section).toBe(true);
      expect(reference.page).toBeGreaterThan(0);
      expect(reference.page).toBeLessThan(3000);
      expect(reference.section.length).toBeGreaterThan(4);
    }
  });

  it("covers every eixo of MAC I, which is where the simulados are", () => {
    const macAxes = questionAreas
      .filter((area) => area.disciplineId === "mac-1")
      .flatMap((area) => area.axes.map((axis) => axis.id));
    for (const axisId of macAxes) {
      expect(referencesForAxis(axisId).length, `eixo sem leitura: ${axisId}`).toBeGreaterThan(0);
    }
  });

  it("keeps each reference in the área its eixo belongs to", () => {
    for (const reference of studyReferences) {
      const area = questionAreas.find((a) => a.id === reference.areaId);
      expect(area, reference.areaId).toBeDefined();
      expect(area!.axes.some((axis) => axis.id === reference.axisId)).toBe(true);
    }
  });

  it("builds a link that opens the reader on that page", () => {
    const [first] = referencesForAxis("tenia");
    expect(first).toBeDefined();
    expect(readerHref(first!)).toBe("/livros/parasitologia-contemporanea/ler?pagina=751");
  });

  it("returns nothing for an eixo with no reading mapped", () => {
    expect(referencesForAxis("nao-existe")).toEqual([]);
  });
});
