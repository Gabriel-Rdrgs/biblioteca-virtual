import { buildLessons, isTrainable, type Lesson } from "@/lib/domain/anatomy-lessons";
import type { AnatomyData, AnatomyStructure } from "@/lib/domain/anatomy-types";
import miolab from "./miolab.json";

/**
 * Os dados da anatomia 3D: regiões, referências e estruturas com ficha.
 *
 * Vêm do MioLab (extraídos do app publicado) e moram em JSON, como os
 * baralhos. `tests/anatomia.test.ts` confere a forma, por isso a conversão
 * abaixo pode ser direta.
 */
export const anatomyData = miolab as unknown as AnatomyData;

const byId = new Map(anatomyData.structures.map((s) => [s.id, s]));
const regionNames = new Map(anatomyData.regions.map((r) => [r.id, r.name]));

export function getStructure(id: string): AnatomyStructure | undefined {
  return byId.get(id);
}

export const anatomyLessons: readonly Lesson[] = buildLessons(anatomyData);

export function getLesson(id: string): Lesson | undefined {
  return anatomyLessons.find((l) => l.id === id);
}

/** A lição seguinte na ordem do corpo: a próxima da região, ou a primeira da região seguinte. */
export function nextLesson(id: string): Lesson | undefined {
  const i = anatomyLessons.findIndex((l) => l.id === id);
  return i >= 0 ? anatomyLessons[i + 1] : undefined;
}

/** Só o que o treino precisa de cada músculo — a ficha inteira fica no servidor. */
export interface TrainableMuscle {
  readonly id: string;
  readonly namePt: string;
  readonly region: string;
  readonly regionName: string;
  readonly parts: readonly string[];
  readonly clue: string;
  readonly explanation: string;
}

export function trainableMuscle(id: string): TrainableMuscle | undefined {
  const s = byId.get(id);
  if (!s || !isTrainable(s) || !s.ficha) return undefined;
  return {
    id: s.id,
    namePt: s.namePt,
    region: s.region,
    regionName: regionNames.get(s.region) ?? s.region,
    parts: s.parts,
    clue: s.ficha.clue,
    explanation: s.ficha.explanation,
  };
}

export function allTrainableMuscles(): TrainableMuscle[] {
  return anatomyData.structures.flatMap((s) => {
    const m = trainableMuscle(s.id);
    return m ? [m] : [];
  });
}

export { MODEL_URL } from "./model-url";
