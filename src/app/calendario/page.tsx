import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, PencilRuler } from "lucide-react";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import {
  assessmentLabel,
  countdownLabel,
  formatAssessmentDate,
  type UpcomingAssessment,
} from "@/lib/domain/assessment-types";
import { getCalendar } from "@/lib/repository/assessments";
import { getDisciplines } from "@/lib/repository";
import { getExams } from "@/lib/repository/exams";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Calendário de provas",
  description: "As datas das avaliações do semestre, o que cai em cada uma e como treinar.",
};

export const dynamic = "force-dynamic";

/** Red inside a week, amber inside a fortnight, calm after that. */
function urgency(daysLeft: number) {
  if (daysLeft <= 7) return { chip: "bg-danger-soft text-danger", ring: "ring-danger/30" };
  if (daysLeft <= 14) return { chip: "bg-accent-soft text-accent", ring: "ring-accent/30" };
  return { chip: "glass-strong text-ink-muted", ring: "ring-transparent" };
}

export default async function CalendarioPage() {
  const [{ upcoming, past }, disciplines] = await Promise.all([getCalendar(), getDisciplines()]);
  const exams = getExams();
  const byId = new Map(disciplines.map((d) => [d.id, d]));

  const Card = ({ item, dimmed }: { item: UpcomingAssessment; dimmed?: boolean }) => {
    const { assessment, daysLeft } = item;
    const discipline = byId.get(assessment.disciplineId);
    const tone = urgency(daysLeft);
    const linked = exams.filter((exam) => assessment.examIds.includes(exam.id));

    return (
      <li
        className={cn(
          "glass rounded-3xl p-5 ring-1 sm:p-6",
          dimmed ? "opacity-60 ring-transparent" : tone.ring,
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-primary text-on-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
            {assessmentLabel(assessment)}
          </span>
          {discipline ? (
            <Link
              href={`/disciplinas/${discipline.slug}`}
              className="hover:text-primary text-sm font-medium"
            >
              {discipline.name}
            </Link>
          ) : null}
          {!dimmed ? (
            <span
              className={cn("ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold", tone.chip)}
            >
              {countdownLabel(daysLeft)}
            </span>
          ) : null}
        </div>

        <p className="font-display mt-3 text-2xl font-semibold">
          {formatAssessmentDate(assessment.date)}
        </p>

        <dl className="text-ink-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {assessment.time ? (
            <div className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" />
              <dd>{assessment.time}</dd>
            </div>
          ) : null}
          {assessment.room ? (
            <div className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              <dd>{assessment.room}</dd>
            </div>
          ) : null}
          {assessment.weight ? (
            <div>
              <dt className="inline">Vale </dt>
              <dd className="inline font-medium">{assessment.weight}</dd>
            </div>
          ) : null}
        </dl>

        {assessment.content.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-medium tracking-[0.08em] uppercase">O que cai</p>
            <ul className="text-ink-muted mt-2 space-y-1 text-sm">
              {assessment.content.map((line, i) => (
                <li key={i} className="flex gap-2 leading-relaxed">
                  <span className="text-ink-faint">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {assessment.note ? (
          <p className="text-ink-muted mt-3 text-sm leading-relaxed text-pretty">
            {assessment.note}
          </p>
        ) : null}

        {linked.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {linked.map((exam) => (
              <Link
                key={exam.id}
                href={`/simulados/${exam.slug}`}
                className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              >
                <PencilRuler className="size-4" aria-hidden="true" />
                Treinar: {exam.title.replace(/^Simulado \w+ — /, "")}
              </Link>
            ))}
          </div>
        ) : null}
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs trail={[{ label: "Início", href: "/" }, { label: "Calendário" }]} />
      <SectionHeading
        as="h1"
        title="Calendário de provas"
        description="As datas do semestre, o que cai em cada avaliação e o simulado para treinar antes dela."
      />

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="glass rounded-3xl p-6 sm:p-8">
          <CalendarDays className="text-ink-faint size-8" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold">Nenhuma data cadastrada ainda</h2>
          <p className="text-ink-muted mt-2 text-sm leading-relaxed text-pretty">
            As datas não vêm do plano de ensino e mudam ao longo do semestre, então são cadastradas
            à mão — inventar uma data seria pior que não ter nenhuma. Quem administra a biblioteca
            pode adicioná-las na área de administração.
          </p>
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <section>
          <h2 className="sr-only">Próximas provas</h2>
          <ul className="space-y-4">
            {upcoming.map((item) => (
              <Card key={item.assessment.id} item={item} />
            ))}
          </ul>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Já passaram</h2>
          <ul className="mt-4 space-y-4">
            {past.map((item) => (
              <Card key={item.assessment.id} item={item} dimmed />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
