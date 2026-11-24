import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Images,
  WalletCards,
  Zap,
} from "lucide-react";
import { BookGrid } from "@/components/book/book-grid";
import { DeckUnits } from "@/components/flashcards/deck-units";
import { SummaryTimeline } from "@/components/summaries/summary-timeline";
import { Badge, Breadcrumbs, ButtonLink } from "@/components/ui/primitives";
import {
  assessmentLabel,
  countdownLabel,
  formatAssessmentDate,
  isExam,
} from "@/lib/domain/assessment-types";
import { getExamPrep, prepHref } from "@/lib/repository/exam-prep";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const prep = await getExamPrep(id);
  if (!prep) return { title: "Prova não encontrada" };
  return {
    title: `${assessmentLabel(prep.assessment)} de ${prep.discipline.shortName}`,
    description: `Tudo para estudar para ${assessmentLabel(prep.assessment)} de ${prep.discipline.shortName}.`,
  };
}

/**
 * "Estudar para esta prova."
 *
 * A página que o cartão da próxima prova abre. Em vez de mandar a pessoa
 * caçar o material em cinco lugares, ela parte da prova e põe em ordem o
 * que existe da matéria: primeiro o que cai, depois um roteiro numerado —
 * flashcards, figuras, questões, resumos, livros — e só os passos que têm
 * conteúdo aparecem.
 */

