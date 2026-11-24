import type { Metadata } from "next";
import { Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { ImageExam, type ImageDeck } from "@/components/exam/image-exam";
import type { OcclusionCard, PhotoCard } from "@/lib/domain/flashcard-types";
import { getImageDecks } from "@/lib/repository/flashcards";

export const metadata: Metadata = {
  title: "Simulado de imagem",
  description: "Uma figura por vez, sem legenda e com o relógio correndo, como na TV da prova prática.",
};
export const dynamic = "force-dynamic";

export default async function ImagemPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  const { materia } = await searchParams;
  const decks: ImageDeck[] = getImageDecks().map((deck) => {
    const cards = deck.cards.filter(
      (card): card is OcclusionCard | PhotoCard => card.kind !== "texto",
    );
    const used = new Set(cards.map((card) => card.imageId));
    return {
      id: deck.id,
      disciplineId: deck.disciplineId,
      title: deck.title,
      collection: deck.collection ?? deck.title,
      ...(deck.color ? { color: deck.color } : {}),
      cards,
      images: deck.images.filter((image) => used.has(image.id)),
    };
  });
  const total = decks.reduce((n, d) => n + d.cards.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        trail={[
          { label: "Início", href: "/" },
          { label: "Estudar", href: "/estudar" },
          { label: "Simulado de imagem" },
        ]}
      />
      <SectionHeading
        as="h1"
        title="Simulado de imagem"
        description={`O formato da TV da prova prática: uma figura por vez, sem legenda. Escreva o nome no papel, revele e marque se acertou. ${total} figuras — fotos de semiologia e estruturas marcadas do Moore.`}
      />
      <ImageExam
        decks={decks}
        {...(materia
          ? { initialSelected: decks.filter((d) => d.disciplineId === materia).map((d) => d.id) }
          : {})}
      />
    </div>
  );
}
