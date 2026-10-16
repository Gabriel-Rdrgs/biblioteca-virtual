"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/primitives";
import {
  WEEKDAYS,
  localDate,
  monthGrid,
  monthKey,
  monthLabel,
  type CalendarEvent,
} from "@/lib/domain/calendar-types";
import { cn } from "@/lib/utils";

/**
 * O mês em grade.
 *
 * É a única vista em que dá para ver aglomeração: três provas na mesma
 * semana saltam aos olhos, e isso não aparece em lista nenhuma. Cada evento
 * é uma barra na cor da matéria — barra e não bolinha, porque uma barra
 * cabe um rótulo e uma bolinha não diz de que matéria é.
 *
 * É uma `<table>` de verdade, com cabeçalho de coluna e uma linha por
 * semana. Um mês é uma tabela: fingir que é uma grade ARIA dá mais trabalho
 * e informa menos a quem usa leitor de tela.
 */
export function MonthGrid({
  mes,
  eventos,
  cores,
  hoje,
  diaSelecionado,
  onMes,
  onDia,
}: {
  readonly mes: string;
  readonly eventos: readonly CalendarEvent[];
  readonly cores: ReadonlyMap<string, string>;
  readonly hoje: string;
  readonly diaSelecionado: string | null;
  readonly onMes: (mes: string) => void;
  readonly onDia: (dia: string) => void;
}) {
  const semanas = monthGrid(mes);
  const porDia = new Map<string, CalendarEvent[]>();
  for (const evento of eventos) {
    const lista = porDia.get(evento.date);
    if (lista) lista.push(evento);
    else porDia.set(evento.date, [evento]);
  }

  const desloca = (passo: number) => {
    const [ano, m] = mes.split("-").map(Number);
    const d = new Date(ano ?? 1970, (m ?? 1) - 1 + passo, 1);
    onMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <IconButton label="Mês anterior" size="sm" onClick={() => desloca(-1)}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </IconButton>
        <h2 aria-live="polite" className="font-display text-lg font-semibold">
          {monthLabel(mes, true)}
        </h2>
        <IconButton label="Próximo mês" size="sm" onClick={() => desloca(1)}>
          <ChevronRight className="size-4" aria-hidden="true" />
        </IconButton>
      </div>

      <table className="w-full table-fixed border-separate border-spacing-0.5">
        <caption className="sr-only">
          Avaliações e aulas de {monthLabel(mes, true)}. Escolha um dia para ver o que há nele.
        </caption>
        <thead>
          <tr>
            {WEEKDAYS.map((dia) => (
              <th
                key={dia}
                scope="col"
                className="text-ink-faint text-micro pb-1 font-normal uppercase"
              >
                {dia}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana) => (
            <tr key={semana[0]}>
              {semana.map((dia) => {
                const doMes = monthKey(dia) === mes;
                const doDia = porDia.get(dia) ?? [];
                const ehHoje = dia === hoje;
                const selecionado = dia === diaSelecionado;
                const numero = localDate(dia).getDate();

                return (
                  <td key={dia} className="p-0 align-top">
                    <button
                      type="button"
                      aria-pressed={selecionado}
                      aria-label={`${numero} de ${monthLabel(monthKey(dia))}${
                        ehHoje ? ", hoje" : ""
                      } — ${
                        doDia.length === 0
                          ? "nada marcado"
                          : doDia.map((evento) => evento.title).join(", ")
                      }`}
                      onClick={() => onDia(dia)}
                      className={cn(
                        "rounded-control flex min-h-16 w-full flex-col items-stretch gap-1 p-1 text-left transition-colors sm:min-h-20",
                        doMes ? "hover:glass-strong" : "opacity-35",
                        selecionado && "glass-strong ring-primary ring-2",
                      )}
                    >
                      <span
                        className={cn(
                          "mx-auto grid size-6 shrink-0 place-items-center rounded-full text-xs tabular-nums",
                          ehHoje ? "bg-primary text-on-primary font-semibold" : "text-ink-muted",
                        )}
                      >
                        {numero}
                      </span>

                      {/*
                        No celular a célula tem uns 50px: um rótulo ali vira
                        "N1 …" e não informa nada. Ponto colorido abaixo de
                        sm, barra com nome a partir daí.
                      */}
                      <span className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                        {doDia.slice(0, 4).map((evento) => (
                          <span
                            key={evento.id}
                            className="size-1.5 rounded-full"
                            style={{
                              backgroundColor: cores.get(evento.disciplineId) ?? "var(--primary)",
                            }}
                          />
                        ))}
                      </span>

                      <span className="hidden min-h-0 flex-col gap-0.5 overflow-hidden sm:flex">
                        {doDia.slice(0, 2).map((evento) => (
                          <span
                            key={evento.id}
                            className="text-micro truncate rounded-[3px] px-1 py-0.5 leading-tight text-white"
                            style={{
                              backgroundColor: cores.get(evento.disciplineId) ?? "var(--primary)",
                            }}
                          >
                            {evento.title}
                          </span>
                        ))}
                        {doDia.length > 2 ? (
                          <span className="text-ink-faint text-micro px-1">
                            +{doDia.length - 2}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
