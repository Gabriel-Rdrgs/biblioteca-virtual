import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Images,
  LineChart,
  PersonStanding,
  Sparkles,
  Stethoscope,
  TriangleAlert,
  WalletCards,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Breadcrumbs,
  ButtonAnchor,
  ButtonLink,
  SectionHeading,
} from "@/components/ui/primitives";
import { DrillBuilder } from "@/components/exam/drill-builder";
import { StudySnapshot } from "@/components/exam/study-snapshot";
import { bankQuestions } from "@/lib/data/questions";
import {
  assessmentLabel,
  countdownLabel,
  formatAssessmentDate,
  isExam,
} from "@/lib/domain/assessment-types";
import { getDisciplines } from "@/lib/repository";
import { getUpcomingAssessments } from "@/lib/repository/assessments";
import { countAreaQuestions, getExams, getQuestionAreas, loadExam } from "@/lib/repository/exams";
import { getDeckSummaries, getImageDecks } from "@/lib/repository/flashcards";
import { getSummaries } from "@/lib/repository/summaries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Estudar",
  description: "As próximas provas, os modos de treino e os simulados de cada matéria.",
};

export const dynamic = "force-dynamic";

/**
 * Estudar: três perguntas, nessa ordem.
 *
 * 1. Para que prova? — as próximas, cada uma abrindo o roteiro dela.
 * 2. De que jeito? — os modos de treino, com o tamanho de cada um.
 * 3. De que matéria? — os simulados e o montador de treino, por matéria.
 *
 * Antes a página abria com uma lista de cartões soltos e enterrava as provas
 * no fim; quem chegava não sabia por onde começar.
 */

interface Mode {
  readonly href: string;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly text: string;
  readonly stat?: string;
}

function ModeTile({ mode }: { mode: Mode }) {
  const Icon = mode.icon;
  return (
    <li>
      <Link
        href={mode.href}
        className="glass hover:glass-strong rounded-panel group flex h-full gap-4 p-5 transition-transform hover:-translate-y-0.5"
      >
        <span className="bg-primary-soft text-primary grid size-11 shrink-0 place-items-center rounded-full">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold">{mode.title}</span>
            {mode.stat ? (
              <span className="text-ink-faint text-xs tabular-nums">{mode.stat}</span>
            ) : null}
          </span>
          <span className="text-ink-muted mt-1 block text-sm leading-relaxed text-pretty">
            {mode.text}
          </span>
        </span>
      </Link>
    </li>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="glass text-ink-muted inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs">
      {children}
    </span>
  );
}

