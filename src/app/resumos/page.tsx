import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { SummaryTimeline } from "@/components/summaries/summary-timeline";
import { Breadcrumbs, ButtonLink, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { assessmentLabel, isExam } from "@/lib/domain/assessment-types";
import { getAssessments, getUpcomingAssessments } from "@/lib/repository/assessments";
import { getSummaries } from "@/lib/repository/summaries";
import { getDisciplines } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Resumos",
  description: "Os resumos da turma, por matéria e por prova, na ordem das aulas.",
};

export const dynamic = "force-dynamic";

/**
 * Os resumos como um índice: matéria → prova em que cai → aula, em ordem.
 * O grupo da próxima prova de cada matéria abre sozinho.
 */
export default async function ResumosPage() {
  const [summaries, disciplines, assessments, upcoming] = await Promise.all([
    getSummaries(),
    getDisciplines(),
    getAssessments(),
    getUpcomingAssessments(),
  ]);

  const porDisciplina = disciplines
    .map((discipline) => {
      const next = upcoming.find(
        (u) => u.assessment.disciplineId === discipline.id && isExam(u.assessment),
      );
      return {
        discipline,
        list: summaries.filter((summary) => summary.disciplineId === discipline.id),
        cycles: assessments
          .filter((a) => a.disciplineId === discipline.id)
          .map((a) => ({ id: a.id, label: assessmentLabel(a), date: a.date })),
        next,
      };
    })
    .filter((grupo) => grupo.list.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Biblioteca", href: "/livros" },
          { label: "Resumos" },
        ]}
      />
      <SectionHeading
        as="h1"
        title="Resumos"
        description="Feitos pela turma, a partir das aulas: por matéria, agrupados pela prova em que o conteúdo cai, e na ordem em que as aulas aconteceram. O grupo da próxima prova já vem aberto."
      />

      {porDisciplina.length === 0 ? (
        <EmptyState
          title="Ainda não há resumos publicados"
          description="Assim que o primeiro for publicado, ele aparece aqui, ligado à aula e à prova em que o conteúdo cai."
          action={
            <ButtonLink href="/calendario" variant="secundario">
              <CalendarDays className="size-4" aria-hidden="true" />
              Ver a agenda
            </ButtonLink>
          }
        />
      ) : null}

      {porDisciplina.length > 1 ? (
        <nav aria-label="Matérias com resumos" className="mb-8 flex flex-wrap gap-2">
          {porDisciplina.map(({ discipline, list }) => (
            <a
              key={discipline.id}
              href={`#resumos-${discipline.id}`}
              className="glass hover:glass-strong inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm"
            >
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ background: discipline.color }}
              />
              {discipline.shortName}
              <span className="text-ink-faint tabular-nums">{list.length}</span>
            </a>
          ))}
        </nav>
      ) : null}

      <div className="space-y-14">
        {porDisciplina.map(({ discipline, list, cycles, next }) => (
          <section
            key={discipline.id}
            id={`resumos-${discipline.id}`}
            aria-labelledby={`titulo-resumos-${discipline.id}`}
            className="scroll-mt-24"
          >
            <header className="border-line mb-4 flex flex-wrap items-end justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-10 w-1.5 rounded-full"
                  style={{ background: discipline.color }}
                />
                <div>
                  <h2 id={`titulo-resumos-${discipline.id}`} className="text-2xl font-semibold">
                    {discipline.shortName}
                  </h2>
                  <p className="text-ink-muted text-sm">
                    {discipline.name} · {list.length} {list.length === 1 ? "resumo" : "resumos"}
                  </p>
                </div>
              </div>
              {next ? (
                <Link
                  href={`/provas/${next.assessment.id}`}
                  className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  Estudar para a {assessmentLabel(next.assessment).split(" — ")[0]}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </header>
            <SummaryTimeline
              summaries={list}
              cycles={cycles}
              {...(next ? { openKey: assessmentLabel(next.assessment).split(" — ")[0] } : {})}
              color={discipline.color}
            />
          </section>
        ))}
      </div>

      <p className="text-ink-faint mt-12 text-xs leading-relaxed">
        Material de estudo da turma, escrito a partir das aulas. Não substitui o plano de ensino nem
        a bibliografia — serve para revisar depressa e para saber o que procurar no livro.
      </p>
    </div>
  );
}
