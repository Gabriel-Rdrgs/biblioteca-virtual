import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/primitives";
import { DeckHeader } from "@/components/flashcards/deck-header";
import { FlashcardSession } from "@/components/flashcards/flashcard-session";
import { SharedDeckActions } from "@/components/flashcards/shared-deck-actions";
import { getDisciplines } from "@/lib/repository";
import { getSharedDeck } from "@/lib/repository/flashcards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Baralho da turma", robots: { index: false } };

export default async function SharedDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = await getSharedDeck(id);
  if (!deck) notFound();

  const discipline = (await getDisciplines()).find((d) => d.id === deck.disciplineId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Flashcards", href: "/flashcards" },
          { label: deck.title },
        ]}
      />
      <DeckHeader deck={deck} disciplineName={discipline?.shortName} />
      <FlashcardSession
        deck={deck}
        groupLabel={discipline?.shortName ?? deck.disciplineId}
        aside={<SharedDeckActions deck={deck} />}
      />
    </div>
  );
}
