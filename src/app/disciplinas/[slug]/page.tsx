import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Download, FileText, Users } from "lucide-react";
import { BookGrid } from "@/components/book/book-grid";
import { DisciplineGrades } from "@/components/grades/discipline-grades";
import { bibliographyLabels } from "@/components/book/book-badge";
import { Breadcrumbs } from "@/components/ui/primitives";
import { MotifArtwork, motifPalettes, seedOf } from "@/components/book/cover-motifs";
import { periodLabel, type BibliographyType } from "@/lib/domain/types";
import {
  assessmentLabel,
  countdownLabel,
  formatAssessmentDate,
  isExam,
} from "@/lib/domain/assessment-types";
import { getAssessmentsForDiscipline } from "@/lib/repository/assessments";
import {
  getBooksForDiscipline,
  getDisciplineBySlug,
  getDisciplines,
  getTeachingPlanForDiscipline,
  toCatalogEntries,
} from "@/lib/repository";
import { getSummaries } from "@/lib/repository/summaries";
import { isLesson, lessonDayLabel, summaryLabel } from "@/lib/domain/summary-types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const discipline = await getDisciplineBySlug(slug);
  if (!discipline) notFound();

  return {
    title: discipline.name,
    description: discipline.description.slice(0, 180),
  };
}

/** Quantos dias separam uma data de hoje, para qualquer um dos dois lados. */
const distanciaDeHoje = (date: string) => Math.abs(Date.parse(`${date}T12:00:00`) - Date.now());

const order: BibliographyType[] = [
  "basica",
  "basica_virtual",
  "complementar",
  "outras_referencias",
  "acervo_da_turma",
];

// The catalogue is edited at runtime by the admin area; render per request.
export const dynamic = "force-dynamic";

