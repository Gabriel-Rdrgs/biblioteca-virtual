import type { Exam } from "@/lib/domain/exam-types";
import { parasitologiaObjetivas } from "../questions/parasitologia-objetivas";
import { parasitologiaDiscursivas } from "../questions/parasitologia-discursivas";

/**
 * Os simulados montados sobre o banco.
 *
 * Um simulado é só uma lista ordenada de questões — discursivas primeiro,
 * depois objetivas, como no caderno impresso. Trocar a composição não mexe
 * em nenhuma questão, e a mesma questão pode servir a vários simulados.
 */

const emOrdem = (questions: readonly { id: string }[]) => questions.map((q) => q.id);

export const macParasitologiaN1: Exam = {
  id: "mac-1-n1-parasitologia",
  slug: "mac-1-n1-parasitologia",
  disciplineId: "mac-1",
  title: "Simulado N1 — Parasitologia",
  subtitle: "Sessenta questões no formato da avaliação",
  assessment: "N1",
  semester: "2026.2",
  description:
    "Casos clínicos, figuras do livro-texto, análise de afirmações e discursivas divididas em itens, no mesmo formato da N1 de MAC I.",
  instructions: [
    "Faça sem consulta. Tempo sugerido: 4 horas (cerca de 1h45 para as discursivas e 2h15 para as objetivas).",
    "Nas objetivas há apenas uma alternativa correta.",
    "Nas discursivas, responda com agente, estágio do ciclo, mecanismo e relação com o caso.",
    "Nas figuras numeradas, identifique o estágio pelo número antes de responder.",
  ],
  suggestedMinutes: 240,
  scaleMax: 6,
  scaleDivisor: 10,
  questionIds: [...emOrdem(parasitologiaDiscursivas), ...emOrdem(parasitologiaObjetivas)],
  pdfPath: "mac-1-n1-parasitologia.pdf",
  note: "A N1 real de MAC I também cobra Anatomia, que não entra neste simulado.",
  visibility: "visivel",
  origin: "seed",
  addedAt: "2026-10-13",
};

export const seedExams: readonly Exam[] = [macParasitologiaN1];
