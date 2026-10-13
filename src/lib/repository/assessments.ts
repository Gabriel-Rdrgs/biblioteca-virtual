import { readManifest } from "@/lib/catalog-store";
import { daysUntil, type Assessment, type UpcomingAssessment } from "@/lib/domain/assessment-types";
import type { DisciplineId } from "@/lib/domain/types";

/**
 * Reading side of the exam calendar.
 *
 * Assessments live only in the manifest: there is nothing to seed, because
 * inventing a date would be worse than having none. They are sorted by
 * date, and "upcoming" means today or later — an exam on the day itself is
 * still ahead of you.
 */

export async function getAssessments(disciplineId?: DisciplineId): Promise<Assessment[]> {
  const manifest = await readManifest();
  return (manifest.assessments ?? [])
    .filter(
      (assessment) =>
        assessment.visibility === "visivel" &&
        (!disciplineId || assessment.disciplineId === disciplineId),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Every assessment, hidden ones included — for the admin area. */
export async function getAllAssessmentsForAdmin(): Promise<Assessment[]> {
  const manifest = await readManifest();
  return [...(manifest.assessments ?? [])].sort((a, b) => a.date.localeCompare(b.date));
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
