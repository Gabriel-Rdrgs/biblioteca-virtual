import type { Metadata } from "next";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { DeckHub } from "@/components/flashcards/deck-hub";
import { getDisciplines } from "@/lib/repository";
import { getDeckSummaries } from "@/lib/repository/flashcards";

export const metadata: Metadata = {
  title: "Flashcards",
  description: "Baralhos oficiais, do banco de questões e da turma, com revisão espaçada.",
};

export const dynamic = "force-dynamic";

export default async function FlashcardsPage() {
  const [summaries, disciplines] = await Promise.all([getDeckSummaries(), getDisciplines()]);
  const total =
    summaries.oficiais.length + summaries.banco.length + summaries.turma.length;

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
        description={`Vire o cartão, diga se sabia e o Atlas decide quando ele volta: o que você erra aparece amanhã, o que você sabe some por semanas. ${total} baralhos, e você pode escrever os seus.`}
      />
      <DeckHub
        oficiais={summaries.oficiais}
        banco={summaries.banco}
        turma={summaries.turma}
        disciplines={disciplines.map((d) => ({ id: d.id, name: d.name, shortName: d.shortName }))}
      />
    </div>
  );
}
