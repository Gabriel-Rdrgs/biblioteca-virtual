"use client";

import { BookOpen, CalendarPlus, Clock, MapPin, PencilRuler } from "lucide-react";
import { countdownLabel, formatAssessmentDate, isExam } from "@/lib/domain/assessment-types";
import { isAssessmentEvent, weekdayOf, type CalendarEvent } from "@/lib/domain/calendar-types";
import { localDate } from "@/lib/domain/calendar-types";
import { Badge, ButtonAnchor, ButtonLink } from "@/components/ui/primitives";
import { GradeInput } from "./grade-input";
import { ProgressHint } from "./progress-hint";
import { cn } from "@/lib/utils";

/**
 * Um evento do calendário, em linha.
 *
 * O cartão antigo era um bloco alto por avaliação: 35 deles em fila davam
 * uma rolagem que ninguém percorria. Aqui a data vira uma coluna estreita à
 * esquerda e o conteúdo ocupa o resto, de modo que uma tela mostre vários
 * eventos em vez de um e meio.
 */

export interface EventLinks {
  readonly exams: readonly { readonly slug: string; readonly title: string }[];
  readonly summaries: readonly { readonly slug: string; readonly label: string }[];
}

export function EventItem({
  event,
  color,
  disciplineName,
  links,
  axisIds,
  compact,
}: {
  readonly event: CalendarEvent;
  readonly color: string;
  readonly disciplineName: string;
  readonly links: EventLinks;
  readonly axisIds: readonly string[];
  /** Sem ações nem detalhe — para a tira dos próximos dias. */
  readonly compact?: boolean;
}) {
  const avaliacao = isAssessmentEvent(event) ? event.assessment : null;
  const prova = avaliacao ? isExam(avaliacao) : false;
  const urgente = prova && !event.past && event.daysLeft <= 7;
  const dia = localDate(event.date).getDate();

  /**
   * A tira dos próximos dias é um lembrete, não um cartão: em uma linha,
   * para que sete dias caibam numa olhada em vez de meia tela.
   */
  if (compact) {
    return (
      <li
        className={cn(
          "glass rounded-panel relative flex min-h-11 items-center gap-3 overflow-hidden py-2 pr-3 pl-4",
          urgente && "ring-danger/30 ring-2",
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: color }}
        />
        <span className="text-ink-muted w-14 shrink-0 text-xs tabular-nums">
          {weekdayOf(event.date)} {dia}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{event.title}</span>
        <span className="text-ink-faint hidden shrink-0 text-xs sm:inline">{disciplineName}</span>
        <Badge tom={urgente ? "perigo" : "neutro"}>{countdownLabel(event.daysLeft)}</Badge>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "glass rounded-panel relative flex gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4",
        event.past && "opacity-60",
        urgente && "ring-danger/30 ring-2",
      )}
    >
      {/* A cor da matéria, na borda — é o que deixa varrer a lista com o olho. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: color }}
      />

      <div className="w-10 shrink-0 pl-1 text-center">
        <p className="text-ink-faint text-micro uppercase">{weekdayOf(event.date)}</p>
        <p className="font-display text-2xl leading-none font-semibold tabular-nums">{dia}</p>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="leading-snug font-semibold">{event.title}</h3>
          {!event.past ? (
            <Badge tom={urgente ? "perigo" : "neutro"}>{countdownLabel(event.daysLeft)}</Badge>
          ) : null}
        </div>

        <p className="text-ink-muted mt-0.5 text-sm">
          {disciplineName}
          {avaliacao?.weight ? (
            <span className="text-ink-faint"> · vale {avaliacao.weight}</span>
          ) : null}
        </p>

        {avaliacao && (avaliacao.time || avaliacao.room) ? (
          <p className="text-ink-faint mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {avaliacao.time ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden="true" />
                {avaliacao.time}
              </span>
            ) : null}
            {avaliacao.room ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {avaliacao.room}
              </span>
            ) : null}
          </p>
        ) : null}

        {/*
          Quem estudou para a data antiga precisa ver que ela mudou, e qual
          era — some a data original e o aviso vira só um susto.
        */}
        {avaliacao?.originalDate ? (
          <p className="text-accent mt-1.5 text-xs leading-relaxed">
            <span className="font-semibold">Data alterada.</span> O plano previa{" "}
            {formatAssessmentDate(avaliacao.originalDate)}. {avaliacao.revision ?? ""}
          </p>
        ) : null}

        {(avaliacao?.content.length ?? 0) > 0 || !isAssessmentEvent(event) ? (
          <ul className="text-ink-muted mt-2 space-y-1 text-sm leading-relaxed">
            {(isAssessmentEvent(event) ? event.assessment.content : event.summary.topics).map(
              (linha) => (
                <li key={linha} className="flex gap-2">
                  <span className="text-ink-faint mt-2 size-1 shrink-0 rounded-full bg-current" />
                  <span className="text-pretty">{linha}</span>
                </li>
              ),
            )}
          </ul>
        ) : null}

        {avaliacao?.note ? (
          <p className="text-ink-muted mt-2 text-sm leading-relaxed text-pretty">
            {avaliacao.note}
          </p>
        ) : null}

        {axisIds.length > 0 && !event.past ? (
          <ProgressHint axisIds={axisIds} daysLeft={event.daysLeft} />
        ) : null}

        {links.exams.length > 0 || links.summaries.length > 0 || !event.past ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {links.exams.map((exam, i) => {
              const curto = exam.title.replace(/^Simulado \w+ — /, "");
              return (
                <ButtonLink
                  key={exam.slug}
                  href={`/simulados/${exam.slug}`}
                  size="sm"
                  // Com vários simulados, um é a ação e os outros são opções:
                  // três botões cheios empilhados viram uma parede de cor.
                  variant={i === 0 ? "primario" : "secundario"}
                  // Vários "Treinar" na mesma página não dizem nada a quem
                  // navega por lista de links; o rótulo acessível diz qual é.
                  aria-label={`Treinar: ${curto}`}
                >
                  <PencilRuler className="size-4" aria-hidden="true" />
                  {links.exams.length > 1 ? curto : "Treinar"}
                </ButtonLink>
              );
            })}
            {links.summaries.map((summary) => (
              <ButtonLink
                key={summary.slug}
                href={`/resumos/${summary.slug}`}
                variant="secundario"
                size="sm"
              >
                <BookOpen className="size-4" aria-hidden="true" />
                {summary.label}
              </ButtonLink>
            ))}

            {/*
              Quase sempre se quer uma data só na agenda, não o semestre
              inteiro — o arquivo completo continua no topo da página.
            */}
            {!event.past ? (
              <ButtonAnchor
                href={`/api/calendario?evento=${encodeURIComponent(event.id)}`}
                download={`atlas-${event.id}.ics`}
                variant="fantasma"
                size="sm"
                aria-label={`Adicionar ${event.title} à minha agenda`}
              >
                <CalendarPlus className="size-4" aria-hidden="true" />
                Agenda
              </ButtonAnchor>
            ) : null}
          </div>
        ) : null}

        {/* A nota só existe depois da prova — antes não há o que anotar. */}
        {avaliacao && event.past ? (
          <GradeInput assessmentId={avaliacao.id} disciplineName={disciplineName} />
        ) : null}

        {avaliacao?.source ? (
          <p className="text-ink-faint mt-2.5 text-xs">{avaliacao.source}</p>
        ) : null}
      </div>
    </li>
  );
}
