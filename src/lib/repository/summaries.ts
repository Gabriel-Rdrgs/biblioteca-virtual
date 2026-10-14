import { readManifest } from "@/lib/catalog-store";
import { seedSummaries } from "@/lib/data/summaries";
import type { CatalogManifest, DisciplineId } from "@/lib/domain/types";
import { bySequence, type Summary } from "@/lib/domain/summary-types";

/**
 * Lado de leitura dos resumos.
 *
 * Mesmo arranjo das datas: o que está publicado vem das sementes, o admin
 * acrescenta ou corrige por cima, e o original guarda a sua procedência.
 */

/** Sementes mais o que o admin criou, com as correções aplicadas. Pura. */
export function mergeSummaries(manifest: CatalogManifest): Summary[] {
  return [...seedSummaries, ...(manifest.summaries ?? [])].map((summary) => {
    const patch = manifest.summaryOverrides?.[summary.id];
    return patch ? ({ ...summary, ...patch } as Summary) : summary;
  });
}

export async function getSummaries(disciplineId?: DisciplineId): Promise<Summary[]> {
  return mergeSummaries(await readManifest())
    .filter(
      (summary) =>
        summary.visibility === "visivel" &&
        (!disciplineId || summary.disciplineId === disciplineId),
    )
    .sort(bySequence);
}

/** Todos, inclusive os ocultos — para o painel. */
export async function getAllSummariesForAdmin(): Promise<Summary[]> {
  return mergeSummaries(await readManifest()).sort(bySequence);
}

export async function getSummaryBySlug(slug: string): Promise<Summary | undefined> {
  return (await getSummaries()).find((summary) => summary.slug === slug);
}

/** Os resumos que caem em uma avaliação — o que estudar na véspera. */
export async function getSummariesForAssessment(assessmentId: string): Promise<Summary[]> {
  return (await getSummaries()).filter((summary) => summary.assessmentIds.includes(assessmentId));
}

/**
 * Os resumos que explicam um eixo do banco de questões.
 *
 * É o que transforma um erro no simulado em leitura dirigida, ao lado do
 * capítulo do livro que `study-references` já aponta.
 */
export async function getSummariesForAxis(axisId: string): Promise<Summary[]> {
  return (await getSummaries()).filter((summary) => summary.axisIds.includes(axisId));
}
