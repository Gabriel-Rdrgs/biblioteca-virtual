import { describe, expect, it } from "vitest";
import { gradeSchemes, partForAssessment, schemeFor } from "@/lib/data/grading";
import { seedAssessments } from "@/lib/data/assessments";
import { disciplines } from "@/lib/data/disciplines";
import {
  formatGrade,
  neededInOther,
  outcomeFor,
  partMax,
  partialAverage,
  termScore,
  type GradeScheme,
} from "@/lib/domain/grading";
import { parseMark } from "@/lib/grade-storage";

const mac = schemeFor("mac-1")!;
const ic = schemeFor("ic-1")!;
const n1 = (scheme: GradeScheme) => scheme.terms.find((t) => t.id === "N1")!;

describe("a composição de cada bimestral", () => {
  it("soma os pontos onde o plano fala em pontos", () => {
    // MAC I: formativa 1,0 + teórica 6,0 + teórico-prática 3,0.
    const nota = termScore(n1(mac), {
      "mac-1-n1-formativa": 1,
      "mac-1-n1-teorica": 4.5,
      "mac-1-n1-pratica": 2,
    });
    expect(nota).toBe(7.5);
  });

  it("faz média ponderada onde o plano fala em pesos", () => {
    // IC I: formativa peso 1, prova peso 2, cada uma de 0 a 10.
    const nota = termScore(n1(ic), { "ic-1-n1-formativa": 9, "ic-1-n1-prova": 6 });
    expect(nota).toBeCloseTo((9 * 1 + 6 * 2) / 3, 10);
  });

  it("não inventa nota com parte faltando", () => {
    // Meia nota não é nota: mostrar 4,5 para quem só fez uma prova mentiria.
    expect(termScore(n1(mac), { "mac-1-n1-teorica": 4.5 })).toBeNull();
    expect(partialAverage(7, null)).toBeNull();
    expect(partialAverage(null, null)).toBeNull();
  });

  it("sabe em que escala cada parte é digitada", () => {
    const termo = n1(mac);
    expect(partMax(termo, termo.parts[1]!)).toBe(6);
    const termoIc = n1(ic);
    // Em pesos, toda parte vai de 0 a 10.
    expect(partMax(termoIc, termoIc.parts[0]!)).toBe(10);
  });

  it("toda parte cabe em 10 pontos, onde a soma é a nota", () => {
    for (const scheme of gradeSchemes) {
      for (const term of scheme.terms) {
        if (term.kind !== "pontos") continue;
        const total = term.parts.reduce((soma, part) => soma + part.value, 0);
        expect(total, `${scheme.disciplineId} ${term.id}`).toBeCloseTo(10, 10);
      }
    }
  });
});

describe("média, recuperação e situação", () => {
  const marks = {
    "mac-1-n1-formativa": 1,
    "mac-1-n1-teorica": 4,
    "mac-1-n1-pratica": 2,
  };

  it("responde quanto falta na outra bimestral", () => {
    // Tirou 7,0 na N1: precisa de 5,0 na N2 para fechar 6,0.
    expect(neededInOther(7, 6)).toBe(5);
    // Tirou 3,0: precisaria de 9,0.
    expect(neededInOther(3, 6)).toBe(9);
    // E pode passar de 10 — aí a resposta honesta é "não dá".
    expect(neededInOther(1, 6)).toBe(11);
  });

  it("diz o que falta enquanto só uma bimestral saiu", () => {
    const saida = outcomeFor(mac, marks);
    expect(saida.n1).toBe(7);
    expect(saida.n2).toBeNull();
    expect(saida.situation).toBe("incompleto");
    expect(saida.needed).toEqual({ term: "N2", score: 5 });
  });

  it("aprova com média parcial de 6,0, sem arredondar", () => {
    const saida = outcomeFor(mac, {
      ...marks,
      "mac-1-n2-formativa": 1,
      "mac-1-n2-teorica": 3,
      "mac-1-n2-pratica": 1,
    });
    // N1 7,0 e N2 5,0 → MP 6,0.
    expect(saida.mp).toBe(6);
    expect(saida.situation).toBe("aprovado");
    expect(saida.needed).toBeNull();
  });

  it("manda para a ARA abaixo da média, sem arredondar a parcial", () => {
    const saida = outcomeFor(mac, {
      ...marks,
      "mac-1-n2-formativa": 1,
      "mac-1-n2-teorica": 2.5,
      "mac-1-n2-pratica": 1,
    });
    // N1 7,0 e N2 4,5 → MP 5,75. O arredondamento não vale aqui.
    expect(saida.mp).toBe(5.75);
    expect(saida.situation).toBe("ara");
  });

  it("aplica o arredondamento institucional só na Média Final", () => {
    const base = {
      ...marks,
      "mac-1-n2-formativa": 1,
      "mac-1-n2-teorica": 2,
      "mac-1-n2-pratica": 1,
    };
    // N1 7,0 e N2 4,0 → MP 5,5.
    expect(outcomeFor(mac, base).mp).toBe(5.5);

    // Com 6,0 na ARA: MF = (5,5 + 6,0) ÷ 2 = 5,75 → aprovado.
    const naLinha = outcomeFor(mac, base, 6);
    expect(naLinha.mf).toBe(5.75);
    expect(naLinha.situation).toBe("aprovado_na_ara");

    // Com 5,9: MF = 5,7 → reprovado. A diferença é de cinco centésimos.
    const abaixo = outcomeFor(mac, base, 5.9);
    expect(abaixo.mf).toBe(5.7);
    expect(abaixo.situation).toBe("reprovado");
  });
});

