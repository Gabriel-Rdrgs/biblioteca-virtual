"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CalendarRange, Download, List } from "lucide-react";
import {
  groupByMonth,
  monthKey,
  monthLabel,
  withinNextDays,
  type CalendarEvent,
} from "@/lib/domain/calendar-types";
import { Badge, ButtonAnchor, EmptyState, ToggleChip } from "@/components/ui/primitives";
import { EventItem, type EventLinks } from "./event-item";
import { MonthGrid } from "./month-grid";
import { cn } from "@/lib/utils";

/**
 * O calendário inteiro, com as vistas que ele precisava ter.
 *
 * Antes era uma lista corrida de 35 cartões altos, sem mês, sem filtro e
 * sem jeito de ver a semana. Agora:
 *
 * - **próximos 7 dias** fixo no topo, porque é a pergunta mais frequente;
 * - **mês em grade**, a única vista que mostra aglomeração;
 * - **lista por mês**, para ler o que cai em cada avaliação;
 * - **filtro por matéria**, sem o qual sete disciplinas viram ruído.
 *
 * O estado é todo do cliente: trocar de vista ou filtrar não devia custar
 * uma ida ao servidor.
 */

export interface DisciplineChip {
  readonly id: string;
  readonly shortName: string;
  readonly color: string;
}

type Vista = "mes" | "lista";

