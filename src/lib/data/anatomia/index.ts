import { buildLessons, isTrainable, trainingText, type Lesson } from "@/lib/domain/anatomy-lessons";
import type { AnatomyData, AnatomyStructure } from "@/lib/domain/anatomy-types";
import miolab from "./miolab.json";
import ossos from "./ossos.json";

/**
 * Os dados da anatomia 3D: regiões, referências e estruturas com ficha.
 *
 * Os músculos vêm do MioLab (extraídos do app publicado); os ossos e as
 * demais peças do esqueleto do modelo foram escritos para o Atlas, com base
 * em Moore e Netter. Moram em JSON, como os baralhos; `tests/anatomia.test.ts`
 * confere a forma, por isso a conversão abaixo pode ser direta.
 */
const muscles = miolab as unknown as AnatomyData;
export const anatomyData: AnatomyData = {
  ...muscles,
  structures: [
    ...muscles.structures,
    ...(ossos as unknown as { structures: AnatomyStructure[] }).structures,
  ],
};

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

/** Só o que o treino precisa de cada músculo ou osso — a ficha inteira fica no servidor. */
export interface TrainableMuscle {
  readonly id: string;
  readonly kind: "muscle" | "bone";
  readonly namePt: string;
  readonly region: string;
  readonly regionName: string;
  readonly parts: readonly string[];
  readonly clue: string;
  readonly explanation: string;
}

export function trainableMuscle(id: string): TrainableMuscle | undefined {
  const s = byId.get(id);
  const text = s && isTrainable(s) ? trainingText(s) : null;
  if (!s || !text) return undefined;
  return {
    id: s.id,
    kind: s.kind === "bone" ? "bone" : "muscle",
    namePt: s.namePt,
    region: s.region,
    regionName: regionNames.get(s.region) ?? s.region,
    parts: s.parts,
    ...text,
  };
}

export function allTrainableMuscles(): TrainableMuscle[] {
  return anatomyData.structures.flatMap((s) => {
    const m = trainableMuscle(s.id);
    return m ? [m] : [];
  });
}

export { MODEL_URL } from "./model-url";
