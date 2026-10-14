import { readManifest } from "@/lib/catalog-store";
import { seedAssessments } from "@/lib/data/assessments";
import type { CatalogManifest } from "@/lib/domain/types";
import { daysUntil, type Assessment, type UpcomingAssessment } from "@/lib/domain/assessment-types";
import type { DisciplineId } from "@/lib/domain/types";

/**
 * Reading side of the exam calendar.
 *
 * Dates come from two places: the cronogramas transcribed from the
 * teaching plans, and whatever the admin has added. Every plan warns that
 * its schedule may change during the term, so a seeded date can be
 * corrected or hidden — the correction is a patch over it, and the
 * original keeps its recorded source.
 *
 * "Upcoming" means today or later: an exam on the day itself is still
 * ahead of you.
 */

/** Seeds plus admin-created dates, with corrections applied. Pure. */
export function mergeAssessments(manifest: CatalogManifest): Assessment[] {
  return [...seedAssessments, ...(manifest.assessments ?? [])].map((assessment) => {
    const patch = manifest.assessmentOverrides?.[assessment.id];
    return patch ? { ...assessment, ...patch } : assessment;
  });
}

export async function getAssessments(disciplineId?: DisciplineId): Promise<Assessment[]> {
  return mergeAssessments(await readManifest())
    .filter(
      (assessment) =>
        assessment.visibility === "visivel" &&
        (!disciplineId || assessment.disciplineId === disciplineId),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Every assessment, hidden ones included — for the admin area. */
export async function getAllAssessmentsForAdmin(): Promise<Assessment[]> {
  return mergeAssessments(await readManifest()).sort((a, b) => a.date.localeCompare(b.date));
}

function decorate(assessment: Assessment, today: Date): UpcomingAssessment {
  const left = daysUntil(assessment.date, today);
  return { assessment, daysLeft: left, past: left < 0 };
}

/** What is still ahead, soonest first. */
export async function getUpcomingAssessments(
  limit?: number,
  today = new Date(),
): Promise<UpcomingAssessment[]> {
  const list = (await getAssessments())
    .map((assessment) => decorate(assessment, today))
    .filter((item) => !item.past);
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

/** The whole calendar, split into what is ahead and what has passed. */
export async function getCalendar(today = new Date()): Promise<{
  upcoming: UpcomingAssessment[];
  past: UpcomingAssessment[];
}> {
  const all = (await getAssessments()).map((assessment) => decorate(assessment, today));
  return {
    upcoming: all.filter((item) => !item.past),
    past: all.filter((item) => item.past).reverse(),
  };
}

export async function getAssessmentsForDiscipline(
  disciplineId: DisciplineId,
  today = new Date(),
): Promise<UpcomingAssessment[]> {
  return (await getAssessments(disciplineId)).map((assessment) => decorate(assessment, today));
}
