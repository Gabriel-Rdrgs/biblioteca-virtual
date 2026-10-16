import { daysUntil, assessmentLabel, isExam } from "@/lib/domain/assessment-types";
import { isLesson, lessonLabel } from "@/lib/domain/summary-types";
import type { CalendarEvent } from "@/lib/domain/calendar-types";
import { getAssessments } from "./assessments";
import { getSummaries } from "./summaries";
import { getExams, loadExam } from "./exams";

/**
 * O calendário inteiro: avaliações e aulas na mesma linha do tempo.
 *
 * As aulas vêm dos resumos, porque é o resumo que sabe a data do encontro.
 * Isso significa que o calendário mostra as aulas que a turma registrou, e
 * não um cronograma inventado — ele se enche conforme os resumos saem.
 */
export async function getCalendarEvents(today = new Date()): Promise<CalendarEvent[]> {
  const [assessments, summaries] = await Promise.all([getAssessments(), getSummaries()]);

  const avaliacoes: CalendarEvent[] = assessments.map((assessment) => {
    const left = daysUntil(assessment.date, today);
    return {
      kind: "avaliacao",
      id: assessment.id,
      date: assessment.date,
      disciplineId: assessment.disciplineId,
      title: assessmentLabel(assessment),
      daysLeft: left,
      past: left < 0,
      assessment,
    };
  });

  const aulas: CalendarEvent[] = summaries.filter(isLesson).map((summary) => {
    const left = daysUntil(summary.date, today);
    return {
      kind: "aula",
      id: summary.id,
      date: summary.date,
      disciplineId: summary.disciplineId,
      title: `${lessonLabel(summary)} · ${summary.title}`,
      daysLeft: left,
      past: left < 0,
      summary,
    };
  });

  /**
   * No mesmo dia, o que exige estudo vem primeiro: a prova antes da sua
   * devolutiva, e a avaliação antes da aula. Ordenar por título punia a
   * prova por "Devolutiva" começar com D.
   */
  const peso = (evento: CalendarEvent) => {
    if (evento.kind === "aula") return 2;
    return isExam(evento.assessment) ? 0 : 1;
  };

  return [...avaliacoes, ...aulas].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || peso(a) - peso(b) || a.title.localeCompare(b.title, "pt-BR"),
  );
}

/**
 * Que eixos do banco de questões cada avaliação cobra.
 *
 * Sai dos simulados ligados a ela: se a prova aponta para um simulado, os
 * eixos daquele simulado são o que ela cobra. É o que deixa o calendário
 * cruzar com o progresso de quem já treinou.
 */
export async function getAxesByAssessment(): Promise<Record<string, string[]>> {
  const assessments = await getAssessments();
  const exams = getExams();
  const mapa: Record<string, string[]> = {};

  for (const assessment of assessments) {
    const eixos = new Set<string>();
    for (const examId of assessment.examIds) {
      const exam = exams.find((e) => e.id === examId);
      if (!exam) continue;
      for (const axis of loadExam(exam).axes) eixos.add(axis.id);
    }
    if (eixos.size > 0) mapa[assessment.id] = [...eixos];
  }
  return mapa;
}
