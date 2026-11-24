import { bankQuestions } from "@/lib/data/questions";
import { orderDecks, type OrderedUnit } from "@/lib/data/flashcards/units";
import { daysUntil, type Assessment } from "@/lib/domain/assessment-types";
import type { Exam, QuestionArea } from "@/lib/domain/exam-types";
import { summariseDeck, type DeckSummary, type FlashDeck } from "@/lib/domain/flashcard-types";
import type { Summary } from "@/lib/domain/summary-types";
import type { CatalogEntry, Discipline } from "@/lib/domain/types";
import { getBooksForDiscipline, getDisciplines, toCatalogEntries } from "@/lib/repository";
import { getAssessments } from "@/lib/repository/assessments";
import { getExams, getQuestionAreas } from "@/lib/repository/exams";
import {
  deckHref,
  getImageDecks,
  getOfficialDecks,
  getSharedDecks,
} from "@/lib/repository/flashcards";
import { getSummaries } from "@/lib/repository/summaries";

/**
 * Tudo o que serve para estudar para uma avaliação, já em ordem.
 *
 * A prova é o que a turma tem na cabeça ("a N2 de HA é hoje"), não a
 * ferramenta. Esta função parte da prova e junta, da matéria dela, o que já
 * existe no Atlas: simulados, questões do banco, baralhos, figuras para o
 * simulado de imagem, resumos e a bibliografia básica.
 */

export interface ExamPrep {
  readonly assessment: Assessment;
  readonly daysLeft: number;
  readonly discipline: Discipline;
  /** Os simulados ligados à prova primeiro; depois os outros da matéria. */
  readonly simulados: readonly Exam[];
  readonly linkedSimuladoIds: readonly string[];
  readonly areas: readonly { readonly area: QuestionArea; readonly objetivas: number }[];
  readonly deckUnits: readonly OrderedUnit<DeckSummary>[];
  readonly imageFigures: number;
  /** Resumos que a prova cobra, na ordem das aulas. */
  readonly summaries: readonly Summary[];
  /** Os outros resumos da matéria, para quem quer revisar tudo. */
  readonly otherSummaries: readonly Summary[];
  readonly books: readonly CatalogEntry[];
  /** As outras datas da mesma matéria, para navegar entre elas. */
  readonly siblings: readonly Assessment[];
}

export async function getExamPrep(assessmentId: string): Promise<ExamPrep | undefined> {
  const assessments = await getAssessments();
  const assessment = assessments.find((a) => a.id === assessmentId);
  if (!assessment) return undefined;
  const discipline = (await getDisciplines()).find((d) => d.id === assessment.disciplineId);
  if (!discipline) return undefined;
  const id = discipline.id;

  const examsOfDiscipline = getExams(id);
  const linked = examsOfDiscipline.filter((e) => assessment.examIds.includes(e.id));
  const simulados = [...linked, ...examsOfDiscipline.filter((e) => !linked.includes(e))];

  const areas = getQuestionAreas(id).map((area) => ({
    area,
    objetivas: bankQuestions.filter((q) => q.areaId === area.id && q.kind === "objetiva").length,
  }));

  const shared = await getSharedDecks().catch((): readonly FlashDeck[] => []);
  const decks = [
    ...getOfficialDecks(id),
    ...shared.filter((d) => d.disciplineId === id),
  ].map((deck) => summariseDeck(deck, deckHref(deck)));

  const imageFigures = getImageDecks()
    .filter((d) => d.disciplineId === id)
    .reduce((n, d) => n + d.cards.filter((c) => c.kind !== "texto").length, 0);

  const allSummaries = await getSummaries(id);
  const summaries = allSummaries.filter((s) => s.assessmentIds.includes(assessment.id));
  const otherSummaries = allSummaries.filter((s) => !s.assessmentIds.includes(assessment.id));

  const books = (await getBooksForDiscipline(id)).filter((entry) =>
    entry.links.some(
      (link) =>
        link.disciplineId === id &&
        (link.bibliographyType === "basica" || link.bibliographyType === "acervo_da_turma"),
    ),
  );

  return {
    assessment,
    daysLeft: daysUntil(assessment.date),
    discipline,
    simulados,
    linkedSimuladoIds: linked.map((e) => e.id),
    areas,
    deckUnits: orderDecks(id, decks),
    imageFigures,
    summaries,
    otherSummaries,
    books: toCatalogEntries(books.slice(0, 8)),
    siblings: assessments
      .filter((a) => a.disciplineId === id && a.id !== assessment.id)
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/** O endereço da página "estudar para esta prova". */
export function prepHref(assessmentId: string): string {
  return `/provas/${assessmentId}`;
}
