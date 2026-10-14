import type { Exam } from "@/lib/domain/exam-types";
import { aesDiscursivas } from "../questions/aes-2-discursivas";
import { aesObjetivas } from "../questions/aes-2-objetivas";
import { anatomiaDiscursivas } from "../questions/anatomia-discursivas";
import { anatomiaObjetivas } from "../questions/anatomia-objetivas";
import { icDiscursivas } from "../questions/ic-1-discursivas";
import { icObjetivas } from "../questions/ic-1-objetivas";
import { parasitologiaDiscursivas } from "../questions/parasitologia-discursivas";
import { parasitologiaObjetivas } from "../questions/parasitologia-objetivas";

/**
 * Os simulados montados sobre o banco.
 *
 * Um simulado é só uma lista ordenada de questões — discursivas primeiro,
 * depois objetivas, como no caderno impresso. Trocar a composição não mexe
 * em nenhuma questão, e a mesma questão pode servir a vários simulados: é
 * o que permite ter um caderno só de anatomia, outro só de parasitologia e
 * um terceiro combinando as duas, como a N1 real cobra.
 */

const ids = (questions: readonly { id: string }[]) => questions.map((q) => q.id);

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
  questionIds: [...ids(parasitologiaDiscursivas), ...ids(parasitologiaObjetivas)],
  pdfPath: "mac-1-n1-parasitologia.pdf",
  note: "A N1 real de MAC I também cobra Anatomia; para treinar as duas juntas, use o simulado completo.",
  visibility: "visivel",
  origin: "seed",
  addedAt: "2026-10-13",
};

export const macAnatomiaN1: Exam = {
  id: "mac-1-n1-anatomia",
  slug: "mac-1-n1-anatomia",
  disciplineId: "mac-1",
  title: "Simulado N1 — Anatomia clínica",
  subtitle: "Sessenta questões no formato da avaliação",
  assessment: "N1",
  semester: "2026.2",
  description:
    "Casos clínicos, figuras numeradas do Netter, análise de afirmações e discursivas divididas em itens, no mesmo formato da N1 de MAC I.",
  instructions: [
    "Faça sem consulta. Tempo sugerido: 4 horas (cerca de 1h45 para as discursivas e 2h15 para as objetivas).",
    "Nas objetivas há apenas uma alternativa correta.",
    "Nas discursivas, responda com estrutura anatômica, mecanismo e relação com o caso.",
    "Nas figuras numeradas, identifique a estrutura pelo número antes de ler as alternativas.",
  ],
  suggestedMinutes: 240,
  scaleMax: 6,
  scaleDivisor: 10,
  questionIds: [...ids(anatomiaDiscursivas), ...ids(anatomiaObjetivas)],
  pdfPath: "mac-1-n1-anatomia.pdf",
  note: "A N1 real de MAC I também cobra Parasitologia; para treinar as duas juntas, use o simulado completo.",
  visibility: "visivel",
  origin: "seed",
  addedAt: "2026-10-13",
};

/**
 * A combinação que a prova real cobra. Metade de cada área, mantendo a
 * proporção entre discursivas e objetivas do caderno impresso; a divisão
 * exata de pontos entre as áreas varia de semestre para semestre, então
 * aqui ela é igual para as duas.
 */
export const macCompletoN1: Exam = {
  id: "mac-1-n1-completo",
  slug: "mac-1-n1-completo",
  disciplineId: "mac-1",
  title: "Simulado N1 — MAC I completo",
  subtitle: "Anatomia e Parasitologia na mesma prova",
  assessment: "N1",
  semester: "2026.2",
  description:
    "As duas áreas que a N1 cobra, em uma prova só: 8 discursivas e 22 objetivas, metade de cada área, com o resultado separado por área e por eixo.",
  instructions: [
    "Faça sem consulta. Tempo sugerido: 2 horas.",
    "Nas objetivas há apenas uma alternativa correta.",
    "Nas discursivas, responda com a estrutura ou o agente, o mecanismo e a relação com o caso.",
    "O resultado mostra como você foi em cada área separadamente.",
  ],
  suggestedMinutes: 120,
  scaleMax: 6,
  scaleDivisor: 5,
  questionIds: [
    ...ids(anatomiaDiscursivas.slice(0, 4)),
    ...ids(parasitologiaDiscursivas.slice(0, 4)),
    ...ids(anatomiaObjetivas.slice(0, 11)),
    ...ids(parasitologiaObjetivas.slice(0, 11)),
  ],
  note: "Montado a partir do banco das duas áreas. Para sortear outra combinação, use “Montar um treino”.",
  visibility: "visivel",
  origin: "seed",
  addedAt: "2026-10-13",
};