function Step({
  n,
  icon,
  title,
  description,
  action,
  children,
}: {
  n: number;
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative pl-14" aria-labelledby={`passo-${n}`}>
      <span
        className="bg-ink text-canvas font-display absolute top-0 left-0 grid size-10 place-items-center rounded-full text-lg tabular-nums"
        aria-hidden="true"
      >
        {n}
      </span>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id={`passo-${n}`} className="flex items-center gap-2 text-xl font-semibold">
            {icon}
            {title}
          </h2>
          <p className="text-ink-muted mt-1 text-sm leading-relaxed text-pretty">{description}</p>
        </div>
        {action}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export default async function ExamPrepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prep = await getExamPrep(id);
  if (!prep) notFound();

  const { assessment, discipline, daysLeft } = prep;
  const label = assessmentLabel(assessment);
  const deckCount = prep.deckUnits.reduce((n, u) => n + u.decks.length, 0);
  const cardCount = prep.deckUnits.reduce(
    (n, u) => n + u.decks.reduce((m, d) => m + d.cardIds.length, 0),
    0,
  );
  const objetivas = prep.areas.reduce((n, a) => n + a.objetivas, 0);
  const cycles = [assessment, ...prep.siblings].map((a) => ({
    id: a.id,
    label: assessmentLabel(a),
    date: a.date,
  }));

  let step = 0;
  const steps: ReactNode[] = [];

  if (deckCount > 0) {
    step++;
    steps.push(
      <Step
        key="flashcards"
        n={step}
        icon={<WalletCards className="text-primary size-5" aria-hidden="true" />}
        title="Revise com flashcards"
        description={`${deckCount} ${deckCount === 1 ? "baralho" : "baralhos"} e ${cardCount} cartões de ${discipline.shortName}, na ordem do plano de ensino. Comece pelo primeiro: o que você errar volta na mesma sessão.`}
        action={
          <ButtonLink href={`/flashcards?materia=${discipline.id}`} variant="fantasma" size="sm">
            Todos os baralhos
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        }
      >
        <DeckUnits units={prep.deckUnits} color={discipline.color} />
      </Step>,
    );
  }

  if (prep.imageFigures > 0) {
    step++;
    steps.push(
      <Step
        key="imagem"
        n={step}
        icon={<Images className="text-primary size-5" aria-hidden="true" />}
        title="Treine o reconhecimento por imagem"
        description={`${prep.imageFigures} figuras sem legenda, com o relógio correndo — como na TV da prova. Escreva o nome no papel, revele e marque se acertou.`}
        action={
          <ButtonLink href={`/estudar/imagem?materia=${discipline.id}`} size="sm">
            <Images className="size-4" aria-hidden="true" />
            Começar simulado de imagem
          </ButtonLink>
        }
      />,
    );
  }

  if (prep.simulados.length > 0 || objetivas > 0) {
    step++;
    steps.push(
      <Step
        key="questoes"
        n={step}
        icon={<ClipboardCheck className="text-primary size-5" aria-hidden="true" />}
        title="Resolva questões"
        description="O simulado no formato da avaliação, corrigido por assunto — ou uma rodada rápida, uma questão por vez, com o comentário na hora."
      >
        <ul className="grid gap-2 lg:grid-cols-2">
          {prep.simulados.map((exam) => (
            <li key={exam.id}>
              <Link
                href={`/simulados/${exam.slug}`}
                className="glass hover:glass-strong rounded-panel flex items-center gap-4 p-4"
              >
                <ClipboardCheck className="text-primary size-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{exam.title}</span>
                  <span className="text-ink-muted text-sm">
                    {exam.questionIds.length} questões
                    {prep.linkedSimuladoIds.includes(exam.id) ? " · feito para esta prova" : ""}
                  </span>
                </span>
                <ArrowRight className="text-ink-faint size-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
          {objetivas > 0 ? (
            <li>
              <Link
                href={`/estudar/rapido?areas=${prep.areas.map((a) => a.area.id).join(",")}&n=20`}
                className="glass hover:glass-strong rounded-panel flex items-center gap-4 p-4"
              >
                <Zap className="text-primary size-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">20 questões rápidas</span>
                  <span className="text-ink-muted text-sm">
                    Sorteadas de {objetivas} objetivas de{" "}
                    {prep.areas.map((a) => a.area.shortLabel).join(" e ")}
                  </span>
                </span>
                <ArrowRight className="text-ink-faint size-4" aria-hidden="true" />
              </Link>
            </li>
          ) : null}
        </ul>
      </Step>,
    );
  }

  if (prep.summaries.length > 0 || prep.otherSummaries.length > 0) {
    step++;
    steps.push(
      <Step
        key="resumos"
        n={step}
        icon={<BookOpen className="text-primary size-5" aria-hidden="true" />}
        title="Leia os resumos"
        description={
          prep.summaries.length > 0
            ? `${prep.summaries.length} ${prep.summaries.length === 1 ? "resumo cai" : "resumos caem"} nesta prova, na ordem das aulas.`
            : "Os resumos da matéria, na ordem das aulas."
        }
      >
        <SummaryTimeline
          summaries={[...prep.summaries, ...prep.otherSummaries]}
          cycles={cycles}
          openKey={label.split(" — ")[0]}
          color={discipline.color}
        />
      </Step>,
    );
  }

  if (prep.books.length > 0) {
    step++;
    steps.push(
      <Step
        key="livros"
        n={step}
        icon={<BookMarked className="text-primary size-5" aria-hidden="true" />}
        title="Consulte os livros"
        description="A bibliografia básica da matéria e o que a turma postou."
        action={
          <ButtonLink href={`/disciplinas/${discipline.slug}`} variant="fantasma" size="sm">
            Página da matéria
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        }
      >
        <BookGrid
          entries={prep.books}
          hideDisciplines
          className="grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6"
          label="Livros da matéria"
        />
      </Step>,
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Agenda", href: "/calendario" },
          { label: `${label} de ${discipline.shortName}` },
        ]}
      />

      {/* ------------------------------------------------------- a prova */}
      <header
        className="rounded-hero relative overflow-hidden p-6 text-white sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${discipline.color}, color-mix(in oklab, ${discipline.color} 65%, #0b1020))`,
        }}
      >
        <p className="text-xs font-semibold tracking-[0.16em] text-white/75 uppercase">
          Estudar para a prova · {discipline.name}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            {label} de {discipline.shortName}
          </h1>
          <span
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold",
              daysLeft <= 1 && daysLeft >= 0 ? "bg-white text-ink" : "bg-white/15 text-white",
            )}
          >
            {daysLeft < 0 ? "já passou" : countdownLabel(daysLeft)}
          </span>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden="true" />
            {formatAssessmentDate(assessment.date)}
            {assessment.time ? `, ${assessment.time}` : ""}
          </span>
          {assessment.weight ? <span>· vale {assessment.weight}</span> : null}
          {assessment.room ? <span>· {assessment.room}</span> : null}
        </p>

        {assessment.content.length > 0 ? (
          <div className="mt-6 rounded-panel bg-white/10 p-4 backdrop-blur-sm">
            <h2 className="text-xs font-semibold tracking-[0.14em] text-white/80 uppercase">
              O que cai
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-white">
              {assessment.content.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-white" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {assessment.note ? (
          <p className="mt-3 text-xs leading-relaxed text-white/75">{assessment.note}</p>
        ) : null}
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
        {/* ------------------------------------------------ o roteiro */}
        <div className="min-w-0 space-y-12">
          {steps.length > 0 ? (
            steps
          ) : (
            <p className="glass rounded-panel text-ink-muted p-6 text-sm leading-relaxed">
              Ainda não há material no Atlas para {discipline.shortName}. Veja o plano de ensino e
              a bibliografia na página da matéria.
            </p>
          )}
        </div>

        {/* --------------------------------- o plano, para não esquecer nada */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {discipline.syllabus.length > 0 ? (
            <div className="glass rounded-panel p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="text-primary size-4" aria-hidden="true" />
                Conteúdos do plano
              </h2>
              <ol className="mt-3 space-y-3">
                {discipline.syllabus.map((unit) => (
                  <li key={unit.title}>
                    <p className="text-sm font-medium leading-snug">{unit.title}</p>
                    <ul className="text-ink-muted mt-1 space-y-0.5 text-xs leading-relaxed">
                      {unit.items.map((item) => (
                        <li key={item}>· {item}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
              {discipline.teachingPlanFile ? (
                <a
                  href={discipline.teachingPlanFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  Abrir o plano de ensino
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ) : null}

          {prep.siblings.length > 0 ? (
            <nav aria-label="Outras datas da matéria" className="glass rounded-panel p-5">
              <h2 className="text-sm font-semibold">Outras datas de {discipline.shortName}</h2>
              <ul className="mt-3 space-y-2">
                {prep.siblings.map((other) => (
                  <li key={other.id}>
                    <Link
                      href={prepHref(other.id)}
                      className="hover:text-primary flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className={cn(!isExam(other) && "text-ink-muted")}>
                        {assessmentLabel(other)}
                      </span>
                      <Badge tom="contorno">{formatAssessmentDate(other.date)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
