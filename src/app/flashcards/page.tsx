import type { Metadata } from "next";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { DeckHub, type HubGroup } from "@/components/flashcards/deck-hub";
import { orderDecks } from "@/lib/data/flashcards/units";
import { assessmentLabel, countdownLabel, isExam } from "@/lib/domain/assessment-types";
import { getDisciplines } from "@/lib/repository";
import { getUpcomingAssessments } from "@/lib/repository/assessments";
import { getDeckSummaries } from "@/lib/repository/flashcards";

export const metadata: Metadata = {
  title: "Flashcards",
  description: "Baralhos por matéria, na ordem do plano de ensino, com revisão espaçada.",
};

export const dynamic = "force-dynamic";

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  const { materia } = await searchParams;
  const [summaries, disciplines, upcoming] = await Promise.all([
    getDeckSummaries(),
    getDisciplines(),
    getUpcomingAssessments(),
  ]);
  const all = [...summaries.oficiais, ...summaries.banco, ...summaries.turma];

  const groups: HubGroup[] = disciplines
    .map((discipline) => {
      const decks = all.filter((d) => d.disciplineId === discipline.id);
      const next = upcoming.find(
        (u) => u.assessment.disciplineId === discipline.id && isExam(u.assessment),
      );
      return {
        discipline: {
          id: discipline.id,
          name: discipline.name,
          shortName: discipline.shortName,
          color: discipline.color,
        },
        units: orderDecks(discipline.id, decks),
        ...(next
          ? {
              nextExam: {
                id: next.assessment.id,
                label: assessmentLabel(next.assessment).split(" — ")[0] ?? "",
                when: countdownLabel(next.daysLeft),
              },
            }
          : {}),
        soon: next?.daysLeft ?? Number.POSITIVE_INFINITY,
      };
    })
    .filter((g) => g.units.length > 0)
    // A matéria da prova mais próxima primeiro: é a que se estuda agora.
    .sort((a, b) => a.soon - b.soon)
    .map(({ soon: _soon, ...group }) => group);

  const decks = all.length;
  const cards = all.reduce((n, d) => n + d.cardIds.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Estudar", href: "/estudar" },
          { label: "Flashcards" },
        ]}
      />
      <SectionHeading
        as="h1"
        title="Flashcards"
        description={`${decks} baralhos e ${cards} cartões, por matéria e na ordem do plano de ensino — a matéria da prova mais próxima vem primeiro. Vire o cartão, diga se sabia, e o que você errar volta amanhã.`}
      />
      <DeckHub groups={groups} {...(materia ? { initialFilter: materia } : {})} />
    </div>
  );
}
