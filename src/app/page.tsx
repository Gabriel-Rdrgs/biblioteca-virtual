import Link from "next/link";
import { ArrowRight, CalendarDays, PencilRuler, Search } from "lucide-react";
import { BookCover } from "@/components/book/book-cover";
import { BookGrid } from "@/components/book/book-grid";
import { DisciplineCard } from "@/components/discipline/discipline-card";
import { StudySnapshot } from "@/components/exam/study-snapshot";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui/primitives";
import { isAdminRequest } from "@/lib/audience";
import { countdownLabel, formatAssessmentDate, isExam } from "@/lib/domain/assessment-types";
import { getUpcomingAssessments } from "@/lib/repository/assessments";
import { getExams } from "@/lib/repository/exams";
import { periodLabel } from "@/lib/domain/types";
import {
  getCatalog,
  getCurrentPeriod,
  getMostAccessed,
  getDisciplineBookCounts,
  getDisciplines,
  getRecentlyAdded,
  getStats,
  toCatalogEntries,
} from "@/lib/repository";

// The catalogue is edited at runtime by the admin area; render per request.
export const dynamic = "force-dynamic";

/**
 * O painel de quem chega com pressa.
 *
 * Esta página era uma landing: no celular, a primeira tela inteira era
 * manchete, dois botões e capas decorativas que vazavam pelas bordas. A
 * próxima prova — a informação mais sensível ao tempo do produto — ficava
 * abaixo da dobra, junto com tudo que se usa de verdade.
 *
 * Agora a ordem é a da urgência: quando é a prova, onde você parou, o que
 * revisar, e só então o acervo. A estante em leque continua, porque é a
 * identidade do Atlas, mas só a partir de telas grandes, onde não custa
 * nada.
 */
