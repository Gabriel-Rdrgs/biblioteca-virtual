import { describe, expect, it } from "vitest";
import {
  assessmentLabel,
  countdownLabel,
  daysUntil,
  formatAssessmentDate,
  type Assessment,
} from "@/lib/domain/assessment-types";
import { assessmentSchema } from "@/lib/admin/schemas";

const base: Assessment = {
  id: "mac-1-n1",
  disciplineId: "mac-1",
  kind: "N1",
  date: "2026-11-14",
  content: [],
  examIds: [],
  visibility: "visivel",
  origin: "admin",
};

describe("datas de prova", () => {
  const today = new Date(2026, 10, 10); // 10 de novembro de 2026

  it("counts whole days, not hours", () => {
    expect(daysUntil("2026-11-14", today)).toBe(4);
    expect(daysUntil("2026-11-10", today)).toBe(0);
    expect(daysUntil("2026-11-09", today)).toBe(-1);
  });

  it("is not thrown off by the hour of the day", () => {
    const morning = new Date(2026, 10, 10, 1, 0, 0);
    const night = new Date(2026, 10, 10, 23, 59, 0);
    expect(daysUntil("2026-11-14", morning)).toBe(daysUntil("2026-11-14", night));
  });

  it("crosses months and years", () => {
    expect(daysUntil("2026-12-01", new Date(2026, 10, 30))).toBe(1);
    expect(daysUntil("2027-01-01", new Date(2026, 11, 31))).toBe(1);
  });

  it("says the countdown the way a person would", () => {
    expect(countdownLabel(0)).toBe("hoje");
    expect(countdownLabel(1)).toBe("amanhã");
    expect(countdownLabel(5)).toBe("em 5 dias");
    expect(countdownLabel(-1)).toBe("ontem");
    expect(countdownLabel(-3)).toBe("há 3 dias");
  });

  it("writes the date out loud", () => {
    expect(formatAssessmentDate("2026-11-14")).toBe("14 de novembro");
    expect(formatAssessmentDate("2026-03-02", true)).toBe("2 de março de 2026");
  });

  it("falls back to the assessment kind when there is no title", () => {
    expect(assessmentLabel(base)).toBe("N1");
    expect(assessmentLabel({ ...base, title: "Prova prática" })).toBe("Prova prática");
  });
});

describe("validação do cadastro de prova", () => {
  const valid = { disciplineId: "mac-1", kind: "N1" as const, date: "2026-11-14" };

  it("accepts the minimum a date needs", () => {
    const parsed = assessmentSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.content).toEqual([]);
      expect(parsed.data.examIds).toEqual([]);
    }
  });

  it("refuses a malformed date or time", () => {
    expect(assessmentSchema.safeParse({ ...valid, date: "14/11/2026" }).success).toBe(false);
    expect(assessmentSchema.safeParse({ ...valid, date: "2026-13-01" }).success).toBe(true); // forma, não calendário
    expect(assessmentSchema.safeParse({ ...valid, time: "25:00" }).success).toBe(false);
    expect(assessmentSchema.safeParse({ ...valid, time: "19:30" }).success).toBe(true);
  });

  it("keeps the content as a list of topics", () => {
    const parsed = assessmentSchema.safeParse({
      ...valid,
      content: ["Anatomia: crânio e coluna", "Parasitologia: protozoários"],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.content).toHaveLength(2);
  });
});
