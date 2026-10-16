"use client";

import { useSyncExternalStore } from "react";
import {
  getGradeBook,
  getServerGradeBook,
  subscribeGrades,
  type GradeBook,
} from "@/lib/grade-storage";

/**
 * As notas deste aparelho, iguais em todas as telas abertas.
 *
 * No servidor e no primeiro desenho o retrato é vazio — nota é coisa do
 * aparelho, e fingir saber antes de ler o armazenamento daria uma tela que
 * se contradiz na hidratação. Depois disso, qualquer escrita em qualquer
 * componente refaz todos de uma vez.
 */
export function useGradeBook(): GradeBook {
  return useSyncExternalStore(subscribeGrades, getGradeBook, getServerGradeBook);
}
