import type { GradeScheme } from "@/lib/domain/grading";

/**
 * Como cada unidade curricular compõe as suas notas.
 *
 * Tudo transcrito dos planos de ensino, com a página registrada em `source`
 * — do mesmo jeito que as datas e a bibliografia. O que o plano não disser,
 * não está aqui.
 *
 * As regras de aprovação são iguais nas sete: Média Parcial igual ou
 * superior a 6,0, sem arredondamento; abaixo disso, ARA, com a Média Final
 * arredondada a partir de 5,75. O que muda é só a composição das
 * bimestrais, abaixo.
 *
 * `assessmentId` liga a parte à data do calendário, quando ela tem data. A
 * avaliação formativa normalmente não tem: ela acontece ao longo do
 * bimestre, e por isso só aparece na página de notas.
 */

const plano = (sigla: string, pagina: number) => `Plano de ensino de ${sigla}, p. ${pagina}`;

const comum = { passMark: 6, roundFrom: 5.75 } as const;

export const gradeSchemes: readonly GradeScheme[] = [
  {
    ...comum,
    disciplineId: "mac-1",
    source: plano("MAC I", 5),
    terms: [
      {
        id: "N1",
        kind: "pontos",
        parts: [
          { id: "mac-1-n1-formativa", label: "Avaliação diagnóstica–formativa", value: 1 },
          {
            id: "mac-1-n1-teorica",
            label: "Prova teórica",
            assessmentId: "mac-1-n1-teorica",
            value: 6,
          },
          {
            id: "mac-1-n1-pratica",
            label: "Prova teórico-prática",
            assessmentId: "mac-1-n1-pratica",
            value: 3,
          },
        ],
      },
      {
        id: "N2",
        kind: "pontos",
        parts: [
          { id: "mac-1-n2-formativa", label: "Avaliação diagnóstica–formativa", value: 1 },
          {
            id: "mac-1-n2-teorica",
            label: "Prova teórica",
            assessmentId: "mac-1-n2-teorica",
            value: 6,
          },
          {
            id: "mac-1-n2-pratica",
            label: "Prova teórico-prática",
            assessmentId: "mac-1-n2-pratica",
            value: 3,
          },
        ],
      },
    ],
  },

  {
    ...comum,
    disciplineId: "aes-1",
    source: plano("AES 1", 7),
    terms: [
      {
        id: "N1",
        kind: "pontos",
        parts: [
          { id: "aes-1-n1-formativa", label: "Avaliação formativa", value: 2 },
          {
            id: "aes-1-n1-somativa",
            label: "Avaliação somativa",
            assessmentId: "aes-1-n1",
            value: 8,
          },
        ],
      },
      {
        id: "N2",
        kind: "pontos",
        parts: [
          { id: "aes-1-n2-formativa", label: "Avaliação formativa", value: 2 },
          {
            id: "aes-1-n2-somativa",
            label: "Avaliação somativa",
            assessmentId: "aes-1-n2",
            value: 8,
          },
        ],
      },
    ],
  },

  {
    ...comum,
    disciplineId: "aes-2",
    source: plano("AES 2", 7),
    terms: [
      {
        id: "N1",
        kind: "pontos",
        parts: [
          { id: "aes-2-n1-formativa", label: "Avaliação formativa", value: 2 },
          {
            id: "aes-2-n1-somativa",
            label: "Avaliação somativa tutorial",
            assessmentId: "aes-2-n1",
            value: 8,
          },
        ],
      },
      {
        id: "N2",
        kind: "pontos",
        parts: [
          { id: "aes-2-n2-formativa", label: "Avaliação formativa", value: 2 },
          {
            id: "aes-2-n2-somativa",
            label: "Avaliação somativa tutorial",
            assessmentId: "aes-2-n2",
            value: 8,
          },
        ],
      },
    ],
  },

  {
    ...comum,
    disciplineId: "hm-1",
    source: `${plano("HM I", 14)} e 15`,
    terms: [
      {
        id: "N1",
        kind: "pontos",
        parts: [
          {
            id: "hm-1-aa1",
            label: "Atividade 1 — Ser Médico",
            assessmentId: "hm-1-aa1",
            value: 0.75,
          },
          {
            id: "hm-1-aa2",
            label: "Atividade 2 — Segurança do Paciente",
            assessmentId: "hm-1-aa2",
            value: 0.75,
          },
          {
            id: "hm-1-aa3",
            label: "Atividade 3 — Resumo do World Café",
            assessmentId: "hm-1-aa3",
            value: 0.75,
          },
          {
            id: "hm-1-aa4",
            label: "Atividade 4 — Resumo do Pecha Kucha",
            assessmentId: "hm-1-aa4",
            value: 0.75,
          },
          { id: "hm-1-n1-prova", label: "Prova", assessmentId: "hm-1-n1", value: 5 },
          { id: "hm-1-n1-formativa", label: "Formativa", value: 2 },
        ],
      },
      {
        id: "N2",
        kind: "pontos",
        parts: [
          {
            id: "hm-1-aa6",
            label: "Atividade 6 — Cartilha de ética",
            assessmentId: "hm-1-aa6",
            value: 1.5,
          },
          {
            id: "hm-1-aa7",
            label: "Atividade 7 — Comunicação em mídia",
            assessmentId: "hm-1-aa7",
            value: 1.5,
          },
          { id: "hm-1-n2-prova", label: "Prova escrita", assessmentId: "hm-1-n2", value: 5 },
          { id: "hm-1-n2-formativa", label: "Formativa — autoavaliação e conduta", value: 2 },
        ],
      },
    ],
  },

  {
    ...comum,
    disciplineId: "ha-1",
    source: plano("HA I", 4),
    terms: [
      {
        id: "N1",
        kind: "pontos",
        parts: [
          { id: "ha-1-n1-osce", label: "OSCE", assessmentId: "ha-1-n1", value: 8 },
          { id: "ha-1-n1-atitudinal", label: "Avaliação atitudinal", value: 2 },
        ],
      },
      {
        id: "N2",
        kind: "pontos",
        parts: [
          { id: "ha-1-n2-osce", label: "OSCE", assessmentId: "ha-1-n2-a", value: 8 },
          { id: "ha-1-n2-atitudinal", label: "Avaliação atitudinal", value: 2 },
        ],
      },
    ],
  },

  {
    ...comum,
    disciplineId: "iescg-1",
    source: plano("IESCG I", 5),
    terms: [
      {
        id: "N1",
        kind: "pontos",
        parts: [
          {
            id: "iescg-1-n1-as",
            label: "Avaliação somativa 1",
            assessmentId: "iescg-1-n1",
            value: 6,
          },
          { id: "iescg-1-n1-af", label: "Avaliação formativa 1", value: 4 },
        ],
      },
      {
        id: "N2",
        kind: "pontos",
        parts: [
          { id: "iescg-1-n2-pic", label: "PIC", assessmentId: "iescg-1-n2", value: 5 },
          {
            id: "iescg-1-n2-portfolio",
            label: "Portfólio reflexivo e descritivo",
            value: 4,
          },
          { id: "iescg-1-n2-af", label: "Avaliação formativa 2", value: 1 },
        ],
      },
    ],
  },

  {
    // A única que usa pesos em vez de pontos: cada parte vale de 0 a 10.
    ...comum,
    disciplineId: "ic-1",
    source: plano("IC I", 3),
    terms: [
      {
        id: "N1",
        kind: "pesos",
        parts: [
          { id: "ic-1-n1-formativa", label: "Avaliação formativa", value: 1 },
          { id: "ic-1-n1-prova", label: "Prova escrita", assessmentId: "ic-1-n1", value: 2 },
        ],
      },
      {
        id: "N2",
        kind: "pesos",
        parts: [
          { id: "ic-1-n2-congresso", label: "Organização do congresso", value: 1 },
          {
            id: "ic-1-n2-projeto",
            label: "Projeto de revisão e defesa pública",
            assessmentId: "ic-1-projeto",
            value: 2,
          },
        ],
      },
    ],
  },
];

export const schemeFor = (disciplineId: string): GradeScheme | undefined =>
  gradeSchemes.find((scheme) => scheme.disciplineId === disciplineId);

/** A parte de nota que corresponde a uma data do calendário, se houver. */
export function partForAssessment(
  assessmentId: string,
): { scheme: GradeScheme; termId: "N1" | "N2"; partId: string; label: string; max: number } | null {
  for (const scheme of gradeSchemes) {
    for (const term of scheme.terms) {
      for (const part of term.parts) {
        if (part.assessmentId === assessmentId) {
          return {
            scheme,
            termId: term.id,
            partId: part.id,
            label: part.label,
            max: term.kind === "pontos" ? part.value : 10,
          };
        }
      }
    }
  }
  return null;
}
