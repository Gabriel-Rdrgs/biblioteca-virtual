import type { ReactNode } from "react";
import type { FlashDeck } from "@/lib/domain/flashcard-types";
import { Badge } from "@/components/ui/primitives";

const ORIGIN_LABEL: Record<FlashDeck["origin"], string> = {
  oficial: "Oficial",
  banco: "Do banco de questões",
  turma: "Da turma",
  meu: "Meu baralho",
};

/** Título, origem e fonte de um baralho, acima da sessão. */
export function DeckHeader({
  deck,
  disciplineName,
  action,
}: {
  deck: FlashDeck;
  disciplineName?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tom={deck.origin === "oficial" ? "primario" : "neutro"}>
            {ORIGIN_LABEL[deck.origin]}
          </Badge>
          {disciplineName ? <Badge tom="contorno">{disciplineName}</Badge> : null}
          {deck.collection && deck.origin === "oficial" ? (
            <span className="text-ink-faint text-xs">{deck.collection}</span>
          ) : null}
        </div>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{deck.title}</h1>
        {deck.description ? (
          <p className="text-ink-muted mt-2 text-sm leading-relaxed text-pretty">
            {deck.description}
          </p>
        ) : null}
        {deck.author ? <p className="text-ink-faint mt-1 text-xs">Publicado por {deck.author}</p> : null}
        {deck.sourceNote ? (
          <p className="text-ink-faint mt-2 text-xs leading-relaxed">{deck.sourceNote}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