export function CalendarViews({
  eventos,
  disciplinas,
  links,
  eixosPorAvaliacao,
  hoje,
}: {
  readonly eventos: readonly CalendarEvent[];
  readonly disciplinas: readonly DisciplineChip[];
  readonly links: Readonly<Record<string, EventLinks>>;
  readonly eixosPorAvaliacao: Readonly<Record<string, readonly string[]>>;
  readonly hoje: string;
}) {
  const [vista, setVista] = useState<Vista>("lista");
  const [materias, setMaterias] = useState<readonly string[]>([]);
  const [mes, setMes] = useState(() => monthKey(hoje));
  const [dia, setDia] = useState<string | null>(null);
  const [mostrarPassado, setMostrarPassado] = useState(false);

  const cores = useMemo(
    () => new Map(disciplinas.map((d) => [d.id, d.color] as const)),
    [disciplinas],
  );
  const nomes = useMemo(
    () => new Map(disciplinas.map((d) => [d.id, d.shortName] as const)),
    [disciplinas],
  );

  const filtrados = useMemo(
    () =>
      materias.length === 0
        ? eventos
        : eventos.filter((evento) => materias.includes(evento.disciplineId)),
    [eventos, materias],
  );

  const futuros = filtrados.filter((evento) => !evento.past);
  const passados = filtrados.filter((evento) => evento.past);
  const proximos = futuros.filter((evento) => withinNextDays(evento, 7));

  const semFiltro = materias.length === 0;
  const vazio = {
    exams: [] as EventLinks["exams"],
    summaries: [] as EventLinks["summaries"],
  };

  const item = (evento: CalendarEvent, compact?: boolean) => (
    <EventItem
      key={`${evento.kind}-${evento.id}`}
      event={evento}
      color={cores.get(evento.disciplineId) ?? "var(--primary)"}
      disciplineName={nomes.get(evento.disciplineId) ?? ""}
      links={links[evento.id] ?? vazio}
      axisIds={evento.kind === "avaliacao" ? (eixosPorAvaliacao[evento.id] ?? []) : []}
      {...(compact ? { compact: true } : {})}
    />
  );

  const doDia = dia ? filtrados.filter((evento) => evento.date === dia) : [];

  return (
    <div>
      {/* ------------------------------------------------- próximos 7 dias */}
      <section aria-labelledby="proximos-7" className="mb-6">
        <h2 id="proximos-7" className="text-ink-faint text-micro mb-2 tracking-[0.12em] uppercase">
          Próximos 7 dias
        </h2>
        {proximos.length === 0 ? (
          <p className="glass rounded-panel text-ink-muted p-4 text-sm">
            Nada nos próximos sete dias.{" "}
            {futuros[0] ? (
              <>
                O próximo é {futuros[0].title} em {monthLabel(monthKey(futuros[0].date))}.
              </>
            ) : null}
          </p>
        ) : (
          <ul className="space-y-2">{proximos.map((evento) => item(evento, true))}</ul>
        )}
      </section>

      {/* --------------------------------------------------------- controles */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Como ver o calendário"
          className="glass inline-flex rounded-full p-0.5"
        >
          {(
            [
              ["lista", "Lista", List],
              ["mes", "Mês", CalendarRange],
            ] as const
          ).map(([valor, rotulo, Icone]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={vista === valor}
              onClick={() => setVista(valor)}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                vista === valor ? "bg-primary text-on-primary" : "text-ink-muted hover:text-ink",
              )}
            >
              <Icone className="size-4" aria-hidden="true" />
              {rotulo}
            </button>
          ))}
        </div>

        <ButtonAnchor
          href="/api/calendario"
          variant="secundario"
          size="sm"
          className="ml-auto"
          download="atlas-calendario.ics"
        >
          <Download className="size-4" aria-hidden="true" />
          Exportar
        </ButtonAnchor>
      </div>

      {/* ----------------------------------------------------------- filtro */}
      <div className="mb-6 flex flex-wrap gap-2">
        <ToggleChip pressed={semFiltro} onClick={() => setMaterias([])}>
          Todas
        </ToggleChip>
        {disciplinas.map((disciplina) => {
          const ligada = materias.includes(disciplina.id);
          return (
            <ToggleChip
              key={disciplina.id}
              pressed={ligada}
              onClick={() =>
                setMaterias((atual) =>
                  atual.includes(disciplina.id)
                    ? atual.filter((id) => id !== disciplina.id)
                    : [...atual, disciplina.id],
                )
              }
              className="gap-2"
            >
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: disciplina.color }}
                />
                {disciplina.shortName}
              </span>
            </ToggleChip>
          );
        })}
      </div>

      {/* ------------------------------------------------------------ vistas */}
      {vista === "mes" ? (
        <div>
          <MonthGrid
            mes={mes}
            eventos={filtrados}
            cores={cores}
            hoje={hoje}
            diaSelecionado={dia}
            onMes={(novo) => {
              setMes(novo);
              setDia(null);
            }}
            onDia={(novo) => setDia(novo === dia ? null : novo)}
          />
          {dia ? (
            <div className="mt-5">
              <h3 className="text-ink-faint text-micro mb-2 tracking-[0.12em] uppercase">
                {dia === hoje ? "Hoje" : "Neste dia"}
              </h3>
              {doDia.length === 0 ? (
                <p className="glass rounded-panel text-ink-muted p-4 text-sm">
                  Nada marcado neste dia.
                </p>
              ) : (
                <ul className="space-y-3">{doDia.map((evento) => item(evento))}</ul>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-10">
          {futuros.length === 0 ? (
            <EmptyState
              title="Nada à frente por aqui"
              description={
                semFiltro
                  ? "Todas as datas do semestre já passaram."
                  : "Nenhuma data futura nesta matéria. Tire o filtro para ver as outras."
              }
              icon={CalendarDays}
            />
          ) : null}

          {groupByMonth(futuros).map(([chave, doMes]) => (
            <section key={chave} aria-labelledby={`mes-${chave}`}>
              <div className="mb-3 flex items-baseline gap-3">
                <h2 id={`mes-${chave}`} className="font-display text-lg font-semibold">
                  {monthLabel(chave, true)}
                </h2>
                <span className="border-line h-px flex-1 border-t" aria-hidden="true" />
                <Badge tom="neutro">{doMes.length}</Badge>
              </div>
              <ul className="space-y-3">{doMes.map((evento) => item(evento))}</ul>
            </section>
          ))}

          {passados.length > 0 ? (
            <section>
              <button
                type="button"
                onClick={() => setMostrarPassado((v) => !v)}
                aria-expanded={mostrarPassado}
                className="text-ink-muted hover:text-ink min-h-11 text-sm font-medium"
              >
                {mostrarPassado ? "Esconder" : "Mostrar"} o que já passou ({passados.length})
              </button>
              {mostrarPassado ? (
                <ul className="mt-3 space-y-3">
                  {[...passados].reverse().map((evento) => item(evento))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