export default async function HomePage() {
  const admin = await isAdminRequest();
  const [stats, counts, catalog, core, recent, currentPeriod, allDisciplines] = await Promise.all([
    getStats(),
    getDisciplineBookCounts(),
    getCatalog(),
    getMostAccessed(8),
    getRecentlyAdded(5),
    getCurrentPeriod(),
    getDisciplines(),
  ]);

  // Uma devolutiva ou uma entrega pertence ao calendário, mas a home conta
  // os dias para aquilo que exige estudar.
  const upcoming = await getUpcomingAssessments();
  const next = upcoming.find((item) => isExam(item.assessment)) ?? upcoming[0];
  const nextDiscipline = next
    ? allDisciplines.find((d) => d.id === next.assessment.disciplineId)
    : undefined;
  const nextExams = next
    ? getExams().filter((exam) => next.assessment.examIds.includes(exam.id))
    : [];

  const disciplines = allDisciplines.filter((d) => d.period === currentPeriod);
  const otherPeriods = allDisciplines.some((d) => d.period !== currentPeriod);

  const shelf = toCatalogEntries(catalog.filter((entry) => entry.book.file).slice(0, 5), { admin });
  const mostUsed = toCatalogEntries(core, { admin });
  const latest = toCatalogEntries(recent, { admin });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* ------------------------------------------------------------ topo */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="text-ink-muted text-sm font-medium">
            Medicina · {periodLabel(currentPeriod)} · UNIEURO
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">A estante da turma</h1>
          <p className="text-ink-muted text-body-sm mt-2 leading-relaxed text-pretty">
            {stats.withFile} livros em PDF, as datas do semestre e simulados que se corrigem
            sozinhos.
          </p>

          <form action="/busca" className="mt-5 flex max-w-md items-center">
            <label htmlFor="busca-home" className="sr-only">
              Buscar na estante
            </label>
            <div className="glass relative w-full rounded-full">
              <Search
                className="text-ink-faint pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="busca-home"
                name="q"
                type="search"
                placeholder="Procurar um livro, autor ou tema…"
                className="placeholder:text-ink-faint min-h-12 w-full rounded-full bg-transparent py-3 pr-4 pl-11 text-sm outline-none"
              />
            </div>
          </form>
        </div>

        {/* A estante em leque: identidade, não informação — só onde sobra espaço. */}
        <div
          className="relative mx-auto hidden h-[22rem] w-full max-w-lg lg:block lg:h-[24rem]"
          aria-hidden="true"
        >
          <div className="glass absolute inset-x-6 bottom-0 h-3 rounded-full" />
          {shelf.map((entry, i) => {
            const n = shelf.length;
            const offset = i - (n - 1) / 2;
            return (
              <div
                key={entry.book.id}
                className="absolute bottom-3 w-[32%] transition-transform duration-300 hover:-translate-y-3 motion-reduce:transform-none"
                style={{
                  left: `${50 + offset * 19}%`,
                  transform: `translateX(-50%) rotate(${offset * 5}deg)`,
                  zIndex: n - Math.abs(Math.round(offset)),
                }}
              >
                <BookCover book={entry.book} size="md" decorative />
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------- a próxima prova */}
      {next ? (
        <section className="mt-8">
          <Card
            raio="hero"
            respiro="md"
            className={next.daysLeft <= 7 ? "border-danger/30 ring-danger/15 ring-2" : undefined}
          >
            <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
              <CalendarDays className="text-primary mt-0.5 size-6 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-ink-faint text-micro tracking-[0.12em] uppercase">
                  Próxima prova
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {next.assessment.title ?? next.assessment.kind}
                  {nextDiscipline ? ` de ${nextDiscipline.shortName}` : ""}
                </h2>
                <p className="text-ink-muted mt-1 text-sm">
                  {formatAssessmentDate(next.assessment.date)}
                  {next.assessment.time ? `, ${next.assessment.time}` : ""}
                </p>
              </div>
              <Badge tom={next.daysLeft <= 7 ? "perigo" : "neutro"} className="text-sm">
                {countdownLabel(next.daysLeft)}
              </Badge>
            </div>

            {next.assessment.content.length > 0 ? (
              <p className="text-ink-muted mt-4 line-clamp-2 text-sm leading-relaxed text-pretty">
                {next.assessment.content[0]}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {nextExams.slice(0, 1).map((exam) => (
                <ButtonLink key={exam.id} href={`/simulados/${exam.slug}`} size="sm">
                  <PencilRuler className="size-4" aria-hidden="true" />
                  Treinar para ela
                </ButtonLink>
              ))}
              <ButtonLink href="/calendario" variant="secundario" size="sm">
                Todas as datas
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </div>
          </Card>
        </section>
      ) : null}

      {/* ------------------------------------------ onde parei / o que revisar */}
      <section className="mt-4">
        <StudySnapshot variante="painel" />
      </section>

      {/* ---------------------------------------------------- mais acessados */}
      <section className="pt-12">
        <SectionHeading
          title="Mais acessados"
          description="Os livros que a turma mais abre."
          action={
            <Link
              href="/livros"
              className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm font-medium hover:underline"
            >
              Ver tudo
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
        <BookGrid entries={mostUsed} label="Mais acessados" />
      </section>

      {/* ------------------------------------------------------ disciplinas */}
      <section className="pt-12">
        <SectionHeading
          title={`Por matéria — ${periodLabel(currentPeriod)}`}
          description="Ementa, conteúdos, livros e o plano de ensino de cada uma."
          action={
            otherPeriods ? (
              <Link
                href="/disciplinas"
                className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm font-medium hover:underline"
              >
                Outros períodos
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : undefined
          }
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {disciplines.map((discipline) => (
            <li key={discipline.id} className="flex">
              <DisciplineCard
                discipline={discipline}
                bookCount={counts.get(discipline.id) ?? 0}
                className="w-full"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------- chegou agora */}
      <section className="pt-12">
        <SectionHeading title="Chegou agora" description="Os últimos PDFs adicionados à estante." />
        <BookGrid
          entries={latest}
          label="Adicionados recentemente"
          className="grid-cols-3 sm:grid-cols-5 lg:grid-cols-5"
        />
      </section>

      {/* ---------------------------------------------------------- rodapé */}
      <section className="pt-12 pb-16">
        <Card raio="hero" respiro="lg">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              [stats.withFile, "livros em PDF"],
              [stats.disciplines, "matérias do semestre"],
              [stats.teachingPlans, "planos de ensino"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-primary text-4xl font-semibold tabular-nums">
                  {value}
                </p>
                <p className="mt-1 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-ink-muted mt-6 max-w-2xl text-sm leading-relaxed text-pretty">
            Isto aqui é da turma, para a turma. Os PDFs são de uso interno — não repasse fora do
            grupo.{" "}
            <Link href="/uso-responsavel" className="text-primary hover:underline">
              Combinados de uso
            </Link>
            .
          </p>
        </Card>
      </section>
    </div>
  );
}
