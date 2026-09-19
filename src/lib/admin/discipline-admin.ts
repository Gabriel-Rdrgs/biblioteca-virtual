import { readManifest, updateManifest } from "@/lib/catalog-store";
import { slugify } from "@/lib/domain/normalize";
import type {
  CatalogLogEntry,
  Discipline,
  PeriodNumber,
  TeachingPlan,
  Visibility,
} from "@/lib/domain/types";
import { mergeDisciplines } from "@/lib/repository";
import { AdminError, removeStoredFile, verifyStoredPdf } from "./catalog-admin";
import type { DisciplineInput } from "./schemas";

/**
 * Discipline management. Seeds (the seven 2026.2 plans) can be edited and
 * hidden but never deleted; disciplines created here can be deleted, which
 * also removes their book links and uploaded plan.
 */

function logEntry(action: CatalogLogEntry["action"], id: string, detail?: string) {
  return { at: new Date().toISOString(), action, bookId: id, ...(detail ? { detail } : {}) };
}

function uniqueId(base: string, taken: readonly Discipline[]): string {
  const root = slugify(base).slice(0, 60) || "materia";
  let id = root;
  for (let n = 2; taken.some((d) => d.id === id); n++) id = `${root}-${n}`;
  return id;
}

export async function createDiscipline(input: DisciplineInput): Promise<Discipline> {
  const manifest = await readManifest();
  const existing = mergeDisciplines(manifest);

  if (existing.some((d) => d.shortName.toLowerCase() === input.shortName.toLowerCase())) {
    throw new AdminError(`Já existe uma matéria com a sigla “${input.shortName}”.`, 409);
  }

  if (input.plan) await verifyStoredPdf(input.plan.fileName, input.plan.sizeBytes, "planos");

  const id = uniqueId(`${input.shortName}-${input.period}`, existing);
  const discipline: Discipline = {
    id,
    slug: uniqueId(input.name, existing),
    name: input.name,
    shortName: input.shortName,
    ...(input.code ? { code: input.code } : {}),
    period: input.period,
    semester: input.semester,
    ...(input.workload ? { workload: input.workload } : {}),
    ...(input.weeklyWorkload ? { weeklyWorkload: input.weeklyWorkload } : {}),
    description: input.description,
    syllabus: input.syllabus,
    teachers: input.teachers,
    color: input.color,
    colorSoft: input.colorSoft,
    motif: input.motif,
    ...(input.plan ? { teachingPlanFile: `/api/planos/${id}` } : {}),
    ...(input.notes.length ? { notes: input.notes } : {}),
    visibility: "visivel",
    origin: "admin",
  };

  const plan: TeachingPlan | null = input.plan
    ? {
        id: `plano-${id}`,
        disciplineId: id,
        title: `Plano de Ensino — ${input.name}`,
        fileUrl: `/api/planos/${id}`,
        semester: input.semester,
        sourceFileName: input.plan.originalName,
        extractedTextStatus: "pendente",
        storage: "storage",
        storagePath: input.plan.fileName,
      }
    : null;

  await updateManifest((current) => ({
    ...current,
    disciplines: [...(current.disciplines ?? []), discipline],
    teachingPlans: plan ? [...(current.teachingPlans ?? []), plan] : current.teachingPlans,
    log: [...current.log, logEntry("materia_criada", id, input.name)],
  }));

  return discipline;
}

/** Edits the descriptive fields of any discipline, seed or not. */
export async function updateDiscipline(
  id: string,
  patch: Partial<Omit<DisciplineInput, "plan">> & { plan?: DisciplineInput["plan"] | null },
): Promise<void> {
  const manifest = await readManifest();
  const discipline = mergeDisciplines(manifest).find((d) => d.id === id);
  if (!discipline) throw new AdminError("Matéria não encontrada.", 404);

  const { plan, ...fields } = patch;
  const override: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) override[key] = value;
  }

  let plans = manifest.teachingPlans ?? [];
  let previousPath: string | undefined;
  if (plan) {
    await verifyStoredPdf(plan.fileName, plan.sizeBytes, "planos");
    previousPath = plans.find((p) => p.disciplineId === id)?.storagePath;
    plans = [
      ...plans.filter((p) => p.disciplineId !== id),
      {
        id: `plano-${id}`,
        disciplineId: id,
        title: `Plano de Ensino — ${fields.name ?? discipline.name}`,
        fileUrl: `/api/planos/${id}`,
        semester: fields.semester ?? discipline.semester,
        sourceFileName: plan.originalName,
        extractedTextStatus: "pendente",
        storage: "storage",
        storagePath: plan.fileName,
      },
    ];
    override.teachingPlanFile = `/api/planos/${id}`;
  }

  await updateManifest((current) => ({
    ...current,
    teachingPlans: plans,
    disciplineOverrides: {
      ...current.disciplineOverrides,
      [id]: { ...current.disciplineOverrides?.[id], ...override },
    },
    log: [...current.log, logEntry("materia_editada", id, Object.keys(override).join(", "))],
  }));

  if (previousPath && previousPath !== plan?.fileName) {
    await removeStoredFile(previousPath, "planos");
  }
}

export async function setDisciplineVisibility(id: string, visibility: Visibility): Promise<void> {
  const manifest = await readManifest();
  if (!mergeDisciplines(manifest).some((d) => d.id === id)) {
    throw new AdminError("Matéria não encontrada.", 404);
  }
  await updateManifest((current) => ({
    ...current,
    disciplineOverrides: {
      ...current.disciplineOverrides,
      [id]: { ...current.disciplineOverrides?.[id], visibility },
    },
    log: [...current.log, logEntry("materia_visibilidade", id, visibility)],
  }));
}

/** Deletes an admin-created discipline, its book links and its uploaded plan. */
export async function deleteDiscipline(id: string): Promise<void> {
  const manifest = await readManifest();
  const created = (manifest.disciplines ?? []).find((d) => d.id === id);
  if (!created) {
    if (mergeDisciplines(manifest).some((d) => d.id === id)) {
      throw new AdminError("Matérias dos planos de ensino só podem ser ocultadas.", 400);
    }
    throw new AdminError("Matéria não encontrada.", 404);
  }

  const planPath = (manifest.teachingPlans ?? []).find((p) => p.disciplineId === id)?.storagePath;

  await updateManifest((current) => {
    const { [id]: _dropped, ...disciplineOverrides } = current.disciplineOverrides ?? {};
    return {
      ...current,
      disciplines: (current.disciplines ?? []).filter((d) => d.id !== id),
      disciplineOverrides,
      links: current.links.filter((l) => l.disciplineId !== id),
      teachingPlans: (current.teachingPlans ?? []).filter((p) => p.disciplineId !== id),
      log: [...current.log, logEntry("materia_excluida", id, created.name)],
    };
  });

  if (planPath) await removeStoredFile(planPath, "planos");
}

export async function setCurrentPeriod(period: PeriodNumber): Promise<void> {
  await updateManifest((current) => ({
    ...current,
    settings: { ...current.settings, currentPeriod: period },
    log: [...current.log, logEntry("periodo_atual", "—", String(period))],
  }));
}
