"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  Download,
  GraduationCap,
  List,
  Search,
  X,
} from "lucide-react";
import {
  groupByMonth,
  isAssessmentEvent,
  monthKey,
  monthLabel,
  withinNextDays,
  type CalendarEvent,
} from "@/lib/domain/calendar-types";
import { normalizeText } from "@/lib/domain/normalize";
import {
  Badge,
  ButtonAnchor,
  EmptyState,
  IconButton,
  ToggleChip,
} from "@/components/ui/primitives";
import { GradePanel } from "@/components/grades/grade-panel";
import { EventItem, type EventLinks } from "./event-item";
import { MonthGrid } from "./month-grid";
import { cn } from "@/lib/utils";

/**
 * O calendário inteiro, com as vistas que ele precisava ter.
 *
 * - **próximos 7 dias** abre a página, porque é a pergunta mais frequente;
 * - **mês em grade**, a única vista que mostra aglomeração;
 * - **lista por mês**, para ler o que cai em cada avaliação;
 * - **notas**, porque "o que vem" e "onde estou" são a mesma pergunta vista
 *   de dois lados, e a resposta estava escondida nos cartões do que já
 *   passou — atrás de um botão que ninguém abre;
 * - **filtro por matéria e busca**, sem os quais 35 datas viram ruído.
 *
 * Na lista, o que está nos próximos sete dias sai dos meses abaixo: antes o
 * mesmo evento aparecia duas vezes na mesma tela, uma como lembrete e outra
 * como cartão, e isso lia como repetição, não como ênfase.
 *
 * O estado é todo do cliente: trocar de vista, buscar ou filtrar não devia
 * custar uma ida ao servidor.
 */

export interface DisciplineChip {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly color: string;
  readonly slug: string;
}

type Vista = "mes" | "lista" | "notas";

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
  const [busca, setBusca] = useState("");
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
  const nomesLongos = useMemo(
    () => new Map(disciplinas.map((d) => [d.id, d.name] as const)),
    [disciplinas],
  );

  /** Título, matéria e o que cai — tudo sem acento e sem maiúscula. */
  const textoDe = useMemo(() => {
    const cache = new Map<string, string>();
    return (evento: CalendarEvent) => {
      const pronto = cache.get(evento.id);
      if (pronto) return pronto;
      const partes = [evento.title, nomes.get(evento.disciplineId) ?? ""];
      if (isAssessmentEvent(evento)) partes.push(...evento.assessment.content);
      else partes.push(...evento.summary.topics);
      const texto = normalizeText(partes.join(" "));
      cache.set(evento.id, texto);
      return texto;
    };
  }, [nomes]);

  const filtrados = useMemo(() => {
    const termos = normalizeText(busca).split(/\s+/).filter(Boolean);
    return eventos.filter((evento) => {
      if (materias.length > 0 && !materias.includes(evento.disciplineId)) return false;
      if (termos.length === 0) return true;
      const texto = textoDe(evento);
      return termos.every((termo) => texto.includes(termo));
    });
  }, [eventos, materias, busca, textoDe]);

  const futuros = filtrados.filter((evento) => !evento.past);
  const passados = filtrados.filter((evento) => evento.past);
  const estaSemana = futuros.filter((evento) => withinNextDays(evento, 7));
  const naSemana = new Set(estaSemana.map((evento) => evento.id));
  const adiante = futuros.filter((evento) => !naSemana.has(evento.id));

  const semFiltro = materias.length === 0 && busca.trim() === "";
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
      disciplineFullName={nomesLongos.get(evento.disciplineId) ?? ""}
      links={links[evento.id] ?? vazio}
      axisIds={evento.kind === "avaliacao" ? (eixosPorAvaliacao[evento.id] ?? []) : []}
      {...(compact ? { compact: true } : {})}
    />
  );

  const doDia = dia ? filtrados.filter((evento) => evento.date === dia) : [];

  return (
    <div>
      {/* --------------------------------------------------------- controles */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Como ver o calendário"
          className="glass inline-flex rounded-full p-0.5"
        >
          {(
            [
              ["lista", "Lista", List],
              ["mes", "Mês", CalendarRange],
              ["notas", "Notas", GraduationCap],
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

        {vista === "notas" ? null : (
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
        )}
      </div>

      {/* ------------------------------------------------------------ busca */}
      {/* Nas notas não há o que buscar: são sete matérias, todas na tela. */}
      <div className={cn("glass relative mb-3 rounded-full", vista === "notas" && "hidden")}>
        <label htmlFor="busca-calendario" className="sr-only">
          Buscar no calendário
        </label>
        <Search
          className="text-ink-faint pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          id="busca-calendario"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar uma data…"
          className="placeholder:text-ink-faint min-h-11 w-full rounded-full bg-transparent py-2 pr-11 pl-11 text-sm outline-none"
        />
        {busca ? (
          <IconButton
            label="Limpar a busca"
            size="sm"
            className="absolute top-1/2 right-1 -translate-y-1/2"
            onClick={() => setBusca("")}
          >
            <X className="size-4" aria-hidden="true" />
          </IconButton>
        ) : null}
      </div>

      {/* ----------------------------------------------------------- filtro */}
      <div className="mb-6 flex flex-wrap gap-2">
        <ToggleChip pressed={materias.length === 0} onClick={() => setMaterias([])}>
          Todas
        </ToggleChip>
        {disciplinas.map((disciplina) => (
          <ToggleChip
            key={disciplina.id}
            pressed={materias.includes(disciplina.id)}
            onClick={() =>
              setMaterias((atual) =>
                atual.includes(disciplina.id)
                  ? atual.filter((id) => id !== disciplina.id)
                  : [...atual, disciplina.id],
              )
            }
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
        ))}
      </div>

      {/* ------------------------------------------------------------ vistas */}
      {vista === "notas" ? (
        <GradePanel
          disciplinas={
            materias.length === 0
              ? disciplinas
              : disciplinas.filter((disciplina) => materias.includes(disciplina.id))
          }
        />
      ) : vista === "mes" ? (
        <div className="space-y-6">
          {estaSemana.length > 0 ? (
            <section aria-labelledby="semana-mes">
              <h2
                id="semana-mes"
                className="text-ink-faint text-micro mb-2 tracking-[0.12em] uppercase"
              >
                Próximos 7 dias
              </h2>
              <ul className="space-y-2">{estaSemana.map((evento) => item(evento, true))}</ul>
            </section>
          ) : null}

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
            <div>
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
              title={busca.trim() ? "Nada com esse termo" : "Nada à frente por aqui"}
              description={
                busca.trim()
                  ? "Tente outra palavra, ou limpe a busca. Acentos e maiúsculas não importam."
                  : semFiltro
                    ? "Todas as datas do semestre já passaram."
                    : "Nenhuma data futura nesta matéria. Tire o filtro para ver as outras."
              }
              icon={CalendarDays}
            />
          ) : null}

          {estaSemana.length > 0 ? (
            <section aria-labelledby="esta-semana">
              <div className="mb-3 flex items-baseline gap-3">
                <h2 id="esta-semana" className="font-display text-primary text-lg font-semibold">
                  Próximos 7 dias
                </h2>
                <span className="border-line h-px flex-1 border-t" aria-hidden="true" />
                <Badge tom="primario">{estaSemana.length}</Badge>
              </div>
              <ul className="space-y-3">{estaSemana.map((evento) => item(evento))}</ul>
            </section>
          ) : null}

          {groupByMonth(adiante).map(([chave, doMes]) => (
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
