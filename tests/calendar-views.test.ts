import { describe, expect, it } from "vitest";
import {
  groupByMonth,
  localDate,
  monthGrid,
  monthKey,
  monthLabel,
  toKey,
  weekdayOf,
  withinNextDays,
  type CalendarEvent,
} from "@/lib/domain/calendar-types";
import { buildIcs } from "@/lib/ics";

const evento = (date: string, extra: Partial<CalendarEvent> = {}): CalendarEvent =>
  ({
    kind: "avaliacao",
    id: `e-${date}`,
    date,
    disciplineId: "mac-1",
    title: "N1",
    daysLeft: 1,
    past: false,
    assessment: {
      id: `e-${date}`,
      disciplineId: "mac-1",
      kind: "N1",
      date,
      content: [],
      examIds: [],
      semester: "2026.2",
      visibility: "visivel",
      origin: "seed",
    },
    ...extra,
  }) as CalendarEvent;

describe("as datas do calendário", () => {
  it("lê AAAA-MM-DD no fuso local, e não em UTC", () => {
    // `new Date("2026-10-15")` é UTC: a oeste de Greenwich volta um dia, e a
    // prova apareceria na véspera.
    const d = localDate("2026-10-15");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(15);
    expect(toKey(d)).toBe("2026-10-15");
  });

  it("nomeia o mês e o dia da semana em português", () => {
    expect(monthKey("2026-10-15")).toBe("2026-10");
    expect(monthLabel("2026-10")).toBe("outubro");
    expect(monthLabel("2026-10", true)).toBe("outubro de 2026");
    // 15/10/2026 é uma quinta-feira.
    expect(weekdayOf("2026-10-15")).toBe("qui");
  });

  it("monta a grade do mês começando no domingo e cobrindo o mês todo", () => {
    const semanas = monthGrid("2026-10");
    expect(semanas[0]).toHaveLength(7);
    // Toda linha começa num domingo.
    for (const semana of semanas) {
      expect(localDate(semana[0]!).getDay()).toBe(0);
    }
    const todos = semanas.flat();
    // Outubro inteiro cabe na grade.
    for (const dia of ["2026-10-01", "2026-10-15", "2026-10-31"]) {
      expect(todos).toContain(dia);
    }
    // E nenhuma linha sobra depois que o mês acaba.
    expect(semanas.length).toBeLessThanOrEqual(6);
    expect(semanas.at(-1)!.some((dia) => monthKey(dia) === "2026-10")).toBe(true);
  });

  it("agrupa por mês sem bagunçar a ordem", () => {
    const grupos = groupByMonth([evento("2026-11-09"), evento("2026-10-15"), evento("2026-10-22")]);
    expect(grupos.map(([chave]) => chave)).toEqual(["2026-10", "2026-11"]);
    expect(grupos[0]![1]).toHaveLength(2);
  });

  it("conta os próximos dias sem incluir o que já passou", () => {
    expect(withinNextDays(evento("2026-10-16", { daysLeft: 1 }), 7)).toBe(true);
    expect(withinNextDays(evento("2026-10-30", { daysLeft: 15 }), 7)).toBe(false);
    expect(withinNextDays(evento("2026-10-01", { daysLeft: -14, past: true }), 7)).toBe(false);
  });
});

describe("o calendário exportado", () => {
  const nomes = new Map([["mac-1", "MAC I"]]);

  it("gera um .ics que um app de calendário aceita", () => {
    const ics = buildIcs([evento("2026-10-15")], {
      disciplineNames: nomes,
      now: new Date("2026-10-14T12:00:00Z"),
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:N1 · MAC I");
    // Dia inteiro: DTEND é exclusivo, então marca o dia seguinte.
    expect(ics).toContain("DTSTART;VALUE=DATE:20261015");
    expect(ics).toContain("DTEND;VALUE=DATE:20261016");
    // Linhas terminam em CRLF, como o formato exige.
    expect(ics.includes("\r\n")).toBe(true);
  });

  it("mantém o mesmo UID, para reimportar não duplicar", () => {
    const um = buildIcs([evento("2026-10-15")], { disciplineNames: nomes });
    const dois = buildIcs([evento("2026-10-15")], { disciplineNames: nomes });
    const uid = (texto: string) => texto.split("\r\n").find((l) => l.startsWith("UID:"));
    expect(uid(um)).toBe(uid(dois));
  });

  it("escapa vírgula e ponto e vírgula, que separam campos no formato", () => {
    const ics = buildIcs(
      [
        evento("2026-10-15", {
          title: "N1, teórica; prática",
        }),
      ],
      { disciplineNames: nomes },
    );
    expect(ics).toContain("SUMMARY:N1\\, teórica\\; prática · MAC I");
  });
});
