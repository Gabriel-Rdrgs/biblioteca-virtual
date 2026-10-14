import type { Metadata } from "next";
import { BookOpen, CalendarDays, Download } from "lucide-react";
import {
  Badge,
  Breadcrumbs,
  ButtonAnchor,
  ButtonLink,
  Card,
  EmptyState,
  SectionHeading,
} from "@/components/ui/primitives";
import { isLesson, lessonDayLabel, lessonLabel, type Summary } from "@/lib/domain/summary-types";
import { getAssessments } from "@/lib/repository/assessments";
import { getSummaries } from "@/lib/repository/summaries";
import { getDisciplines } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Resumos",
  description: "Um resumo por aula, e o apanhado de cada ciclo antes da prova.",
};

export const dynamic = "force-dynamic";

function SummaryCard({
  summary,
  assessmentLabels,
}: {
  summary: Summary;
  assessmentLabels: readonly string[];
}) {
  return (
    <Card as="li" raio="hero" respiro="md" className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        {isLesson(summary) ? (
          <>
            <Badge tom="primario">{lessonLabel(summary)}</Badge>
            <span className="text-ink-muted text-sm">{lessonDayLabel(summary.date)}</span>
            {summary.meeting ? (
              <span className="text-ink-faint text-xs">· encontro {summary.meeting}</span>
            ) : null}
          </>
        ) : (
          <Badge tom="acento">{summary.cycleLabel}</Badge>
        )}
        {assessmentLabels.map((label) => (
          <Badge key={label} tom="contorno">
            cai na {label}
          </Badge>
        ))}
      </div>

      <h3 className="mt-3 text-lg leading-snug font-semibold">{summary.title}</h3>

      {summary.topics.length > 0 ? (
        <ul className="text-ink-muted mt-3 flex-1 space-y-1.5 text-sm leading-relaxed">
          {summary.topics.map((topic) => (
            <li key={topic} className="flex gap-2">
              <span className="text-ink-faint mt-2 size-1 shrink-0 rounded-full bg-current" />
              <span className="text-pretty">{topic}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <ButtonLink href={`/resumos/${summary.slug}`} size="sm">
          <BookOpen className="size-4" aria-hidden="true" />
          Ler
        </ButtonLink>
        <ButtonAnchor
          href={`/api/resumos/${summary.pdfPath}?baixar=1`}
          variant="secundario"
          size="sm"
        >
          <Download className="size-4" aria-hidden="true" />
          Baixar
        </ButtonAnchor>
        <span className="text-ink-faint ml-auto text-xs tabular-nums">
          {summary.pages} {summary.pages === 1 ? "página" : "páginas"}
        </span>
      </div>
    </Card>
  );
}

export default async function ResumosPage() {
  const [summaries, disciplines, assessments] = await Promise.all([
    getSummaries(),
    getDisciplines(),
    getAssessments(),
  ]);

  const rotuloDaAvaliacao = new Map(assessments.map((a) => [a.id, a.title ?? a.kind] as const));

  const porDisciplina = disciplines
    .map((discipline) => ({
      discipline,
      list: summaries.filter((summary) => summary.disciplineId === discipline.id),
    }))
    .filter((grupo) => grupo.list.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Resumos" }]} />
      <SectionHeading
        as="h1"
        title="Resumos"
        description="Um por aula, com o que foi dado naquele encontro, e o apanhado de cada ciclo para a véspera da prova. Feitos pela turma, a partir das aulas."
      />

      {porDisciplina.length === 0 ? (
        <EmptyState
          title="Ainda não há resumos publicados"
          description="Assim que o primeiro for publicado, ele aparece aqui, ligado à aula e à prova em que o conteúdo cai."
          action={
            <ButtonLink href="/calendario" variant="secundario">
              <CalendarDays className="size-4" aria-hidden="true" />
              Ver o calendário
            </ButtonLink>
          }
        />
      ) : null}

      <div className="space-y-12">
        {porDisciplina.map(({ discipline, list }) => (
          <section key={discipline.id} aria-labelledby={`resumos-${discipline.id}`}>
            <div className="mb-5 flex flex-wrap items-baseline gap-3">
              <h2 id={`resumos-${discipline.id}`} className="text-xl font-semibold">
                {discipline.name}
              </h2>
              <span className="text-ink-faint text-sm">
                {list.length} {list.length === 1 ? "resumo" : "resumos"}
              </span>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {list.map((summary) => (
                <SummaryCard
                  key={summary.id}
                  summary={summary}
                  assessmentLabels={summary.assessmentIds
                    .map((id) => rotuloDaAvaliacao.get(id))
                    .filter((label): label is string => Boolean(label))
                    // "N1 — prova teórica" e "N1 — prova prática" viram só "N1".
                    .map((label) => label.split(" — ")[0] ?? label)
                    .filter((label, i, todos) => todos.indexOf(label) === i)}
                />
              ))}
            </ul>
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
