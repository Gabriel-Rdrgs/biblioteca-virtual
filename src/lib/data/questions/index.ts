import type { BankQuestion, QuestionArea } from "@/lib/domain/exam-types";
import { aesArea, aesQuestions } from "./aes-2";
import { anatomiaArea, anatomiaQuestions } from "./anatomia";
import { icArea, icQuestions } from "./ic-1";
import { parasitologiaArea, parasitologiaQuestions } from "./parasitologia";

/**
 * O banco de questões da turma, por área.
 *
 * Cada unidade curricular tem uma ou mais áreas (MAC I: anatomia,
 * parasitologia e, quando houver, histologia e embriologia; IC I e AES 2
 * têm uma só). Acrescentar uma área é acrescentar um arquivo aqui — nada
 * mais precisa mudar.
 */

export const questionAreas: readonly QuestionArea[] = [
  anatomiaArea,
  parasitologiaArea,
  icArea,
  aesArea,
];

export const bankQuestions: readonly BankQuestion[] = [
  ...anatomiaQuestions,
  ...parasitologiaQuestions,
  ...icQuestions,
  ...aesQuestions,
];
