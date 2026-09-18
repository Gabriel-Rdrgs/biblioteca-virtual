import { describe, expect, it } from "vitest";
import {
  normalizeAuthor,
  normalizeIsbn,
  normalizeText,
  normalizeTitle,
  slugify,
  tokenize,
} from "@/lib/domain/normalize";

describe("normalizeText", () => {
  it("folds accents and case", () => {
    expect(normalizeText("Ética")).toBe("etica");
    expect(normalizeText("ÉTICA")).toBe("etica");
    expect(normalizeText("Saúde Coletiva")).toBe("saude coletiva");
    expect(normalizeText("Crescimento e Diferenciação Celular")).toBe(
      "crescimento e diferenciacao celular",
    );
  });

  it("collapses punctuation, hyphens and repeated spaces", () => {
    expect(normalizeText("Ensino-Serviço--Comunidade")).toBe("ensino servico comunidade");
    expect(normalizeText("  Bates  —  Propedêutica  ")).toBe("bates propedeutica");
    expect(normalizeText("KJELLSTRÖM, A.")).toBe("kjellstrom a");
  });
});

describe("normalizeTitle", () => {
  it("treats edition markers as noise", () => {
    expect(normalizeTitle("Parasitologia, 4ª edição")).toBe(normalizeTitle("Parasitologia"));
    expect(normalizeTitle("Histologia 5. ed.")).toBe(normalizeTitle("Histologia"));
  });

  it("drops the subtitle so the same work matches across plans", () => {
    expect(normalizeTitle("Semiologia do Adulto - Diagnóstico Clínico Baseado em Evidências")).toBe(
      "semiologia do adulto",
    );
  });

  it("keeps genuinely different titles apart", () => {
    expect(normalizeTitle("Histologia")).not.toBe(normalizeTitle("Tratado de Histologia"));
    expect(normalizeTitle("Parasitologia")).not.toBe(normalizeTitle("Parasitologia Contemporânea"));
  });
});

describe("normalizeAuthor", () => {
  it("matches an abbreviated author to its expanded form", () => {
    expect(normalizeAuthor("PORTO, C.C.")).toBe(normalizeAuthor("PORTO, Celmo Celeno"));
    expect(normalizeAuthor("LUZ, P.")).toBe(normalizeAuthor("LUZ, Protásio"));
  });

  it("ignores editorial qualifiers", () => {
    expect(normalizeAuthor("STEWART, Moira et al.")).toBe(normalizeAuthor("STEWART, Moira"));
    expect(normalizeAuthor("DUNCAN, B. B., organizadores")).toBe(normalizeAuthor("DUNCAN, B. B."));
  });

  it("keeps different people with the same surname apart", () => {
    expect(normalizeAuthor("MATTOS, Waldo")).not.toBe(normalizeAuthor("MATTOS, R."));
  });
});

describe("normalizeIsbn", () => {
  it("ignores hyphenation", () => {
    expect(normalizeIsbn("978-85-277-2027-4")).toBe("9788527720274");
    expect(normalizeIsbn("9788527720274")).toBe(normalizeIsbn("978-85-277-2027-4"));
  });
});

describe("slugify", () => {
  it("produces url-safe slugs", () => {
    expect(slugify("Ética em pesquisa")).toBe("etica-em-pesquisa");
    expect(slugify("AES 2 — Crescimento e Diferenciação Celular")).toBe(
      "aes-2-crescimento-e-diferenciacao-celular",
    );
  });
});

describe("tokenize", () => {
  it("drops stopwords and single characters", () => {
    expect(tokenize("livros da AES 2")).toEqual(["livros", "aes"]);
    expect(tokenize("história da medicina")).toEqual(["historia", "medicina"]);
  });

  it("returns nothing for an empty query", () => {
    expect(tokenize("   ")).toEqual([]);
  });
});