describe("as notas transcritas dos planos", () => {
  it("cobre as sete unidades curriculares", () => {
    const comEsquema = new Set(gradeSchemes.map((s) => s.disciplineId));
    for (const discipline of disciplines) {
      expect(comEsquema.has(discipline.id), discipline.shortName).toBe(true);
    }
  });

  it("cita a página do plano em todas", () => {
    for (const scheme of gradeSchemes) {
      expect(scheme.source, scheme.disciplineId).toMatch(/Plano de ensino de .+, p\. \d+/);
    }
  });

  it("aponta cada parte com data para uma avaliação que existe", () => {
    const ids = new Set(seedAssessments.map((a) => a.id));
    for (const scheme of gradeSchemes) {
      for (const term of scheme.terms) {
        for (const part of term.parts) {
          if (!part.assessmentId) continue;
          expect(ids.has(part.assessmentId), `${scheme.disciplineId} → ${part.assessmentId}`).toBe(
            true,
          );
        }
      }
    }
  });

  it("acha a parte de nota a partir da data do calendário", () => {
    const achado = partForAssessment("mac-1-n1-teorica");
    expect(achado?.partId).toBe("mac-1-n1-teorica");
    expect(achado?.termId).toBe("N1");
    expect(achado?.max).toBe(6);
    // Uma devolutiva não vale nota.
    expect(partForAssessment("mac-1-devolutiva-n1")).toBeNull();
  });

  it("não repete id de parte entre disciplinas", () => {
    const todos = gradeSchemes.flatMap((s) => s.terms.flatMap((t) => t.parts.map((p) => p.id)));
    expect(new Set(todos).size).toBe(todos.length);
  });
});

describe("digitar e mostrar uma nota", () => {
  it("aceita vírgula, que é como se escreve nota", () => {
    expect(parseMark("7,5", 10)).toBe(7.5);
    expect(parseMark("7.5", 10)).toBe(7.5);
    expect(parseMark(" 8 ", 10)).toBe(8);
    expect(parseMark("", 10)).toBeNull();
  });

  it("recusa o que não cabe na escala", () => {
    // Digitar 85 em vez de 8,5 é o erro mais fácil de cometer.
    expect(parseMark("85", 10)).toBeNull();
    expect(parseMark("-1", 10)).toBeNull();
    expect(parseMark("7", 6)).toBeNull();
    expect(parseMark("abc", 10)).toBeNull();
  });

  it("escreve como nota: vírgula e sempre uma casa", () => {
    expect(formatGrade(7.5)).toBe("7,5");
    // "precisa de 5,0" lê como nota; "precisa de 5" lê como contagem.
    expect(formatGrade(6)).toBe("6,0");
    expect(formatGrade(5.75)).toBe("5,75");
    expect(formatGrade(8.333)).toBe("8,33");
    expect(formatGrade(0.75)).toBe("0,75");
  });
});

describe("a conta da recuperação", () => {
  it("diz quanto é preciso na ARA", async () => {
    const { neededInAra, finalAfterAra } = await import("@/lib/domain/grading");
    // Média parcial 5,5: com 6,0 na ARA a final dá 5,75, que aprova.
    expect(neededInAra(5.5, 5.75)).toBe(6);
    expect(finalAfterAra(5.5, 6)).toBe(5.75);

    // Média parcial 3,0 exigiria 8,5 na ARA — alto, mas possível.
    expect(neededInAra(3, 5.75)).toBe(8.5);
    // Já 1,0 exigiria 10,5: não sai.
    expect(neededInAra(1, 5.75)).toBeGreaterThan(10);
  });
});
