import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Layers, Sparkles } from "lucide-react";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { DrillBuilder } from "@/components/exam/drill-builder";
import { countAreaQuestions, getExams, getQuestionAreas, loadExam } from "@/lib/repository/exams";
import { getDisciplines } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Simulados",
  description: "Provas de treino no formato da avaliação, com correção e mapa de desempenho.",
};

export const dynamic = "force-dynamic";

export default async function SimuladosPage() {
  const disciplines = await getDisciplines();
  const exams = getExams();
  const areas = getQuestionAreas();

  const byDiscipline = disciplines
    .map((discipline) => ({
      discipline,
      exams: exams.filter((exam) => exam.disciplineId === discipline.id),
      areas: areas.filter((area) => area.disciplineId === discipline.id),
    }))
    .filter((group) => group.exams.length > 0 || group.areas.length > 0);

  const totalQuestions = areas.reduce((sum, area) => {
    const counts = countAreaQuestions(area.id);
    return sum + counts.discursivas + counts.objetivas;
  }, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Simulados" }]} />
      <SectionHeading
        as="h1"
        title="Simulados"
        description={`Prova de treino no formato da avaliação: você responde aqui, a correção é na hora e o resultado diz qual assunto revisar primeiro. ${totalQuestions} questões no banco da turma.`}
      />

      {byDiscipline.length === 0 ? (
        <p className="text-ink-muted glass rounded-2xl p-6 text-sm">
          Ainda não há simulados cadastrados.
        </p>
      ) : null}

      <div className="space-y-14">
        {byDiscipline.map(({ discipline, exams: list, areas: areasOf }) => (
          <section key={discipline.id} aria-labelledby={`sim-${discipline.id}`}>
            <div className="mb-5 flex flex-wrap items-baseline gap-3">
              <h2 id={`sim-${discipline.id}`} className="text-xl font-semibold">
                {discipline.name}
              </h2>
              <span className="text-ink-faint text-sm">{discipline.shortName}</span>
            </div>

            {areasOf.length > 0 ? (
              <ul className="mb-6 flex flex-wrap gap-2">
                {areasOf.map((area) => {
                  const counts = countAreaQuestions(area.id);
                  return (
                    <li
                      key={area.id}
                      className="glass text-ink-muted inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
                    >
                      <Layers className="size-3.5" aria-hidden="true" />
                      <span className="text-ink font-medium">{area.label}</span>
                      <span className="tabular-nums">
                        {counts.discursivas + counts.objetivas} questões
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <ul className="grid gap-4 sm:grid-cols-2">
              {list.map((exam) => {
                const loaded = loadExam(exam);
                return (
                  <li key={exam.id} className="glass flex flex-col rounded-3xl p-5">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary text-on-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
                        {exam.assessment}
                      </span>
                      <span className="text-ink-faint text-xs">{exam.semester}</span>
                    </div>
                    <h3 className="mt-3 text-lg leading-snug font-semibold">{exam.title}</h3>
                    <p className="text-ink-muted mt-2 flex-1 text-sm leading-relaxed text-pretty">
                      {exam.description}
                    </p>
                    <dl className="text-ink-faint mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <div>
                        <dt className="inline">Questões: </dt>
                        <dd className="text-ink-muted inline font-medium tabular-nums">
                          {loaded.questions.length}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline">Eixos: </dt>
                        <dd className="text-ink-muted inline font-medium tabular-nums">
                          {loaded.axes.length}
                        </dd>
                      </div>
                      {exam.suggestedMinutes ? (
                        <div>
                          <dt className="inline">Tempo: </dt>
                          <dd className="text-ink-muted inline font-medium">
                            {Math.round(exam.suggestedMinutes / 60)} h
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={`/simulados/${exam.slug}`}
                        className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                      >
                        Abrir
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                      {exam.pdfPath ? (
                        <a
                          href={`/api/simulados/${exam.pdfPath}?baixar=1`}
                          className="glass hover:glass-strong inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                        >
                          <FileText className="size-4" aria-hidden="true" />
                          Imprimir
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            {areasOf.length > 0 ? (
              <div className="glass mt-6 rounded-3xl p-5 sm:p-6">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="text-primary size-4" aria-hidden="true" />
                  Montar um treino
                </h3>
                <p className="text-ink-muted mt-1 mb-4 text-sm leading-relaxed text-pretty">
                  Escolha as áreas e quantas questões quer. A prova é sorteada do banco, espalhada
                  pelos eixos, e corrigida do mesmo jeito.
                </p>
                <DrillBuilder
                  disciplineId={discipline.id}
                  areas={areasOf.map((area) => ({
                    id: area.id,
                    label: area.label,
                    ...countAreaQuestions(area.id),
                  }))}
                />
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
