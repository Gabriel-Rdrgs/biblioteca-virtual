"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Pencil } from "lucide-react";
import type { FlashDeck } from "@/lib/domain/flashcard-types";
import { loadOwnDecks, newId, saveOwnDeck } from "@/lib/flashcard-storage";
import { Button, ButtonLink } from "@/components/ui/primitives";

/**
 * Ao lado de um baralho da turma: copiar para os seus (e mexer à vontade)
 * ou, se foi este aparelho que publicou, editar o original.
 */
export function SharedDeckActions({ deck }: { deck: FlashDeck }) {
  const router = useRouter();
  const [ownerDeckId, setOwnerDeckId] = useState<string | null>(null);

  useEffect(() => {
    const mine = loadOwnDecks().find((d) => d.published?.id === deck.slug);
    setOwnerDeckId(mine?.id ?? null);
  }, [deck.slug]);

  const copy = () => {
    const now = new Date().toISOString();
    const id = newId("b");
    saveOwnDeck({
      id,
      title: `${deck.title} (cópia)`,
      description: deck.description,
      disciplineId: deck.disciplineId,
      cards: deck.cards.flatMap((card) =>
        card.kind === "texto" ? [{ id: newId("c"), front: card.front, back: card.back }] : [],
      ),
      createdAt: now,
      updatedAt: now,
    });
    router.push(`/flashcards/meus/${id}/editar`);
  };

  return (
    <section className="glass rounded-panel space-y-2 p-4">
      <h2 className="text-ink-faint mb-1 text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
        Este baralho
      </h2>
      {ownerDeckId ? (
        <ButtonLink href={`/flashcards/meus/${ownerDeckId}/editar`} size="sm" block>
          <Pencil className="size-4" aria-hidden="true" />
          Editar (você publicou)
        </ButtonLink>
      ) : null}
      <Button type="button" size="sm" variant="secundario" block onClick={copy}>
        <Copy className="size-4" aria-hidden="true" />
        Copiar para meus baralhos
      </Button>
    </section>
  );
}
