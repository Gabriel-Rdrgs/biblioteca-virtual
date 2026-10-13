import type { BankQuestion, QuestionArea } from "@/lib/domain/exam-types";
import { anatomiaArea, anatomiaQuestions } from "./anatomia";
import { parasitologiaArea, parasitologiaQuestions } from "./parasitologia";

/**
 * O banco de questões da turma, por área.
 *
 * Cada unidade curricular tem uma ou mais áreas (MAC I: anatomia,
 * parasitologia e, quando houver, histologia e embriologia). Acrescentar
 * uma área é acrescentar um arquivo aqui — nada mais precisa mudar.
 */

export const questionAreas: readonly QuestionArea[] = [anatomiaArea, parasitologiaArea];

export const bankQuestions: readonly BankQuestion[] = [
  ...anatomiaQuestions,
  ...parasitologiaQuestions,
];
