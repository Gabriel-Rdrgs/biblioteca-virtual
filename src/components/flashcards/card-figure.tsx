"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { deckImageSrc, type DeckImage } from "@/lib/domain/flashcard-types";
import { cn } from "@/lib/utils";

/**
 * Uma figura de cartão, com a marca da oclusão por cima quando houver.
 *
 * A caixa vem em porcentagem e é posicionada sobre um invólucro do tamanho
 * exato da imagem — por isso o `inline-block`: a figura encolhe para caber
 * na tela e a marca encolhe junto, sempre em cima da mesma estrutura.
 */
export function CardFigure({
  image,
  box,
  revealed = false,
  onZoom,
  className,
  maxHeight = "max-h-[52vh]",
}: {
  image: DeckImage;
  box?: readonly [number, number, number, number];
  revealed?: boolean;
  onZoom?: (image: DeckImage) => void;
  className?: string;
  maxHeight?: string;
}) {
  return (
    <div className={cn("relative rounded-panel bg-white p-2 shadow-[var(--shadow-raise)]", className)}>
      <div className="relative inline-block max-w-full align-top">
        <Image
          src={deckImageSrc(image)}
          alt={image.caption ?? "Figura do cartão"}
          width={image.width}
          height={image.height}
          unoptimized
          draggable={false}
          className={cn("block h-auto w-auto max-w-full", maxHeight)}
        />
        {box ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute grid place-items-center rounded",
              revealed
                ? "border-danger border-[2.5px] bg-[rgb(217_38_43/0.18)] shadow-[0_0_0_3px_#fff]"
                : "occlusion-mark bg-danger font-display text-sm font-semibold text-white sm:text-base",
            )}
            style={{
              left: `${box[0]}%`,
              top: `${box[1]}%`,
              width: `${box[2]}%`,
              height: `${box[3]}%`,
            }}
          >
            {revealed ? null : "?"}
          </span>
        ) : null}
      </div>
      {onZoom ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onZoom(image);
          }}
          className="bg-ink text-canvas absolute right-3 bottom-3 inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[0.65rem] font-semibold tracking-[0.12em] uppercase"
        >
          <Maximize2 className="size-3" aria-hidden="true" />
          Ampliar
        </button>
      ) : null}
    </div>
  );
}

/** A figura em tela cheia. Fecha no clique, no botão ou no Esc. */
export function FigureLightbox({
  image,
  box,
  revealed = true,
  onClose,
}: {
  image: DeckImage | null;
  box?: readonly [number, number, number, number];
  revealed?: boolean;
  onClose: () => void;
}) {
  if (!image) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.caption ?? "Figura ampliada"}
      className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90 p-4 sm:p-8"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <button
        type="button"
        autoFocus
        onClick={onClose}
        className="absolute top-4 right-4 min-h-10 rounded-full border border-white/40 px-4 text-sm font-medium text-white"
      >
        Fechar
      </button>
      <CardFigure image={image} box={box} revealed={revealed} maxHeight="max-h-[86vh]" />
    </div>
  );
}
