import type { Summary } from "@/lib/domain/summary-types";

/**
 * Os resumos publicados para a turma.
 *
 * Cada um é transcrito do próprio arquivo: aula, data, encontro e ciclo
 * saem do cabeçalho e do rodapé do PDF, não de suposição. O que o resumo
 * não disser sobre si mesmo não entra aqui.
 */

const base = {
  visibility: "visivel" as const,
  origin: "seed" as const,
};

export const seedSummaries: readonly Summary[] = [
  {
    ...base,
    kind: "aula",
    id: "mac-1-aula-01",
    slug: "mac-1-aula-01-microscopia-e-referenciais",
    disciplineId: "mac-1",
    lesson: 1,
    meeting: 3,
    date: "2026-08-11",
    title: "Microscopia e referenciais anatômicos",
    topics: [
      "Microscopia: partes mecânica e óptica, aumento total, limite de resolução e a rotina de focalização.",
      "Técnica histológica: fixação, desidratação, inclusão, corte e coloração; HE e PAS.",
      "Anatomia clínica: posição anatômica, os três planos fundamentais e os eixos.",
    ],
    areaIds: ["anatomia"],
    // Microscopia e técnica histológica ainda não têm eixo no banco: quando
    // histologia entrar, elas se ligam aqui.
    axisIds: ["referenciais"],
    assessmentIds: ["mac-1-n1-teorica", "mac-1-n1-pratica"],
    pdfPath: "mac-1-aula-01.pdf",
    pages: 2,
    addedAt: "2026-10-14",
    source: "Resumo da turma, a partir da aula de 11/08/2026 (encontro 3).",
  },
];
