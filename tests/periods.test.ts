import { describe, expect, it } from "vitest";
import { disciplines } from "@/lib/data/disciplines";
import { emptyManifest, type Discipline } from "@/lib/domain/types";
import { mergeDisciplines } from "@/lib/repository";
import { disciplineSchema } from "@/lib/admin/schemas";

const created: Discipline = {
  id: "mac-2-2",
  slug: "morfofuncional-ii",
  name: "Morfofuncional Aplicado à Clínica II",
  shortName: "MAC II",
  period: 2,
  semester: "2027.1",
  description: "Continuação do estudo morfofuncional, com sistemas cardiovascular e respiratório.",
  syllabus: [],
  teachers: [],
  color: "#0f5563",
  colorSoft: "#e0eef1",
  motif: "anatomia",
  visibility: "visivel",
  origin: "admin",
};

describe("periods", () => {
  it("seeds all belong to the 1st period of 2026.2", () => {
    for (const d of disciplines) {
      expect(d.period).toBe(1);
      expect(d.semester).toBe("2026.2");
      expect(d.origin).toBe("seed");
    }
  });

  it("merges admin-created disciplines and applies overrides", () => {
    const merged = mergeDisciplines({
      ...emptyManifest,
      disciplines: [created],
      disciplineOverrides: { "mac-1": { visibility: "oculto" }, "mac-2-2": { workload: "120h" } },
    });
    expect(merged.some((d) => d.id === "mac-2-2" && d.workload === "120h")).toBe(true);
    expect(merged.find((d) => d.id === "mac-1")?.visibility).toBe("oculto");
    expect(merged.length).toBe(disciplines.length + 1);
  });

  it("validates a discipline payload", () => {
    const ok = disciplineSchema.safeParse({
      name: "Fisiologia I",
      shortName: "FISIO I",
      period: 2,
      semester: "2027.1",
      description: "Fisiologia dos sistemas cardiovascular, respiratório e renal.",
      color: "#1f5f8b",
      colorSoft: "#e2eef5",
      motif: "bioquimica",
    });
    expect(ok.success).toBe(true);

    const bad = disciplineSchema.safeParse({
      name: "X",
      shortName: "F",
      period: 13,
      semester: "2027",
      description: "curta",
      color: "azul",
      colorSoft: "#fff",
      motif: "anatomia",
    });
    expect(bad.success).toBe(false);
  });
});
