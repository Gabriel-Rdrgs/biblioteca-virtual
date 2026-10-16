import type { Metadata } from "next";
import { CalendarViews, type DisciplineChip } from "@/components/calendar/calendar-views";
import type { EventLinks } from "@/components/calendar/event-item";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { toKey } from "@/lib/domain/calendar-types";
import { isLesson, lessonLabel } from "@/lib/domain/summary-types";
import { getAxesByAssessment, getCalendarEvents } from "@/lib/repository/calendar";
import { getSummaries } from "@/lib/repository/summaries";
import { getDisciplines } from "@/lib/repository";
import { getExams } from "@/lib/repository/exams";

export const metadata: Metadata = {
  title: "Calendário",
  description: "As datas do semestre, o que cai em cada avaliação, as aulas e como treinar.",
};

export const dynamic = "force-dynamic";

/**
 * O calendário do semestre.
 *
 * O servidor monta os eventos e as ligações; as vistas, os filtros e o
 * cruzamento com o progresso são do cliente, porque trocar de mês não devia
 * custar uma ida ao servidor — e o progresso só existe neste aparelho.
 */
export default async function CalendarioPage() {
  const [eventos, disciplines, summaries, eixosPorAvaliacao] = await Promise.all([
    getCalendarEvents(),
    getDisciplines(),
    getSummaries(),
    getAxesByAssessment(),
  ]);
  const exams = getExams();

  const disciplinas: DisciplineChip[] = disciplines
    .filter((d) => eventos.some((evento) => evento.disciplineId === d.id))
    .map((d) => ({
      id: d.id,
      name: d.name,
      shortName: d.shortName,
      color: d.color,
      slug: d.slug,
    }));

  // Para cada evento, o que dá para fazer a partir dele.
  const links: Record<string, EventLinks> = {};
  for (const evento of eventos) {
    if (evento.kind === "avaliacao") {
      /*
        No cartão de uma prova, o resumo que importa é o que foi escrito
        para ela. Catorze aulas caem na N1 de MAC I, e listar as catorze
        aqui viraria uma parede de botões — elas já aparecem no calendário
        nas suas próprias datas e na página de resumos. Quando a matéria
        ainda não tem resumo de ciclo, as aulas valem como o que há.
      */
      const daProva = summaries.filter((summary) => summary.assessmentIds.includes(evento.id));
      const ciclos = daProva.filter((summary) => !isLesson(summary));

      links[evento.id] = {
        exams: exams
          .filter((exam) => evento.assessment.examIds.includes(exam.id))
          .map((exam) => ({ slug: exam.slug, title: exam.title })),
        summaries: (ciclos.length > 0 ? ciclos : daProva).map((summary) => ({
          slug: summary.slug,
          label: isLesson(summary)
            ? `Resumo da ${lessonLabel(summary).toLowerCase()}`
            : `Resumo para a ${summary.cycleLabel}`,
        })),
      };
    } else {
      links[evento.id] = {
        exams: [],
        summaries: [{ slug: evento.summary.slug, label: "Abrir o resumo" }],
      };
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Calendário" }]} />
      <SectionHeading
        as="h1"
        title="Calendário"
        description="As datas do semestre, transcritas dos cronogramas dos planos de ensino, com o que cai em cada avaliação, o simulado para treinar e o resumo da aula."
      />

      <CalendarViews
        eventos={eventos}
        disciplinas={disciplinas}
        links={links}
        eixosPorAvaliacao={eixosPorAvaliacao}
        hoje={toKey(new Date())}
      />

      <p className="text-ink-faint mt-12 text-xs leading-relaxed">
        Todos os planos avisam que o cronograma pode sofrer ajustes ao longo do semestre. Confirme
        com o docente antes de contar com uma data. E onde o plano não disser o contrário, conte com
        uma N2 que também cobre o conteúdo da N1. As aulas que aparecem aqui são as que já têm
        resumo publicado.
      </p>
    </div>
  );
}
