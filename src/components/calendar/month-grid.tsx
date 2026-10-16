"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, IconButton } from "@/components/ui/primitives";
import { isAssessmentEvent } from "@/lib/domain/calendar-types";
import { isExam } from "@/lib/domain/assessment-types";
import {
  WEEKDAYS,
  localDate,
  monthGrid,
  monthKey,
  monthLabel,
  toKey,
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
 *
 * O teclado anda pela grade como num calendário de verdade (setas, Home,
 * End, PageUp/PageDown), com um só dia tabulável por vez — antes era
 * preciso apertar Tab 35 vezes para atravessar um mês.
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

  /** O dia que recebe o Tab: o escolhido, ou hoje, ou o primeiro do mês. */
  const [foco, setFoco] = useState<string>(
    () => diaSelecionado ?? (monthKey(hoje) === mes ? hoje : `${mes}-01`),
  );
  const mover = useRef(false);
  const celulas = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!mover.current) return;
    mover.current = false;
    celulas.current.get(foco)?.focus();
  }, [foco]);

  const desloca = (passo: number) => {
    const [ano, m] = mes.split("-").map(Number);
    const d = new Date(ano ?? 1970, (m ?? 1) - 1 + passo, 1);
    onMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  /** Anda `dias` a partir do foco, trocando de mês se sair dele. */
  const andar = (dias: number) => {
    const d = localDate(foco);
    d.setDate(d.getDate() + dias);
    const destino = toKey(d);
    mover.current = true;
    setFoco(destino);
    if (monthKey(destino) !== mes) onMes(monthKey(destino));
  };

  const noTeclado = (evento: React.KeyboardEvent) => {
    const acoes: Record<string, () => void> = {
      ArrowRight: () => andar(1),
      ArrowLeft: () => andar(-1),
      ArrowDown: () => andar(7),
      ArrowUp: () => andar(-7),
      Home: () => andar(-localDate(foco).getDay()),
      End: () => andar(6 - localDate(foco).getDay()),
      PageDown: () => desloca(1),
      PageUp: () => desloca(-1),
    };
    const acao = acoes[evento.key];
    if (!acao) return;
    evento.preventDefault();
    acao();
  };

  const ehProva = (evento: CalendarEvent) => isAssessmentEvent(evento) && isExam(evento.assessment);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <IconButton label="Mês anterior" size="sm" onClick={() => desloca(-1)}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </IconButton>
        <div className="flex items-center gap-2">
          <h2 aria-live="polite" className="font-display text-lg font-semibold">
            {monthLabel(mes, true)}
          </h2>
          {monthKey(hoje) !== mes ? (
            <Button
              variant="fantasma"
              size="sm"
              onClick={() => {
                onMes(monthKey(hoje));
                setFoco(hoje);
              }}
            >
              Hoje
            </Button>
          ) : null}
        </div>
        <IconButton label="Próximo mês" size="sm" onClick={() => desloca(1)}>
          <ChevronRight className="size-4" aria-hidden="true" />
        </IconButton>
      </div>

      <table className="w-full table-fixed border-separate border-spacing-0.5">
        <caption className="sr-only">
          Avaliações e aulas de {monthLabel(mes, true)}. Use as setas para andar pelos dias e Enter
          para ver o que há num dia.
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
          {semanas.map((semana) => {
            // Uma semana pesada é o que o olho procura na grade.
            const provasNaSemana = semana.reduce(
              (soma, dia) => soma + (porDia.get(dia) ?? []).filter(ehProva).length,
              0,
            );
            return (
              <tr key={semana[0]} className={cn(provasNaSemana >= 3 && "bg-accent-soft/40")}>
                {semana.map((dia) => {
                  const doMes = monthKey(dia) === mes;
                  const doDia = porDia.get(dia) ?? [];
                  const provas = doDia.filter(ehProva).length;
                  const ehHoje = dia === hoje;
                  const selecionado = dia === diaSelecionado;
                  const numero = localDate(dia).getDate();

                  return (
                    <td key={dia} className="p-0 align-top">
                      <button
                        type="button"
                        ref={(el) => {
                          if (el) celulas.current.set(dia, el);
                          else celulas.current.delete(dia);
                        }}
                        tabIndex={dia === foco ? 0 : -1}
                        onKeyDown={noTeclado}
                        aria-pressed={selecionado}
                        aria-label={`${numero} de ${monthLabel(monthKey(dia))}${
                          ehHoje ? ", hoje" : ""
                        } — ${
                          doDia.length === 0
                            ? "nada marcado"
                            : doDia.map((evento) => evento.title).join(", ")
                        }`}
                        onClick={() => {
                          setFoco(dia);
                          onDia(dia);
                        }}
                        className={cn(
                          "rounded-control flex min-h-16 w-full flex-col items-stretch gap-1 p-1 text-left transition-colors sm:min-h-20",
                          doMes ? "hover:glass-strong" : "opacity-35",
                          selecionado && "glass-strong ring-primary ring-2",
                        )}
                      >
                        {/*
                          Duas provas no mesmo dia é informação, não detalhe —
                          mas o aviso fica no canto para não empurrar o número
                          do dia para fora do centro.
                        */}
                        <span className="relative flex items-center justify-center">
                          {provas > 1 ? (
                            <AlertTriangle
                              className="text-danger absolute top-0 right-0 size-3"
                              aria-hidden="true"
                            />
                          ) : null}
                          <span
                            className={cn(
                              "grid size-6 shrink-0 place-items-center rounded-full text-xs tabular-nums",
                              ehHoje
                                ? "bg-primary text-on-primary font-semibold"
                                : "text-ink-muted",
                            )}
                          >
                            {numero}
                          </span>
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
            );
          })}
        </tbody>
      </table>

      <p className="text-ink-faint mt-2 text-xs">
        Semana sombreada: três ou mais provas.{" "}
        <AlertTriangle className="inline size-3" aria-hidden="true" /> marca duas no mesmo dia.
      </p>
    </div>
  );
}
