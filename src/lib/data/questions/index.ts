import type { BankQuestion, QuestionArea } from "@/lib/domain/exam-types";
import { parasitologiaArea, parasitologiaQuestions } from "./parasitologia";

/**
 * O banco de questões da turma, por área.
 *
 * Cada unidade curricular tem uma ou mais áreas (MAC I: parasitologia,
 * anatomia, histologia, embriologia). Acrescentar uma área é acrescentar
 * um arquivo aqui — nada mais precisa mudar.
 */

export const questionAreas: readonly QuestionArea[] = [parasitologiaArea];

export const bankQuestions: readonly BankQuestion[] = [...parasitologiaQuestions];
