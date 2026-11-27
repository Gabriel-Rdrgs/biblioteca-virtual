import type { PracticeData, PracticeTopic } from "@/lib/domain/practice";
import mac1 from "./mac1.json";

/**
 * A prova prática de MAC I (N2), trazida do simulador que a turma usava.
 * As figuras moram em storage/flashcards (pratica-*.jpg) e são servidas pela
 * mesma rota das figuras dos flashcards, atrás da senha da turma.
 */
export const practiceData = mac1 as unknown as PracticeData;

export function figureUrl(file: string): string {
  return `/api/flashcards/figuras/${file}`;
}

export function getPracticeTopic(id: string): PracticeTopic | undefined {
  return practiceData.topics.find((t) => t.id === id);
}

/** Onde ver no corpo em 3D o que o tema da prova pede. */
export const TOPIC_ATLAS: Readonly<Record<string, readonly { id: string; label: string }[]>> = {
  umero: [
    { id: "umero", label: "Úmero" },
    { id: "escapula", label: "Escápula" },
  ],
  radial: [{ id: "umero", label: "Úmero (sulco do nervo radial, face posterior)" }],
  biceps: [
    { id: "biceps-braquial", label: "Bíceps braquial" },
    { id: "braquial", label: "Braquial" },
    { id: "radio", label: "Rádio" },
  ],
  cotovelo: [
    { id: "ulna", label: "Ulna" },
    { id: "radio", label: "Rádio" },
    { id: "extensor-radial-longo-do-carpo", label: "Extensor radial longo do carpo" },
    { id: "extensor-ulnar-do-carpo", label: "Extensor ulnar do carpo" },
  ],
  femur: [{ id: "femur", label: "Fêmur" }],
  joelho: [
    { id: "reto-femoral", label: "Reto femoral" },
    { id: "vasto-lateral", label: "Vasto lateral" },
    { id: "vasto-medial", label: "Vasto medial" },
    { id: "vasto-intermedio", label: "Vasto intermédio" },
    { id: "patela", label: "Patela" },
    { id: "tibia", label: "Tíbia" },
  ],
};