export default async function EstudarPage() {
  const [disciplines, upcoming, summaries, decks] = await Promise.all([
    getDisciplines(),
    getUpcomingAssessments(),
    getSummaries(),
    getDeckSummaries(),
  ]);
  const exams = getExams();
  const areas = getQuestionAreas();
  const allDecks = [...decks.oficiais, ...decks.banco, ...decks.turma];

  const totalQuestions = areas.reduce((sum, area) => {
    const counts = countAreaQuestions(area.id);
    return sum + counts.discursivas + counts.objetivas;
  }, 0);
  const objetivas = bankQuestions.filter((q) => q.kind === "objetiva").length;
  const cards = allDecks.reduce((n, d) => n + d.cardIds.length, 0);
  const figures = getImageDecks().reduce(
    (n, d) => n + d.cards.filter((c) => c.kind !== "texto").length,
    0,
  );
  const disciplineById = new Map(disciplines.map((d) => [d.id, d]));
  const nextExams = upcoming.filter((u) => isExam(u.assessment)).slice(0, 4);

  const modes: Mode[] = [
    {
      href: "/flashcards",
      icon: WalletCards,
      title: "Flashcards",
      text: "Por matéria, na ordem do plano. O que você erra volta amanhã.",
      stat: `${cards} cartões`,
    },
    {
      href: "/estudar/rapido",
      icon: Zap,
      title: "Modo rápido",
      text: "Uma objetiva por vez, corrigida na hora, com o comentário.",
      stat: `${objetivas} questões`,
    },
    {
      href: "/anatomia",
      icon: PersonStanding,
      title: "Anatomia 3D",
      text: "Músculos e ossos acendem no corpo em 3D e você escreve o nome; o app corrige letra por letra e traz de volta na hora certa.",
      stat: "141 músculos · 52 ossos · 68 acidentes",
    },
    {
      href: "/estudar/imagem",
      icon: Images,
      title: "Simulado de imagem",
      text: "Figura sem legenda e relógio correndo, como na TV da prova.",
      stat: `${figures} figuras`,
    },
    {
      href: "/estudar/erros",
      icon: TriangleAlert,
      title: "Fila de erros",
      text: "O que você errou volta até acertar duas vezes seguidas.",
    },
    {
      href: "/resumos",
      icon: BookOpen,
      title: "Resumos",
      text: "Por matéria e por prova, na ordem das aulas.",
      stat: `${summaries.length} publicados`,
    },
    {
      href: "/progresso",
      icon: LineChart,
      title: "Desempenho",
      text: "Acerto por área, assuntos fracos e dias estudados.",
    },
  ];

  const byDiscipline = disciplines
    .map((discipline) => ({
      discipline,
      exams: exams.filter((exam) => exam.disciplineId === discipline.id),
      areas: areas.filter((area) => area.disciplineId === discipline.id),
    }))
    .filter((group) => group.exams.length > 0 || group.areas.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Estudar" }]} />
      <SectionHeading
        as="h1"
        title="Estudar"
        description={`Comece pela prova: cada uma abre um roteiro com o que cai e o que treinar, em ordem. ${totalQuestions} questões no banco da turma.`}
      />

      {/* --------------------------------------------- 1. para que prova */}
      {nextExams.length > 0 ? (
        <section aria-labelledby="proximas-provas" className="mb-10">
          <h2
            id="proximas-provas"
            className="text-ink-faint text-micro mb-3 font-semibold tracking-[0.14em] uppercase"
          >
            Próximas provas
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {nextExams.map(({ assessment, daysLeft }) => {
              const discipline = disciplineById.get(assessment.disciplineId);
              return (
                <li key={assessment.id}>
                  <Link
                    href={`/provas/${assessment.id}`}
                    className="rounded-panel group relative flex h-full flex-col overflow-hidden p-5 text-white transition-transform hover:-translate-y-0.5"
                    style={{
                      background: `linear-gradient(140deg, ${discipline?.color ?? "var(--primary)"}, color-mix(in oklab, ${discipline?.color ?? "#1e293b"} 60%, #0b1020))`,
                    }}
                  >
                    <span className="flex items-center justify-between gap-2 text-xs font-semibold tracking-[0.12em] text-white/80 uppercase">
                      {discipline?.shortName ?? assessment.disciplineId}
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 tracking-normal normal-case",
                          daysLeft <= 1 ? "text-ink bg-white" : "bg-white/15",
                        )}
                      >
                        {countdownLabel(daysLeft)}
                      </span>
                    </span>
                    <span className="mt-3 text-lg leading-snug font-semibold">
                      {assessmentLabel(assessment)}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/80">
                      <CalendarDays className="size-3.5" aria-hidden="true" />
                      {formatAssessmentDate(assessment.date)}
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold">
                      Estudar para ela
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="mb-10">
        <StudySnapshot />
      </div>

      {/* ------------------------------------------------ 2. de que jeito */}
      <section aria-label="Modos de estudo" className="mb-14">
        <SectionHeading
          title="Modos de estudo"
          description="Cada um treina uma coisa: lembrar, resolver, reconhecer, corrigir o que errou."
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modes.map((mode) => (
            <ModeTile key={mode.href} mode={mode} />
          ))}
          <li className="rounded-panel border-line-strong flex gap-4 border border-dashed p-5 opacity-80">
            <span className="bg-accent-soft text-accent grid size-11 shrink-0 place-items-center rounded-full">
              <Stethoscope className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Prova prática</span>
                <Badge tom="acento">em breve</Badge>
              </span>
              <span className="text-ink-muted mt-1 block text-sm leading-relaxed">
                Estações cronometradas de anatomia, histologia e embriologia, como na N2 prática.
              </span>
            </span>
          </li>
        </ul>
      </section>

      {/* ---------------------------------------------- 3. de que matéria */}
      <section aria-label="Simulados por matéria" className="space-y-12">
        <SectionHeading
          title="Simulados por matéria"
          description="A prova inteira no formato da avaliação, corrigida por assunto — ou um treino montado do banco, do tamanho que você quiser."
        />

        {byDiscipline.length === 0 ? (
          <p className="text-ink-muted glass rounded-panel p-6 text-sm">
            Ainda não há simulados cadastrados.
          </p>
        ) : null}

        {byDiscipline.map(({ discipline, exams: list, areas: areasOf }) => {
          const deckCount = allDecks.filter((d) => d.disciplineId === discipline.id).length;
          return (
            <div key={discipline.id}>
              <header className="border-line mb-5 flex flex-wrap items-end justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-10 w-1.5 rounded-full"
                    style={{ background: discipline.color }}
                  />
                  <div>
                    <h3 id={`sim-${discipline.id}`} className="text-xl font-semibold">
                      {discipline.shortName}
                    </h3>
                    <p className="text-ink-muted text-sm">{discipline.name}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {areasOf.map((area) => {
                    const counts = countAreaQuestions(area.id);
                    return (
                      <Pill key={area.id}>
                        <span className="text-ink font-medium">{area.label}</span>
                        <span className="tabular-nums">
                          {counts.discursivas + counts.objetivas} questões
                        </span>
                      </Pill>
                    );
                  })}
                  {deckCount > 0 ? (
                    <Link href={`/flashcards?materia=${discipline.id}`}>
                      <Pill>
                        <WalletCards className="size-3.5" aria-hidden="true" />
                        {deckCount} {deckCount === 1 ? "baralho" : "baralhos"}
                      </Pill>
                    </Link>
                  ) : null}
                </div>
              </header>

              <ul className="grid gap-3 md:grid-cols-2">
                {list.map((exam) => {
                  const loaded = loadExam(exam);
                  return (
                    <li key={exam.id} className="glass rounded-panel flex flex-col p-5">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="text-primary size-4" aria-hidden="true" />
                        <Badge tom="primario">{exam.assessment}</Badge>
                        <span className="text-ink-faint text-xs">{exam.semester}</span>
                      </div>
                      <h4 className="mt-3 text-lg leading-snug font-semibold">{exam.title}</h4>
                      <p className="text-ink-muted mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-pretty">
                        {exam.description}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <dl className="text-ink-faint flex flex-wrap gap-x-4 gap-y-1 text-xs">
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
                        <span className="ml-auto flex gap-2">
                          {exam.pdfPath ? (
                            <ButtonAnchor
                              href={`/api/simulados/${exam.pdfPath}?baixar=1`}
                              variant="fantasma"
                              size="sm"
                            >
                              <FileText className="size-4" aria-hidden="true" />
                              Imprimir
                            </ButtonAnchor>
                          ) : null}
                          <ButtonLink href={`/simulados/${exam.slug}`} size="sm">
                            Abrir
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </ButtonLink>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {areasOf.length > 0 ? (
                <details className="glass rounded-panel group/treino mt-3">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    <Sparkles className="text-primary size-4" aria-hidden="true" />
                    Montar um treino de {discipline.shortName}
                    <span className="text-ink-faint ml-auto text-xs font-normal">
                      sorteado do banco, do tamanho que você quiser
                    </span>
                  </summary>
                  <div className="border-line border-t px-5 py-5">
                    <DrillBuilder
                      disciplineId={discipline.id}
                      areas={areasOf.map((area) => ({
                        id: area.id,
                        label: area.label,
                        ...countAreaQuestions(area.id),
                      }))}
                    />
                  </div>
                </details>
              ) : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}
