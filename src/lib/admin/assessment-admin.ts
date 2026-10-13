import { readManifest, updateManifest } from "@/lib/catalog-store";
import type { Assessment } from "@/lib/domain/assessment-types";
import type { CatalogLogEntry, Visibility } from "@/lib/domain/types";
import { mergeDisciplines } from "@/lib/repository";
import { getExams } from "@/lib/repository/exams";
import { AdminError } from "./catalog-admin";
import type { AssessmentInput } from "./schemas";

/**
 * The exam calendar is admin-only data: a wrong date is worse than no
 * date, so nothing here is inferred. Each assessment is checked against a
 * real matéria and against simulados that exist.
 */

function logEntry(action: CatalogLogEntry["action"], id: string, detail?: string) {
  return { at: new Date().toISOString(), action, bookId: id, ...(detail ? { detail } : {}) };
}

async function validate(input: Partial<AssessmentInput>): Promise<void> {
  if (input.disciplineId) {
    const disciplines = mergeDisciplines(await readManifest());
    if (!disciplines.some((d) => d.id === input.disciplineId)) {
      throw new AdminError(`Matéria desconhecida: ${input.disciplineId}.`, 400);
    }
  }
  for (const examId of input.examIds ?? []) {
    if (!getExams().some((exam) => exam.id === examId)) {
      throw new AdminError(`Simulado desconhecido: ${examId}.`, 400);
    }
  }
}

export async function createAssessment(input: AssessmentInput): Promise<Assessment> {
  await validate(input);

  const manifest = await readManifest();
  const base = `${input.disciplineId}-${input.kind}`.toLowerCase();
  let id = base;
  for (let n = 2; (manifest.assessments ?? []).some((a) => a.id === id); n++) id = `${base}-${n}`;

  const assessment: Assessment = {
    id,
    disciplineId: input.disciplineId,
    kind: input.kind,
    ...(input.title ? { title: input.title } : {}),
    date: input.date,
    ...(input.time ? { time: input.time } : {}),
    ...(input.room ? { room: input.room } : {}),
    ...(input.weight ? { weight: input.weight } : {}),
    content: input.content,
    examIds: input.examIds,
    ...(input.note ? { note: input.note } : {}),
    visibility: "visivel",
    origin: "admin",
  };

  await updateManifest((current) => ({
    ...current,
    assessments: [...(current.assessments ?? []), assessment],
    log: [...current.log, logEntry("prova_criada", id, `${input.kind} em ${input.date}`)],
  }));

  return assessment;
}

export async function updateAssessment(
  id: string,
  patch: Partial<AssessmentInput> & { visibility?: Visibility },
): Promise<void> {
  const manifest = await readManifest();
  if (!(manifest.assessments ?? []).some((a) => a.id === id)) {
    throw new AdminError("Prova não encontrada.", 404);
  }
  await validate(patch);

  const changed: string[] = [];
  await updateManifest((current) => ({
    ...current,
    assessments: (current.assessments ?? []).map((assessment) => {
      if (assessment.id !== id) return assessment;
      const next = { ...assessment };
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) continue;
        changed.push(key);
        (next as Record<string, unknown>)[key] = value;
      }
      return next;
    }),
    log: [...current.log, logEntry("prova_editada", id, changed.join(", "))],
  }));
}

export async function deleteAssessment(id: string): Promise<void> {
  const manifest = await readManifest();
  const assessment = (manifest.assessments ?? []).find((a) => a.id === id);
  if (!assessment) throw new AdminError("Prova não encontrada.", 404);

  await updateManifest((current) => ({
    ...current,
    assessments: (current.assessments ?? []).filter((a) => a.id !== id),
    log: [...current.log, logEntry("prova_excluida", id, assessment.date)],
  }));
}
