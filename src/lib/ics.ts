import type { CalendarEvent } from "@/lib/domain/calendar-types";
import { isAssessmentEvent } from "@/lib/domain/calendar-types";

/**
 * O calendário da turma como arquivo .ics.
 *
 * Datas de prova são dia inteiro, sem hora: ninguém precisa de um alarme às
 * 00h00. Quando o plano informa horário, ele entra na descrição, porque
 * `VALUE=DATE` não comporta hora e inventar um horário seria pior que não
 * ter.
 *
 * O UID é estável e derivado do id do evento, então reimportar o arquivo
 * atualiza o que já existe em vez de duplicar.
 */

const ESCAPAR = /([,;\\])/g;

function texto(valor: string): string {
  return valor.replace(ESCAPAR, "\\$1").replace(/\r?\n/g, "\\n");
}

/** Quebra em 75 octetos, como o RFC pede; sem isso, alguns apps ignoram a linha. */
function dobrar(linha: string): string {
  if (linha.length <= 75) return linha;
  const partes: string[] = [linha.slice(0, 75)];
  let resto = linha.slice(75);
  while (resto.length > 74) {
    partes.push(` ${resto.slice(0, 74)}`);
    resto = resto.slice(74);
  }
  if (resto) partes.push(` ${resto}`);
  return partes.join("\r\n");
}

const semTraco = (date: string) => date.replace(/-/g, "");

/** O dia seguinte: DTEND de um evento de dia inteiro é exclusivo. */
function diaSeguinte(date: string): string {
  const [ano, mes, dia] = date.split("-").map(Number);
  const d = new Date(ano ?? 1970, (mes ?? 1) - 1, (dia ?? 1) + 1);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}${m}${dd}`;
}

export function buildIcs(
  events: readonly CalendarEvent[],
  options: { readonly disciplineNames: ReadonlyMap<string, string>; readonly now?: Date } = {
    disciplineNames: new Map(),
  },
): string {
  const carimbo = `${(options.now ?? new Date()).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

  const linhas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Atlas//Biblioteca Medica//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Atlas — Medicina 1º período",
    "X-WR-TIMEZONE:America/Sao_Paulo",
  ];

  for (const event of events) {
    const materia = options.disciplineNames.get(event.disciplineId) ?? "";
    const resumo = materia ? `${event.title} · ${materia}` : event.title;

    const descricao: string[] = [];
    if (isAssessmentEvent(event)) {
      const { assessment } = event;
      if (assessment.time) descricao.push(`Horário: ${assessment.time}`);
      if (assessment.room) descricao.push(`Local: ${assessment.room}`);
      if (assessment.weight) descricao.push(`Vale ${assessment.weight}`);
      descricao.push(...assessment.content);
      if (assessment.note) descricao.push(assessment.note);
    } else {
      descricao.push(...event.summary.topics);
    }

    linhas.push(
      "BEGIN:VEVENT",
      `UID:${event.kind}-${event.id}@atlas`,
      `DTSTAMP:${carimbo}`,
      `DTSTART;VALUE=DATE:${semTraco(event.date)}`,
      `DTEND;VALUE=DATE:${diaSeguinte(event.date)}`,
      dobrar(`SUMMARY:${texto(resumo)}`),
      ...(descricao.length > 0 ? [dobrar(`DESCRIPTION:${texto(descricao.join("\n"))}`)] : []),
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }

  linhas.push("END:VCALENDAR");
  return `${linhas.join("\r\n")}\r\n`;
}
