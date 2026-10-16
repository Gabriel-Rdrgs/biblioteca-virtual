import type { Assessment } from "./assessment-types";
import type { LessonSummary } from "./summary-types";
import type { DisciplineId } from "./types";

/**
 * O calendário deixou de ser só de provas.
 *
 * Um evento é uma avaliação ou uma aula, e os dois precisam conviver na
 * mesma grade. A aula entra pelo resumo: é ele que carrega a data do
 * encontro — então o calendário vai se enchendo à medida que a turma
 * publica resumo, e nunca mostra uma aula que ninguém registrou.
 */

export type EventKind = "avaliacao" | "aula";

interface EventBase {
  readonly id: string;
  /** AAAA-MM-DD. */
  readonly date: string;
  readonly disciplineId: DisciplineId;
  readonly title: string;
  /** Negativo depois que passou; 0 no próprio dia. */
  readonly daysLeft: number;
  readonly past: boolean;
}

export interface AssessmentEvent extends EventBase {
  readonly kind: "avaliacao";
  readonly assessment: Assessment;
}

export interface LessonEvent extends EventBase {
  readonly kind: "aula";
  readonly summary: LessonSummary;
}

export type CalendarEvent = AssessmentEvent | LessonEvent;

export const isAssessmentEvent = (event: CalendarEvent): event is AssessmentEvent =>
  event.kind === "avaliacao";

/** "2026-10" — a chave que agrupa a lista e escolhe a grade. */
export const monthKey = (date: string): string => date.slice(0, 7);

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

export function monthLabel(key: string, withYear = false): string {
  const [ano, mes] = key.split("-");
  const nome = MESES[Number(mes) - 1] ?? key;
  return withYear ? `${nome} de ${ano}` : nome;
}

export const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

/**
 * Data local a partir de AAAA-MM-DD.
 *
 * `new Date("2026-10-15")` é interpretado como UTC e, a oeste de Greenwich,
 * volta um dia — o bastante para uma prova aparecer na véspera.
 */
export function localDate(date: string): Date {
  const [ano, mes, dia] = date.split("-").map(Number);
  return new Date(ano ?? 1970, (mes ?? 1) - 1, dia ?? 1);
}

export function toKey(date: Date): string {
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mes}-${dia}`;
}

/** O dia da semana por extenso, curto: "qua". */
export const weekdayOf = (date: string): string => WEEKDAYS[localDate(date).getDay()] ?? "";

/**
 * As seis semanas que a grade de um mês precisa mostrar, do domingo que
 * abre a primeira semana ao sábado que fecha a última.
 */
export function monthGrid(key: string): string[][] {
  const [ano, mes] = key.split("-").map(Number);
  const primeiro = new Date(ano ?? 1970, (mes ?? 1) - 1, 1);
  const inicio = new Date(primeiro);
  inicio.setDate(1 - primeiro.getDay());

  const semanas: string[][] = [];
  const cursor = new Date(inicio);
  for (let semana = 0; semana < 6; semana++) {
    const dias: string[] = [];
    for (let dia = 0; dia < 7; dia++) {
      dias.push(toKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(dias);
    // Seis linhas só quando o mês realmente precisa delas.
    if (semana >= 4 && cursor.getMonth() !== (mes ?? 1) - 1) break;
  }
  return semanas;
}

/** Agrupa por mês, preservando a ordem cronológica. */
export function groupByMonth(events: readonly CalendarEvent[]): [string, CalendarEvent[]][] {
  const mapa = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = monthKey(event.date);
    const lista = mapa.get(key);
    if (lista) lista.push(event);
    else mapa.set(key, [event]);
  }
  return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/** Os próximos sete dias, contando a partir de hoje. */
export function withinNextDays(event: CalendarEvent, days: number): boolean {
  return !event.past && event.daysLeft <= days;
}
