import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Images,
  LineChart,
  PencilRuler,
  Search,
  Stethoscope,
  WalletCards,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BookGrid } from "@/components/book/book-grid";
import { DisciplineCard } from "@/components/discipline/discipline-card";
import { GradesGlance } from "@/components/home/grades-glance";
import { TodayPanel } from "@/components/home/today-panel";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui/primitives";
import { bankQuestions } from "@/lib/data/questions";
import { isAdminRequest } from "@/lib/audience";
import {
  assessmentLabel,
  countdownLabel,
  formatAssessmentDate,
  isExam,
} from "@/lib/domain/assessment-types";
import { periodLabel } from "@/lib/domain/types";
import {
  getCurrentPeriod,
  getDisciplineBookCounts,
  getDisciplines,
  getMostAccessed,
  getRecentlyAdded,
  getStats,
  toCatalogEntries,
} from "@/lib/repository";
import { getUpcomingAssessments } from "@/lib/repository/assessments";
import { getExams, getQuestionAreas } from "@/lib/repository/exams";
import { getDeckSummaries, getImageDecks } from "@/lib/repository/flashcards";
import { getSummaries } from "@/lib/repository/summaries";
import { cn } from "@/lib/utils";

// O catálogo e as datas mudam pelo painel do admin; renderiza a cada pedido.
export const dynamic = "force-dynamic";

/**
 * A home: o painel do dia.
 *
 * O Atlas começou estante de PDFs e virou o lugar onde a turma estuda —
 * prova, simulado, flashcards, resumos, notas. A home acompanha: primeiro o
 * que tem data (a próxima prova, com o atalho para treinar para ela), depois
 * o que é seu e vence hoje, depois tudo o que dá para fazer aqui, e só então
 * as matérias e os livros.
 *
 * O que é do aparelho (cartões vencidos, fila de erros, notas) fica em
 * componentes de cliente; o resto vem pronto do servidor.
 */

interface Tool {
  readonly href: string;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly text: string;
  readonly stat?: string;
  readonly soon?: boolean;
}

function ToolTile({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="bg-primary-soft text-primary grid size-10 place-items-center rounded-full">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {tool.soon ? (
          <Badge tom="acento">em breve</Badge>
        ) : tool.stat ? (
          <span className="text-ink-faint text-xs font-medium tabular-nums">{tool.stat}</span>
        ) : null}
      </span>
      <span className="mt-4 block font-semibold">{tool.title}</span>
      <span className="text-ink-muted mt-1 block text-sm leading-relaxed text-pretty">
        {tool.text}
      </span>
    </>
  );

  if (tool.soon) {
    return (
      <li className="rounded-panel border-line-strong flex flex-col border border-dashed p-5 opacity-80">
        {body}
      </li>
    );
  }
  return (
    <li>
      <Link
        href={tool.href}
        className="glass hover:glass-strong rounded-panel flex h-full flex-col p-5 transition-transform hover:-translate-y-0.5"
      >
        {body}
      </Link>
    </li>
  );
}

