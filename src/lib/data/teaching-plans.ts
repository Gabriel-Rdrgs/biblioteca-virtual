import type { TeachingPlan } from "@/lib/domain/types";

/**
 * The seven official plans, served from public/planos. These are
 * institutional course documents, viewable and downloadable by the class.
 *
 * `pages` is the real page count reported by the extractor.
 */
export const teachingPlans: readonly TeachingPlan[] = [
  {
    id: "plano-mac-1",
    disciplineId: "mac-1",
    title: "Plano de Ensino — Morfofuncional Aplicado à Clínica I",
    fileUrl: "/planos/mac-1.pdf",
    semester: "2026.2",
    pages: 11,
    sourceFileName: "MAC I - plano de ensino.pdf",
    extractedTextStatus: "extraido",
  },
  {
    id: "plano-ha-1",
    disciplineId: "ha-1",
    title: "Plano de Ensino — Habilidades e Atitudes I",
    fileUrl: "/planos/ha-1.pdf",
    semester: "2026.2",
    pages: 6,
    sourceFileName: "Plano de Ensino HA I - 2026.2.pdf",
    extractedTextStatus: "extraido",
  },
  {
    id: "plano-iescg-1",
    disciplineId: "iescg-1",
    title: "Plano de Ensino — Interação Ensino-Serviço-Comunidade-Gestão I",
    fileUrl: "/planos/iescg-1.pdf",
    semester: "2026.2",
    pages: 9,
    sourceFileName: "PLANO_DE_ENSINO_IESCG_I_2026-2.pdf",
    extractedTextStatus: "extraido",
  },
  {
    id: "plano-hm-1",
    disciplineId: "hm-1",
    title: "Plano de Ensino — Humanidades Médicas I",
    fileUrl: "/planos/hm-1.pdf",
    semester: "2026.2",
    pages: 15,
    sourceFileName: "PLANO DE ENSINO HM1 - 2.2026 REVISADO (11.0) v2.pdf",
    extractedTextStatus: "extraido",
  },
  {
    id: "plano-ic-1",
    disciplineId: "ic-1",
    title: "Plano de Ensino — Iniciação Científica I",
    fileUrl: "/planos/ic-1.pdf",
    semester: "2026.2",
    pages: 5,
    sourceFileName: "PLANO_DE_ENSINO_IC1_02_2026_BRUNASOUSA.pdf",
    extractedTextStatus: "extraido",
  },
  {
    id: "plano-aes-1",
    disciplineId: "aes-1",
    title: "Plano de Ensino — AES 1: Introdução ao Estudo da Medicina",
    fileUrl: "/planos/aes-1.pdf",
    semester: "2026.2",
    pages: 12,
    sourceFileName: "Plano de ensino AES01 2 2026 publicar.pdf",
    extractedTextStatus: "extraido",
  },
  {
    id: "plano-aes-2",
    disciplineId: "aes-2",
    title: "Plano de Ensino — AES 2: Crescimento e Diferenciação Celular",
    fileUrl: "/planos/aes-2.pdf",
    semester: "2026.2",
    pages: 10,
    sourceFileName: "AES 02 - PLANO DE ENSINO_2º2026.pdf",
    extractedTextStatus: "extraido",
  },
];