export default async function DisciplinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const discipline = await getDisciplineBySlug(slug);
  if (!discipline) notFound();

  const all = await getDisciplines();
  const index = all.findIndex((d) => d.id === discipline.id);
  const previous = index > 0 ? all[index - 1] : all[all.length - 1];
  const next = index < all.length - 1 ? all[index + 1] : all[0];

  const books = await getBooksForDiscipline(discipline.id);
  const plan = await getTeachingPlanForDiscipline(discipline.id);
  const summaries = await getSummaries(discipline.id);
  /*
    A matéria mostra os resumos de ciclo — os da véspera da prova — e as
    aulas mais perto de hoje. Com 26 encontros, a lista inteira empurrava a
    ementa e a bibliografia para fora da tela; o resto fica a um toque, em
    /resumos.
  */
  const emDestaque = [
    ...summaries.filter((summary) => !isLesson(summary)),
    ...summaries
      .filter(isLesson)
      .sort((a, b) => distanciaDeHoje(a.date) - distanciaDeHoje(b.date))
      .slice(0, 6)
      .sort((a, b) => a.lesson - b.lesson),
  ];
  // The next three dates that are ahead; a whole term of them would
  // bury the ementa under a wall of chips.
  const assessments = (await getAssessmentsForDiscipline(discipline.id))
    .filter((a) => !a.past)
    .slice(0, 3);
  const palette = motifPalettes[discipline.motif];

  const grouped = order
    .map((type) => ({
      type,
      entries: toCatalogEntries(
        books.filter((entry) =>
          entry.links.some(
            (link) => link.disciplineId === discipline.id && link.bibliographyType === type,
          ),
        ),
      ),
    }))
    .filter((group) => group.entries.length > 0);

  return (
    <div>
      {/* Themed header, coloured by the discipline itself. */}
      <header
        className="border-line relative overflow-hidden border-b"
        style={{ backgroundColor: discipline.color }}
      >
        <svg
          viewBox="0 0 300 450"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <g style={{ color: palette.art }}>
            <MotifArtwork motif={discipline.motif} seed={seedOf(discipline.id)} />
          </g>
        </svg>

        <div className="relative mx-auto max-w-6xl px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium tracking-[0.14em] text-white/75 uppercase">
            <span>{discipline.shortName}</span>
            {discipline.code ? <span>· {discipline.code}</span> : null}
            <span>· {periodLabel(discipline.period)}</span>
            <span>· {discipline.semester}</span>
            {discipline.workload ? <span>· {discipline.workload}</span> : null}
          </div>

          <h1 className="mt-3 max-w-3xl text-3xl font-semibold text-white sm:text-[2.6rem]">
            {discipline.name}
          </h1>

          {discipline.teachers.length > 0 ? (
            <p className="mt-4 flex items-start gap-2 text-sm text-white/85">
              <Users className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {discipline.teachers.join(" · ")}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            {plan ? (
              <>
                <a
                  href={plan.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink rounded-control inline-flex items-center gap-2 bg-white px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ color: discipline.color }}
                >
                  <FileText className="size-4" aria-hidden="true" />
                  Ver plano de ensino
                </a>
                <a
                  href={plan.fileUrl}
                  download
                  className="rounded-control inline-flex items-center gap-2 border border-white/40 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Baixar PDF
                </a>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs
          trail={[
            { label: "Início", href: "/" },
            { label: "Matérias", href: "/disciplinas" },
            { label: discipline.shortName },
          ]}
        />

        {assessments.length > 0 ? (
          <ul className="mb-10 flex flex-wrap gap-3">
            {assessments.map(({ assessment, daysLeft }) => (
              <li key={assessment.id}>
                <Link
                  href="/calendario"
                  className="glass hover:glass-strong inline-flex items-center gap-2.5 rounded-full py-2 pr-3 pl-4 text-sm transition-colors"
                >
                  <span className="font-semibold">{assessmentLabel(assessment)}</span>
                  <span className="text-ink-muted">{formatAssessmentDate(assessment.date)}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      daysLeft <= 7 && isExam(assessment)
                        ? "bg-danger-soft text-danger"
                        : "glass-strong text-ink-muted",
                    )}
                  >
                    {countdownLabel(daysLeft)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {/*
          As notas desta matéria, antes da ementa: quem abre a página da
          matéria depois de uma prova vem por causa disto.
        */}
        <DisciplineGrades
          disciplineId={discipline.id}
          disciplineName={discipline.name}
          color={discipline.color}
        />

        {summaries.length > 0 ? (
          <section className="mb-10" aria-labelledby="resumos-da-materia">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="resumos-da-materia" className="text-lg font-semibold">
                Resumos das aulas
              </h2>
              <Link href="/resumos" className="text-primary text-sm font-medium hover:underline">
                {summaries.length > emDestaque.length
                  ? `Ver todos os ${summaries.length}`
                  : "Ver todos"}
              </Link>
            </div>
            <ul className="flex flex-wrap gap-2">
              {emDestaque.map((summary) => (
                <li key={summary.id}>
                  <Link
                    href={`/resumos/${summary.slug}`}
                    className="glass hover:glass-strong inline-flex items-center gap-2.5 rounded-full py-2 pr-4 pl-3 text-sm transition-colors"
                  >
                    <span className="bg-primary text-on-primary text-micro rounded-full px-2 py-0.5 font-semibold whitespace-nowrap">
                      {summaryLabel(summary)}
                    </span>
                    <span className="font-medium">{summary.title}</span>
                    {summary.kind === "aula" ? (
                      <span className="text-ink-faint text-xs">{lessonDayLabel(summary.date)}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[1fr_18rem] lg:gap-14">
          <div className="min-w-0">
            <section>
              <h2 className="text-xl font-semibold">Ementa</h2>
              <p className="text-ink-muted mt-3 leading-relaxed text-pretty">
                {discipline.description}
              </p>
            </section>

            {discipline.syllabus.length > 0 ? (
              <section className="mt-10">
                <h2 className="text-xl font-semibold">Conteúdos</h2>
                <div className="mt-4 space-y-5">
                  {discipline.syllabus.map((unit) => (
                    <div
                      key={unit.title}
                      className="border-line bg-surface rounded-card border p-5"
                    >
                      <h3 className="font-semibold">{unit.title}</h3>
                      <ul className="mt-3 space-y-1.5">
                        {unit.items.map((item) => (
                          <li
                            key={item}
                            className="text-ink-muted flex gap-2.5 text-sm leading-relaxed"
                          >
                            <span
                              className="mt-[0.5rem] size-1 shrink-0 rounded-full"
                              style={{ backgroundColor: discipline.color }}
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-12">
              <h2 className="text-xl font-semibold">Bibliografia</h2>
              <p className="text-ink-muted mt-2 text-sm">
                {books.length} {books.length === 1 ? "título" : "títulos"}, conforme o plano de
                ensino de {discipline.semester}.
              </p>

              <div className="mt-6 space-y-12">
                {grouped.map((group) => (
                  <div key={group.type}>
                    <h3 className="border-line mb-4 flex items-baseline gap-2 border-b pb-2 text-lg font-semibold">
                      {bibliographyLabels[group.type]}
                      <span className="text-ink-faint text-sm font-normal">
                        {group.entries.length}
                      </span>
                    </h3>
                    <BookGrid
                      entries={group.entries}
                      hideDisciplines
                      className="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
                      label={`Bibliografia ${bibliographyLabels[group.type].toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="border-line bg-surface rounded-card border p-5">
              <h2 className="text-sm font-semibold">Resumo</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Período</dt>
                  <dd className="text-right">{periodLabel(discipline.period)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Semestre</dt>
                  <dd className="text-right">{discipline.semester}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Carga horária</dt>
                  <dd className="text-right">{discipline.workload ?? "Não informada"}</dd>
                </div>
                {discipline.weeklyWorkload ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-faint">CH semanal</dt>
                    <dd className="text-right">{discipline.weeklyWorkload}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Código</dt>
                  <dd className="text-right">{discipline.code ?? "Não informado"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-faint">Títulos</dt>
                  <dd className="text-right">{books.length}</dd>
                </div>
              </dl>
            </div>

            {discipline.notes && discipline.notes.length > 0 ? (
              <div className="border-line bg-surface-sunken rounded-card border p-5">
                <h2 className="text-sm font-semibold">Observações do plano</h2>
                <ul className="mt-3 space-y-2.5">
                  {discipline.notes.map((note) => (
                    <li key={note} className="text-ink-muted text-sm leading-relaxed text-pretty">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <nav aria-label="Outras disciplinas" className="flex flex-col gap-2">
              {previous ? (
                <Link
                  href={`/disciplinas/${previous.slug}`}
                  className="group border-line bg-surface hover:border-line-strong rounded-card flex items-center gap-2 border p-3 text-sm transition-colors"
                >
                  <ArrowLeft className="text-ink-faint size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="text-ink-faint block text-xs">Anterior</span>
                    <span className="group-hover:text-primary block truncate font-medium">
                      {previous.shortName}
                    </span>
                  </span>
                </Link>
              ) : null}
              {next ? (
                <Link
                  href={`/disciplinas/${next.slug}`}
                  className="group border-line bg-surface hover:border-line-strong rounded-card flex items-center gap-2 border p-3 text-sm transition-colors"
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-ink-faint block text-xs">Próxima</span>
                    <span className="group-hover:text-primary block truncate font-medium">
                      {next.shortName}
                    </span>
                  </span>
                  <ArrowRight className="text-ink-faint size-4 shrink-0" aria-hidden="true" />
                </Link>
              ) : null}
            </nav>
          </aside>
        </div>
      </div>
    </div>
  );
}