export default async function HomePage() {
  const admin = await isAdminRequest();
  const [stats, counts, core, recent, currentPeriod, allDisciplines, upcoming, summaries, decks] =
    await Promise.all([
      getStats(),
      getDisciplineBookCounts(),
      getMostAccessed(8),
      getRecentlyAdded(5),
      getCurrentPeriod(),
      getDisciplines(),
      getUpcomingAssessments(),
      getSummaries(),
      getDeckSummaries(),
    ]);

  const disciplineById = new Map(allDisciplines.map((d) => [d.id, d]));

  // Devolutiva e entrega estão no calendário, mas a home conta os dias para
  // o que exige estudar.
  const exams = upcoming.filter((item) => isExam(item.assessment));
  const next = exams[0] ?? upcoming[0];
  const nextDiscipline = next ? disciplineById.get(next.assessment.disciplineId) : undefined;
  const nextSimulado = next
    ? getExams().find((exam) => next.assessment.examIds.includes(exam.id))
    : undefined;
  const nextAreas = next ? getQuestionAreas(next.assessment.disciplineId) : [];
  const nextSummaries = next
    ? summaries.filter((s) => s.assessmentIds.includes(next.assessment.id))
    : [];

  const disciplines = allDisciplines.filter((d) => d.period === currentPeriod);
  const otherPeriods = allDisciplines.some((d) => d.period !== currentPeriod);
  const mostUsed = toCatalogEntries(core, { admin });
  const latest = toCatalogEntries(recent, { admin });

  // Os números das ferramentas, contados do que existe de verdade.
  const objetivas = bankQuestions.filter((q) => q.kind === "objetiva").length;
  const allDecks = [...decks.oficiais, ...decks.banco, ...decks.turma];
  const totalCards = allDecks.reduce((n, d) => n + d.cardIds.length, 0);
  const imageCards = getImageDecks().reduce(
    (n, d) => n + d.cards.filter((c) => c.kind !== "texto").length,
    0,
  );
  const simulados = getExams().length;

  const tools: Tool[] = [
    {
      href: "/estudar",
      icon: ClipboardCheck,
      title: "Simulados",
      text: "A prova inteira, no formato da avaliação, com a correção por assunto.",
      stat: `${simulados} prontos`,
    },
    {
      href: "/estudar/rapido",
      icon: Zap,
      title: "Modo rápido",
      text: "Uma objetiva por vez, corrigida na hora, com o comentário do gabarito.",
      stat: `${objetivas} questões`,
    },
    {
      href: "/flashcards",
      icon: WalletCards,
      title: "Flashcards",
      text: "Revisão espaçada: o que você erra volta amanhã. Crie e compartilhe os seus.",
      stat: `${totalCards} cartões`,
    },
    {
      href: "/estudar/imagem",
      icon: Images,
      title: "Simulado de imagem",
      text: "Figura sem legenda e relógio correndo, como na TV da prova prática.",
      stat: `${imageCards} figuras`,
    },
    {
      href: "/resumos",
      icon: BookOpen,
      title: "Resumos",
      text: "Um por aula, com o que caiu naquele encontro e o eixo que ele explica.",
      stat: `${summaries.length} publicados`,
    },
    {
      href: "/progresso",
      icon: LineChart,
      title: "Desempenho",
      text: "Acerto por área, os assuntos mais fracos e os dias em que você estudou.",
    },
    {
      href: "/livros",
      icon: BookMarked,
      title: "Biblioteca",
      text: "A bibliografia dos planos de ensino, com os PDFs da turma.",
      stat: `${stats.withFile} PDFs`,
    },
    {
      href: "/estudar",
      icon: Stethoscope,
      title: "Prova prática",
      text: "Estações cronometradas de anatomia, histologia e embriologia.",
      soon: true,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* ------------------------------------------------------------ topo */}
      <section className="grid items-start gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
        <div className="lg:pt-4">
          <p className="text-ink-muted text-sm font-medium">
            Medicina · {periodLabel(currentPeriod)} · UNIEURO
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-balance sm:text-[2.6rem] sm:leading-tight">
            O estudo da turma, num lugar só
          </h1>
          <p className="text-ink-muted text-body-sm mt-3 max-w-xl leading-relaxed text-pretty">
            {objetivas + bankQuestions.filter((q) => q.kind === "discursiva").length} questões,{" "}
            {totalCards} flashcards, {summaries.length} resumos e {stats.withFile} livros da
            turma — com as datas do semestre e as suas notas.
          </p>

          <form action="/busca" className="mt-6 flex max-w-lg items-center">
            <label htmlFor="busca-home" className="sr-only">
              Buscar no Atlas
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
                placeholder="Procurar um livro, autor, resumo ou tema…"
                className="placeholder:text-ink-faint min-h-12 w-full rounded-full bg-transparent py-3 pr-4 pl-11 text-sm outline-none"
              />
            </div>
          </form>
        </div>

        {/* -------------------------------------------------- a próxima prova */}
        {next ? (
          <section aria-labelledby="proxima-prova">
            <Card
              raio="hero"
              respiro="md"
              className={cn(
                "relative overflow-hidden",
                next.daysLeft <= 7 && "border-danger/30 ring-danger/15 ring-2",
              )}
            >
              {nextDiscipline ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: nextDiscipline.color }}
                />
              ) : null}
              <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                <CalendarDays className="text-primary mt-0.5 size-6 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p
                    id="proxima-prova"
                    className="text-ink-faint text-micro tracking-[0.12em] uppercase"
                  >
                    Próxima prova
                  </p>
                  <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
                    {/* O cartão inteiro é o link: a área clicável cobre tudo (after:inset-0). */}
                    <Link
                      href={`/provas/${next.assessment.id}`}
                      className="hover:text-primary after:absolute after:inset-0 after:content-['']"
                    >
                      {assessmentLabel(next.assessment)}
                      {nextDiscipline ? ` de ${nextDiscipline.shortName}` : ""}
                    </Link>
                  </h2>
                  <p className="text-ink-muted mt-1 text-sm">
                    {formatAssessmentDate(next.assessment.date)}
                    {next.assessment.time ? `, ${next.assessment.time}` : ""}
                    {next.assessment.weight ? ` · vale ${next.assessment.weight}` : ""}
                  </p>
                </div>
                <Badge tom={next.daysLeft <= 7 ? "perigo" : "neutro"} className="text-sm">
                  {countdownLabel(next.daysLeft)}
                </Badge>
              </div>

              {next.assessment.content.length > 0 ? (
                <ul className="text-ink-muted mt-4 space-y-1 text-sm leading-relaxed">
                  {next.assessment.content.slice(0, 2).map((line) => (
                    <li key={line} className="line-clamp-2 text-pretty">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="relative z-10 mt-5 flex flex-wrap gap-2">
                <ButtonLink href={`/provas/${next.assessment.id}`} size="sm">
                  <PencilRuler className="size-4" aria-hidden="true" />
                  Estudar para esta prova
                </ButtonLink>
                {nextSimulado ? (
                  <ButtonLink href={`/simulados/${nextSimulado.slug}`} variant="secundario" size="sm">
                    <ClipboardCheck className="size-4" aria-hidden="true" />
                    Treinar para ela
                  </ButtonLink>
                ) : null}
                {nextAreas.length > 0 ? (
                  <ButtonLink
                    href={`/estudar/rapido?areas=${nextAreas.map((a) => a.id).join(",")}&n=20`}
                    variant="secundario"
                    size="sm"
                  >
                    <Zap className="size-4" aria-hidden="true" />
                    Questões rápidas
                  </ButtonLink>
                ) : null}
                {nextSummaries.length > 0 ? (
                  <ButtonLink
                    href={`/resumos#resumos-${next.assessment.disciplineId}`}
                    variant="secundario"
                    size="sm"
                  >
                    <BookOpen className="size-4" aria-hidden="true" />
                    {nextSummaries.length} {nextSummaries.length === 1 ? "resumo" : "resumos"}
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/calendario" variant="fantasma" size="sm">
                  Todas as datas
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
              </div>
            </Card>
          </section>
        ) : null}
      </section>

      {/* ------------------------------------------------------------ hoje */}
      <section className="mt-8" aria-label="O que vence hoje">
        <TodayPanel totalCards={totalCards} />
      </section>

      {/* ----------------------------------------------------- ferramentas */}
      <section className="pt-12" aria-label="Ferramentas de estudo">
        <SectionHeading
          title="Para estudar"
          description="Tudo o que o Atlas faz, a um toque. Os números são do banco da turma, hoje."
          action={
            <Link
              href="/estudar"
              className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm font-medium hover:underline"
            >
              Abrir Estudar
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolTile key={tool.title} tool={tool} />
          ))}
        </ul>
      </section>

      {/* ------------------------------------------- próximas datas e notas */}
      <section className="grid gap-4 pt-12 lg:grid-cols-[1.6fr_1fr]">
        <Card raio="hero" respiro="md">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Próximas datas</h2>
            <Link href="/calendario" className="text-primary text-sm font-medium hover:underline">
              Agenda completa
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-ink-muted text-sm">Nenhuma data pela frente no calendário.</p>
          ) : (
            <ol className="divide-line divide-y">
              {upcoming.slice(0, 5).map(({ assessment, daysLeft }) => {
                const discipline = disciplineById.get(assessment.disciplineId);
                return (
                  <li key={assessment.id}>
                    <Link
                      href={`/provas/${assessment.id}`}
                      className="hover:text-primary flex items-center gap-3 py-2.5"
                    >
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: discipline?.color ?? "var(--ink-faint)" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {discipline ? `${discipline.shortName} · ` : ""}
                        {assessmentLabel(assessment)}
                      </span>
                      <span className="text-ink-faint block text-xs">
                        {formatAssessmentDate(assessment.date)}
                      </span>
                    </span>
                    <Badge tom={daysLeft <= 7 && isExam(assessment) ? "perigo" : "neutro"}>
                      {countdownLabel(daysLeft)}
                    </Badge>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
        <GradesGlance />
      </section>

      {/* ------------------------------------------------------- matérias */}
      <section className="pt-12">
        <SectionHeading
          title={`Matérias — ${periodLabel(currentPeriod)}`}
          description="Cada uma com a ementa, as datas, os livros e o plano de ensino."
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* ------------------------------------------------------ biblioteca */}
      <section className="pt-12">
        <SectionHeading
          title="Biblioteca"
          description="Os livros que a turma mais abre."
          action={
            <Link
              href="/livros"
              className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm font-medium hover:underline"
            >
              Ver todos os livros
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
        <BookGrid entries={mostUsed} label="Mais acessados" />
        {latest.length > 0 ? (
          <>
            <h3 className="text-ink-faint text-micro mt-10 mb-4 font-semibold tracking-[0.14em] uppercase">
              Chegou agora
            </h3>
            <BookGrid
              entries={latest}
              label="Adicionados recentemente"
              className="grid-cols-3 sm:grid-cols-5 lg:grid-cols-5"
            />
          </>
        ) : null}
      </section>

      <p className="text-ink-muted mx-auto max-w-2xl pt-14 pb-16 text-center text-sm leading-relaxed text-pretty">
        Isto aqui é da turma, para a turma. Os PDFs são de uso interno — não repasse fora do grupo.{" "}
        <Link href="/uso-responsavel" className="text-primary hover:underline">
          Combinados de uso
        </Link>
        .
      </p>
    </div>
  );
}
