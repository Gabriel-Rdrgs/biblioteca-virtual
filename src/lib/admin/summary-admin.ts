import { readManifest, updateManifest } from "@/lib/catalog-store";
import { slugify } from "@/lib/domain/normalize";
import type { Summary } from "@/lib/domain/summary-types";
import type { CatalogLogEntry, Visibility } from "@/lib/domain/types";
import { questionAreas } from "@/lib/data/questions";
import { mergeDisciplines } from "@/lib/repository";
import { mergeAssessments } from "@/lib/repository/assessments";
import { mergeSummaries } from "@/lib/repository/summaries";
import { AdminError, removeStoredFile, verifyStoredPdf } from "./catalog-admin";
import type { SummaryInput, summaryPatchSchema } from "./schemas";
import type { z } from "zod";

/**
 * Publicar um resumo pelo painel.
 *
 * O que separa um resumo de um PDF solto numa pasta são as ligações: a
 * matéria, a prova em que o conteúdo cai e o eixo do banco de questões que
 * ele explica. Por isso nenhuma delas é aceita sem ser conferida contra o
 * catálogo — um eixo que não existe nunca sugeriria o resumo a ninguém, e
 * ninguém descobriria o erro.
 */

function logEntry(action: CatalogLogEntry["action"], id: string, detail?: string) {
  return { at: new Date().toISOString(), action, bookId: id, ...(detail ? { detail } : {}) };
}

type SummaryPatch = z.infer<typeof summaryPatchSchema>;

async function validate(input: {
  disciplineId?: string;
  areaIds?: readonly string[];
  axisIds?: readonly string[];
  assessmentIds?: readonly string[];
}): Promise<void> {
  const manifest = await readManifest();

  if (input.disciplineId) {
    if (!mergeDisciplines(manifest).some((d) => d.id === input.disciplineId)) {
      throw new AdminError(`Matéria desconhecida: ${input.disciplineId}.`, 400);
    }
  }
  for (const assessmentId of input.assessmentIds ?? []) {
    if (!mergeAssessments(manifest).some((a) => a.id === assessmentId)) {
      throw new AdminError(`Avaliação desconhecida: ${assessmentId}.`, 400);
    }
  }
  const areas = new Set(questionAreas.map((area) => area.id));
  for (const areaId of input.areaIds ?? []) {
    if (!areas.has(areaId)) throw new AdminError(`Área desconhecida: ${areaId}.`, 400);
  }
  const eixos = new Set(questionAreas.flatMap((area) => area.axes.map((axis) => axis.id)));
  for (const axisId of input.axisIds ?? []) {
    if (!eixos.has(axisId)) throw new AdminError(`Eixo desconhecido: ${axisId}.`, 400);
  }
}

export async function createSummary(input: SummaryInput): Promise<Summary> {
  await validate(input);
  await verifyStoredPdf(input.file.fileName, input.file.sizeBytes, "resumos");

  const manifest = await readManifest();
  const existentes = mergeSummaries(manifest);

  const sufixo =
    input.kind === "aula"
      ? `aula-${String(input.lesson).padStart(2, "0")}`
      : input.kind === "problema"
        ? `problema-${String(input.problem).padStart(2, "0")}`
        : `resumo-${slugify(input.cycleLabel ?? "ciclo")}`;

  let id = `${input.disciplineId}-${sufixo}`;
  for (let n = 2; existentes.some((s) => s.id === id); n++) {
    id = `${input.disciplineId}-${sufixo}-${n}`;
  }

  const base = `${id}-${slugify(input.title).slice(0, 60)}`;
  let slug = base;
  for (let n = 2; existentes.some((s) => s.slug === slug); n++) slug = `${base}-${n}`;

  const comum = {
    id,
    slug,
    disciplineId: input.disciplineId,
    title: input.title,
    topics: input.topics,
    areaIds: input.areaIds,
    axisIds: input.axisIds,
    assessmentIds: input.assessmentIds,
    pdfPath: input.file.fileName,
    pages: input.pages,
    addedAt: new Date().toISOString().slice(0, 10),
    visibility: "visivel" as const,
    origin: "admin" as const,
    ...(input.source ? { source: input.source } : {}),
  };

  const summary: Summary =
    input.kind === "aula"
      ? {
          ...comum,
          kind: "aula",
          lesson: input.lesson!,
          date: input.date!,
          ...(input.meeting ? { meeting: input.meeting } : {}),
        }
      : input.kind === "problema"
        ? {
            ...comum,
            kind: "problema",
            problem: input.problem!,
            ...(input.opensAt ? { opensAt: input.opensAt } : {}),
            ...(input.closesAt ? { closesAt: input.closesAt } : {}),
          }
        : { ...comum, kind: "ciclo", cycleLabel: input.cycleLabel! };

  await updateManifest((current) => ({
    ...current,
    summaries: [...(current.summaries ?? []), summary],
    log: [...current.log, logEntry("resumo_criado", id, input.title)],
  }));

  return summary;
}

/**
 * Corrige um resumo publicado.
 *
 * Como nas datas das provas, o que veio nas sementes nunca é reescrito no
 * lugar: a correção fica guardada por cima, e o original continua ali.
 */
export async function updateSummary(
  id: string,
  patch: SummaryPatch & { visibility?: Visibility },
): Promise<void> {
  const manifest = await readManifest();
  if (!mergeSummaries(manifest).some((s) => s.id === id)) {
    throw new AdminError("Resumo não encontrado.", 404);
  }
  await validate(patch);

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) clean[key] = value;
  }

  await updateManifest((current) => ({
    ...current,
    summaryOverrides: {
      ...current.summaryOverrides,
      [id]: { ...current.summaryOverrides?.[id], ...clean },
    },
    log: [...current.log, logEntry("resumo_editado", id, Object.keys(clean).join(", "))],
  }));
}

/**
 * Apaga um resumo publicado pelo painel, e o arquivo dele junto.
 *
 * Um resumo vindo das sementes só pode ser ocultado: ele está no código,
 * e apagá-lo do manifesto o traria de volta na próxima publicação.
 */
export async function deleteSummary(id: string): Promise<void> {
  const manifest = await readManifest();
  const summary = (manifest.summaries ?? []).find((s) => s.id === id);
  if (!summary) {
    if (mergeSummaries(manifest).some((s) => s.id === id)) {
      throw new AdminError("Resumos das sementes só podem ser ocultados.", 400);
    }
    throw new AdminError("Resumo não encontrado.", 404);
  }

  await updateManifest((current) => {
    const { [id]: _dropped, ...summaryOverrides } = current.summaryOverrides ?? {};
    return {
      ...current,
      summaries: (current.summaries ?? []).filter((s) => s.id !== id),
      summaryOverrides,
      log: [...current.log, logEntry("resumo_excluido", id, summary.title)],
    };
  });

  await removeStoredFile(summary.pdfPath, "resumos").catch(() => undefined);
}
