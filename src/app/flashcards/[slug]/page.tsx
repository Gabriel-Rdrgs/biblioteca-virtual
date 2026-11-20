import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/primitives";
import { DeckHeader } from "@/components/flashcards/deck-header";
import { FlashcardSession } from "@/components/flashcards/flashcard-session";
import { getDisciplines } from "@/lib/repository";
import { getQuestionArea } from "@/lib/repository/exams";
import { getStaticDeck } from "@/lib/repository/flashcards";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const deck = getStaticDeck(slug);
  if (!deck) notFound();
  return { title: `${deck.title} · Flashcards`, description: deck.description };
}

export default async function DeckPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deck = getStaticDeck(slug);
  if (!deck) notFound();

  const discipline = (await getDisciplines()).find((d) => d.id === deck.disciplineId);
  const area = deck.areaId ? getQuestionArea(deck.areaId) : undefined;
  const groupLabel = area?.label ?? discipline?.shortName ?? deck.disciplineId;

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
      <FlashcardSession deck={deck} groupLabel={groupLabel} />
    </div>
  );
}
