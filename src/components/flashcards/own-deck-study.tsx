"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import type { FlashDeck } from "@/lib/domain/flashcard-types";
import { loadOwnDeck, type OwnDeck } from "@/lib/flashcard-storage";
import { ButtonLink, EmptyState } from "@/components/ui/primitives";
import { DeckHeader } from "./deck-header";
import { FlashcardSession } from "./flashcard-session";
import type { HubDiscipline } from "./deck-hub";

export function ownDeckToFlashDeck(deck: OwnDeck): FlashDeck {
  return {
    id: `meu:${deck.id}`,
    slug: deck.id,
    origin: "meu",
    title: deck.title,
    description: deck.description,
    disciplineId: deck.disciplineId,
    updatedAt: deck.updatedAt,
    cards: deck.cards.map((card) => ({
      id: card.id,
      kind: "texto" as const,
      front: card.front,
      back: card.back,
    })),
    images: [],
  };
}

/** Um baralho que só existe neste aparelho — por isso lido no cliente. */
export function OwnDeckStudy({
  id,
  disciplines,
}: {
  id: string;
  disciplines: readonly HubDiscipline[];
}) {
  const [deck, setDeck] = useState<OwnDeck | null | undefined>(undefined);

  useEffect(() => {
    setDeck(loadOwnDeck(id) ?? null);
  }, [id]);

  if (deck === undefined) {
    return <p className="text-ink-muted py-16 text-center text-sm">Carregando…</p>;
  }
  if (deck === null) {
    return (
      <EmptyState
        title="Baralho não encontrado neste aparelho"
        description="Baralhos próprios ficam no navegador em que foram criados. Se você o exportou, importe o arquivo aqui."
        action={
          <ButtonLink href="/flashcards/novo?importar=1" variant="secundario">
            Importar baralho
          </ButtonLink>
        }
      />
    );
  }

  const flash = ownDeckToFlashDeck(deck);
  const discipline = disciplines.find((d) => d.id === deck.disciplineId);

  return (
    <>
      <DeckHeader
        deck={flash}
        disciplineName={discipline?.shortName}
        action={
          <ButtonLink href={`/flashcards/meus/${deck.id}/editar`} variant="secundario" size="sm">
            <Pencil className="size-4" aria-hidden="true" />
            Editar
          </ButtonLink>
        }
      />
      {flash.cards.length === 0 ? (
        <EmptyState
          title="Este baralho ainda não tem cartões"
          description="Escreva o primeiro: uma pergunta curta na frente, a resposta no verso."
          action={<ButtonLink href={`/flashcards/meus/${deck.id}/editar`}>Escrever cartões</ButtonLink>}
        />
      ) : (
        <FlashcardSession deck={flash} groupLabel={discipline?.shortName ?? "Meus baralhos"} />
      )}
    </>
  );
}
