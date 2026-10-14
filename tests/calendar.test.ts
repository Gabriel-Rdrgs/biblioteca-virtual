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

describe("datas vindas dos planos de ensino", () => {
  it("every seeded date names a real matéria and a real simulado", async () => {
    const { seedAssessments } = await import("@/lib/data/assessments");
    const { disciplines } = await import("@/lib/data/disciplines");
    const { seedExams } = await import("@/lib/data/exams");

    expect(seedAssessments.length).toBeGreaterThan(20);
    for (const assessment of seedAssessments) {
      expect(
        disciplines.some((d) => d.id === assessment.disciplineId),
        `matéria de ${assessment.id}`,
      ).toBe(true);
      for (const examId of assessment.examIds) {
        expect(
          seedExams.some((e) => e.id === examId),
          `simulado de ${assessment.id}`,
        ).toBe(true);
      }
    }
  });

  it("every seeded date is well formed, in the term, and says where it came from", async () => {
    const { seedAssessments } = await import("@/lib/data/assessments");
    for (const assessment of seedAssessments) {
      expect(assessment.date, assessment.id).toMatch(/^2026-(0[89]|1[012])-\d{2}$/);
      expect(daysUntil(assessment.date, new Date(2026, 7, 1))).toBeGreaterThan(0);
      expect(assessment.source, assessment.id).toContain("Plano de ensino");
      expect(assessment.origin).toBe("seed");
    }
  });

  it("ids are unique", async () => {
    const { seedAssessments } = await import("@/lib/data/assessments");
    const ids = seedAssessments.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("counts down in red only for what you have to study for", async () => {
    const { isExam } = await import("@/lib/domain/assessment-types");
    const { seedAssessments } = await import("@/lib/data/assessments");
    const devolutiva = seedAssessments.find((a) => a.kind === "devolutiva")!;
    const prova = seedAssessments.find((a) => a.kind === "N1")!;
    expect(isExam(devolutiva)).toBe(false);
    expect(isExam(prova)).toBe(true);
  });

  it("an admin correction patches a plan's date without losing its source", async () => {
    const { mergeAssessments } = await import("@/lib/repository/assessments");
    const { emptyManifest } = await import("@/lib/domain/types");
    const merged = mergeAssessments({
      ...emptyManifest,
      assessmentOverrides: { "mac-1-n2-teorica": { date: "2026-12-03" } },
    });
    const corrected = merged.find((a) => a.id === "mac-1-n2-teorica")!;
    expect(corrected.date).toBe("2026-12-03");
    expect(corrected.source).toContain("Plano de ensino de MAC I");
    expect(corrected.origin).toBe("seed");
  });

  it("hiding one keeps it out of the class's calendar but not out of the admin's", async () => {
    const { mergeAssessments } = await import("@/lib/repository/assessments");
    const { emptyManifest } = await import("@/lib/domain/types");
    const merged = mergeAssessments({
      ...emptyManifest,
      assessmentOverrides: { "ha-1-n1": { visibility: "oculto" } },
    });
    expect(merged.find((a) => a.id === "ha-1-n1")?.visibility).toBe("oculto");
    expect(merged.filter((a) => a.visibility === "visivel").length).toBe(merged.length - 1);
  });
});

describe("edição parcial de uma data", () => {
  it("accepts a correction and a visibility in one payload", async () => {
    const { assessmentPatchSchema } = await import("@/lib/admin/schemas");
    const parsed = assessmentPatchSchema.safeParse({
      visibility: "visivel",
      date: "2026-12-03",
    });
    expect(parsed.success).toBe(true);
    // Both survive: branching on one of them used to drop the other.
    if (parsed.success) {
      expect(parsed.data.visibility).toBe("visivel");
      expect(parsed.data.date).toBe("2026-12-03");
    }
  });

  it("still refuses a malformed field inside a mixed payload", async () => {
    const { assessmentPatchSchema } = await import("@/lib/admin/schemas");
    expect(
      assessmentPatchSchema.safeParse({ visibility: "oculto", date: "03/12/2026" }).success,
    ).toBe(false);
  });
});