/**
 * Iniciação Científica I. A nota da N1 soma a avaliação formativa (peso 1)
 * e a prova escrita (peso 2); o simulado cobre a prova escrita, e a escala
 * vai a 10 — por isso os 60 pontos são divididos por 6.
 */
export const icN1: Exam = {
  id: "ic-1-n1",
  slug: "ic-1-n1",
  disciplineId: "ic-1",
  title: "Simulado N1 — Iniciação Científica",
  subtitle: "Sessenta questões no formato da avaliação",
  assessment: "N1",
  semester: "2026.2",
  description:
    "Casos, figuras numeradas, análise de afirmações e discursivas divididas em itens, no formato da N1. Conteúdo das semanas 1 a 9 do cronograma.",
  instructions: [
    "Faça sem consulta. Tempo sugerido: 4 horas (cerca de 1h45 para as discursivas e 2h15 para as objetivas).",
    "Nas objetivas há apenas uma alternativa correta.",
    "Nas discursivas, responda com conceito, exemplo do caso e justificativa, no vocabulário técnico da disciplina.",
    "Nas figuras numeradas, identifique cada elemento pelo número antes de responder.",
  ],
  suggestedMinutes: 240,
  scaleMax: 10,
  scaleDivisor: 6,
  questionIds: [...ids(icDiscursivas), ...ids(icObjetivas)],
  pdfPath: "ic-1-n1.pdf",
  note: "Humanidades Médicas tem prova própria e não entra neste simulado.",
  visibility: "visivel",
  origin: "seed",
  addedAt: "2026-10-13",
};

/**
 * AES 2 — Crescimento e Diferenciação Celular. A prova vale 8,0 na nota da
 * unidade, então os 60 pontos são divididos por 7,5.
 */
export const aesN1: Exam = {
  id: "aes-2-n1",
  slug: "aes-2-n1",
  disciplineId: "aes-2",
  title: "Simulado N1 — Crescimento e diferenciação celular",
  subtitle: "Sessenta questões no formato da avaliação",
  assessment: "N1",
  semester: "2026.2",
  description:
    "Casos clínicos, análise de afirmações e discursivas divididas em itens, do genoma à morte celular, no formato da avaliação somativa tutorial.",
  instructions: [
    "Faça sem consulta. Tempo sugerido: 4 horas (cerca de 1h30 para as discursivas e 2h30 para as objetivas).",
    "Nas objetivas há apenas uma alternativa correta.",
    "Nas discursivas, responda com mecanismo, vocabulário técnico e relação com o caso. Na prova o limite é de 5 linhas: treine dizer o essencial primeiro.",
    "A interpretação do enunciado faz parte da avaliação: leia o caso, identifique o comando e só então vá às alternativas.",
  ],
  suggestedMinutes: 240,
  scaleMax: 8,
  scaleDivisor: 7.5,
  questionIds: [...ids(aesDiscursivas), ...ids(aesObjetivas)],
  pdfPath: "aes-2-n1.pdf",
  note: "O código genético, anexo no caderno impresso, aparece aqui junto da questão que manda consultá-lo.",
  visibility: "visivel",
  origin: "seed",
  addedAt: "2026-10-13",
};

export const seedExams: readonly Exam[] = [
  macCompletoN1,
  macAnatomiaN1,
  macParasitologiaN1,
  icN1,
  aesN1,
];
