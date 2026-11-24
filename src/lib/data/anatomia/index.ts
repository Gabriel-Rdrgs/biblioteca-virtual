import { buildLessons, isTrainable, trainingText, type Lesson } from "@/lib/domain/anatomy-lessons";
import type { AnatomyData, AnatomyStructure, LandmarkIndex } from "@/lib/domain/anatomy-types";
import acidentes from "./acidentes.json";
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

/** Os acidentes ósseos marcados no modelo, por osso. */
export const anatomyLandmarks = acidentes as unknown as LandmarkIndex;

export function landmarkCount(): number {
  return Object.values(anatomyLandmarks).reduce((n, list) => n + list.length, 0);
}

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

/* ------------------------------------------------ o índice do atlas */

export interface RegionIndex {
  readonly id: string;
  readonly name: string;
  readonly short: string;
  readonly bones: readonly AnatomyStructure[];
  readonly superficial: readonly AnatomyStructure[];
  readonly deep: readonly AnatomyStructure[];
  /** Fáscias, tendões, discos, dentes… */
  readonly others: readonly AnatomyStructure[];
  readonly landmarks: number;
}

/** Cada região do corpo com o que há nela, na ordem em que se estuda. */
export function regionIndex(): RegionIndex[] {
  return anatomyData.regions.map((r) => {
    const here = anatomyData.structures.filter((s) => s.region === r.id);
    const bones = here.filter((s) => s.kind === "bone");
    return {
      id: r.id,
      name: r.name,
      short: r.short,
      bones,
      superficial: here.filter((s) => s.kind === "muscle" && s.layer === "superficial"),
      deep: here.filter((s) => s.kind === "muscle" && s.layer === "deep"),
      others: here.filter((s) => s.kind !== "muscle" && s.kind !== "bone"),
      landmarks: bones.reduce((n, b) => n + (anatomyLandmarks[b.id]?.length ?? 0), 0),
    };
  });
}

export function getRegion(id: string): RegionIndex | undefined {
  return regionIndex().find((r) => r.id === id);
}
