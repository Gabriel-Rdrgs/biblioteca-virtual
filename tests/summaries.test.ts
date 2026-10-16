import { describe, expect, it } from "vitest";
import { seedSummaries } from "@/lib/data/summaries";
import { seedAssessments } from "@/lib/data/assessments";
import { questionAreas } from "@/lib/data/questions";
import { disciplines as seedDisciplines } from "@/lib/data/disciplines";
import {
  bySequence,
  isLesson,
  lessonDayLabel,
  lessonLabel,
  type CycleSummary,
  type LessonSummary,
  type Summary,
} from "@/lib/domain/summary-types";
import { mergeSummaries } from "@/lib/repository/summaries";
import { emptyManifest } from "@/lib/domain/types";

const aula = (extra: Partial<LessonSummary> = {}): LessonSummary => ({
  kind: "aula",
  id: "x",
  slug: "x",
  disciplineId: "mac-1",
  lesson: 1,
  date: "2026-08-11",
  title: "t",
  topics: [],
  areaIds: [],
  axisIds: [],
  assessmentIds: [],
  pdfPath: "x.pdf",
  pages: 1,
  addedAt: "2026-10-14",
  visibility: "visivel",
  origin: "seed",
  ...extra,
});

describe("os resumos", () => {
  it("aponta cada um para uma disciplina que existe", () => {
    const ids = new Set(seedDisciplines.map((d) => d.id));
    for (const summary of seedSummaries) {
      expect(ids.has(summary.disciplineId), summary.id).toBe(true);
    }
  });

  it("aponta cada avaliação citada para uma data real do calendário", () => {
    const ids = new Set(seedAssessments.map((a) => a.id));
    for (const summary of seedSummaries) {
      for (const assessmentId of summary.assessmentIds) {
        expect(ids.has(assessmentId), `${summary.id} → ${assessmentId}`).toBe(true);
      }
    }
  });

  it("aponta cada eixo citado para um eixo do banco de questões", () => {
    // É este laço que transforma um erro no simulado em leitura dirigida:
    // se o eixo não existir, o resumo nunca seria sugerido a ninguém.
    const eixos = new Set(questionAreas.flatMap((area) => area.axes.map((axis) => axis.id)));
    const areas = new Set(questionAreas.map((area) => area.id));
    for (const summary of seedSummaries) {
      for (const axisId of summary.axisIds) {
        expect(eixos.has(axisId), `${summary.id} → ${axisId}`).toBe(true);
      }
      for (const areaId of summary.areaIds) {
        expect(areas.has(areaId), `${summary.id} → ${areaId}`).toBe(true);
      }
    }
  });

  it("não repete slug nem id", () => {
    expect(new Set(seedSummaries.map((s) => s.id)).size).toBe(seedSummaries.length);
    expect(new Set(seedSummaries.map((s) => s.slug)).size).toBe(seedSummaries.length);
  });

  it("rotula a aula como o próprio resumo se apresenta", () => {
    expect(lessonLabel(aula({ lesson: 1 }))).toBe("Aula 01");
    expect(lessonLabel(aula({ lesson: 12 }))).toBe("Aula 12");
    expect(lessonDayLabel("2026-08-11")).toBe("11/08");
  });

  it("separa resumo de aula de resumo de ciclo", () => {
    const ciclo: CycleSummary = {
      ...aula(),
      kind: "ciclo",
      cycleLabel: "N1",
    } as unknown as CycleSummary;
    expect(isLesson(aula())).toBe(true);
    expect(isLesson(ciclo)).toBe(false);
  });

  it("ordena as aulas por número e deixa o ciclo por último", () => {
    const ciclo = { ...aula({ id: "c" }), kind: "ciclo", cycleLabel: "N1" } as unknown as Summary;
    const lista: Summary[] = [ciclo, aula({ id: "a3", lesson: 3 }), aula({ id: "a1", lesson: 1 })];
    expect([...lista].sort(bySequence).map((s) => s.id)).toEqual(["a1", "a3", "c"]);
  });

  it("deixa o admin corrigir um resumo publicado sem perder o original", () => {
    const corrigido = mergeSummaries({
      ...emptyManifest,
      summaryOverrides: { "mac-1-aula-01": { title: "Outro título" } },
    });
    const alvo = corrigido.find((s) => s.id === "mac-1-aula-01");
    expect(alvo?.title).toBe("Outro título");
    // A semente em si não foi tocada.
    expect(seedSummaries.find((s) => s.id === "mac-1-aula-01")?.title).toBe(
      "Microscopia + Referenciais anatômicos",
    );
  });

  it("esconde da turma o que estiver oculto", () => {
    const lista = mergeSummaries({
      ...emptyManifest,
      summaryOverrides: { "mac-1-aula-01": { visibility: "oculto" } },
    });
    expect(lista.find((s) => s.id === "mac-1-aula-01")?.visibility).toBe("oculto");
  });
});

describe("o conjunto de MAC I", () => {
  const mac = seedSummaries.filter((s) => s.disciplineId === "mac-1");
  const aulas = mac.filter(isLesson);

  it("tem as 26 aulas do semestre, sem número repetido e em ordem de data", () => {
    expect(aulas).toHaveLength(26);
    expect(new Set(aulas.map((a) => a.lesson)).size).toBe(26);

    const porNumero = [...aulas].sort((a, b) => a.lesson - b.lesson);
    const datas = porNumero.map((a) => a.date);
    // Aula 12 não pode ser anterior à 11: a numeração segue o calendário.
    expect([...datas].sort()).toEqual(datas);
  });

  it("guarda um arquivo próprio para cada resumo", () => {
    const arquivos = mac.map((s) => s.pdfPath);
    expect(new Set(arquivos).size).toBe(mac.length);
    for (const arquivo of arquivos) expect(arquivo).toMatch(/^mac-1-[a-z0-9-]+\.pdf$/);
  });

  it("cai sempre numa prova que vem depois da aula", () => {
    // O erro fácil é ligar uma aula do 2º bimestre à N1, que já passou.
    const datas = new Map(seedAssessments.map((a) => [a.id, a.date]));
    for (const resumo of aulas) {
      for (const assessmentId of resumo.assessmentIds) {
        const prova = datas.get(assessmentId)!;
        expect(prova >= resumo.date, `${resumo.id} → ${assessmentId}`).toBe(true);
      }
    }
  });

  it("fecha os dois ciclos, cada um apontando para a sua bimestral", () => {
    const ciclos = mac.filter((s) => !isLesson(s)) as CycleSummary[];
    expect(ciclos.map((c) => c.cycleLabel)).toEqual(["N1", "N2"]);
    expect(ciclos[0]?.assessmentIds).toContain("mac-1-n1-teorica");
    // A N2 é acumulativa, e o resumo da N1 se apresenta como a Parte 1 dela.
    expect(ciclos[0]?.assessmentIds).toContain("mac-1-n2-teorica");
    expect(ciclos[1]?.assessmentIds).toContain("mac-1-n2-teorica");
  });
});
