/**
 * Anatomia 3D: o modelo do Atlas.
 *
 * O modelo 3D (ecorche, sobre BodyParts3D e Z-Anatomy) é feito de malhas
 * com nome em inglês e lado — "Left pronator teres". Uma **estrutura** é o
 * que a turma estuda ("Pronador redondo"): junta as malhas dos dois lados e,
 * às vezes, várias partes (as três porções do deltoide). A ponte entre as
 * duas é a **chave** da malha: o nome sem o lado, em minúsculas.
 *
 * As fichas vieram do MioLab, o laboratório de anatomia muscular que a turma
 * já usava, e foram trazidas para dentro do Atlas.
 */

export type AnatomyLayer = "skeleton" | "deep muscles" | "superficial muscles";
export type StructureKind = "muscle" | "connective" | "bone" | "nerve" | "ligament";

export interface AnatomyRegion {
  readonly id: string;
  readonly name: string;
  readonly short: string;
}

export interface StructureCard {
  readonly nameEn: string;
  readonly nameLatin: string;
  readonly synonyms: readonly string[];
  readonly location: string;
  readonly origin: string;
  readonly insertion: string;
  readonly action: string;
  readonly innervation: string;
  readonly relations: string;
  readonly explanation: string;
  readonly mnemonic: string;
  readonly association: string;
  readonly examTip: string;
  readonly clue: string;
  readonly difficulty: number;
  readonly refs: readonly string[];
  readonly note?: string;
}

export interface AnatomyStructure {
  /** Slug em português, estável: "pronador-redondo". */
  readonly id: string;
  readonly namePt: string;
  readonly region: string;
  readonly kind: StructureKind;
  /** Superficial se alguma parte está na camada superficial do modelo. */
  readonly layer: "superficial" | "deep";
  /** Chaves das malhas que formam a estrutura (inglês, sem lado). */
  readonly parts: readonly string[];
  /** Para o que não é músculo (linha alba, tendão do calcâneo…). */
  readonly summary?: string;
  readonly ficha?: StructureCard;
}

export interface AnatomyData {
  readonly regions: readonly AnatomyRegion[];
  readonly refs: Readonly<Record<string, string>>;
  readonly structures: readonly AnatomyStructure[];
}

/** "Left Pronator teres" → "pronator teres": a chave que liga malha e estrutura. */
export function meshKey(name: string): string {
  return name
    .replace(/\b(left|right)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Texto comparável: sem acento, minúsculo — para busca e para conferir respostas. */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Todos os nomes pelos quais a estrutura pode ser procurada ou respondida. */
export function structureNames(structure: AnatomyStructure): string[] {
  const ficha = structure.ficha;
  return [
    structure.namePt,
    ...(ficha ? [ficha.nameEn, ficha.nameLatin, ...ficha.synonyms] : []),
  ].filter(Boolean);
}

export const LAYER_LABELS: Record<AnatomyLayer, string> = {
  "superficial muscles": "Músculos superficiais",
  "deep muscles": "Músculos profundos",
  skeleton: "Esqueleto",
};

export const MODEL_CREDIT =
  "Modelo 3D “ecorche”, de Charleeh (github.com/Charleeh/ecorche), CC BY-SA 4.0 — baseado em BodyParts3D (© The Database Center for Life Science, CC BY 4.0) e em Z-Anatomy (Gauthier Kervyn, CC BY-SA 4.0). Usado sem alterações na geometria. Fichas do MioLab.";
