"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";
import type { PracticeFigure as Figure } from "@/lib/domain/practice";
import { cn } from "@/lib/utils";

/**
 * A figura de uma estação: a imagem do livro (com os números já impressos),
 * o número perguntado circulado quando a questão diz onde ele está, e — na
 * foto do modelo do laboratório — os pontos numerados por cima.
 *
 * Tocar amplia em tela cheia, com as mesmas marcações: no celular, uma
 * lâmina de histologia não se lê no tamanho da coluna.
 */

interface Props {
  figure: Figure;
  src: string;
  /** O número perguntado: [x, y, largura, altura] em % da imagem. */
  box?: readonly number[] | undefined;
  /** Pontos do modelo a numerar, na ordem. */
  points?: readonly string[] | undefined;
  /** Mostrar a legenda dos pontos (fora do simulado). */
  pointLabels?: boolean;
  /** Mostrar o gabarito dos números, recolhido. */
  showKey?: boolean;
  className?: string;
  /** Altura máxima da imagem na coluna. */
  maxHeight?: string;
}

function Marked({
  figure,
  src,
  box,
  points,
  maxHeight,
}: Pick<Props, "figure" | "src" | "box" | "points"> & { maxHeight: string }) {
  const marks =
    points
      ?.map((k) => figure.points?.[k])
      .filter((p): p is { x: number; y: number; label: string } => !!p) ?? [];
  return (
    <span className="relative inline-block max-w-full align-top">
      <Image
        src={src}
        alt={figure.caption}
        width={figure.width}
        height={figure.height}
        unoptimized
        className="block h-auto w-auto max-w-full rounded-lg bg-white"
        style={{ maxHeight }}
        draggable={false}
      />
      {box && box.length === 4 ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute animate-pulse rounded-full border-[3px] border-[#d9262b] shadow-[0_0_0_2px_#fff,0_0_0_7px_rgba(217,38,43,0.35)]"
          style={{
            left: `${(box[0] ?? 0) - 1}%`,
            top: `${(box[1] ?? 0) - 1}%`,
            width: `${(box[2] ?? 0) + 2}%`,
            height: `${(box[3] ?? 0) + 2}%`,
          }}
        />
      ) : null}
      {marks.map((p, i) => (
        <span
          key={p.label}
          aria-hidden="true"
          className="pointer-events-none absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-[#151515] text-xs font-bold text-white shadow-lg sm:size-8"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {i + 1}
        </span>
      ))}
    </span>
  );
}

export function PracticeFigure({
  figure,
  src,
  box,
  points,
  pointLabels = false,
  showKey = false,
  className,
  maxHeight = "60vh",
}: Props) {
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  const labels = points?.map((k) => figure.points?.[k]?.label).filter((l): l is string => !!l) ?? [];

  return (
    <figure className={cn("bg-surface border-line rounded-2xl border p-2.5", className)}>
      <button
        type="button"
        onClick={() => setZoom(true)}
        className="group relative block w-full cursor-zoom-in text-center"
        aria-label={`Ampliar: ${figure.caption}`}
      >
        <Marked figure={figure} src={src} box={box} points={points} maxHeight={maxHeight} />
        <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
          <Maximize2 className="size-3" aria-hidden="true" />
          Ampliar
        </span>
      </button>
      <figcaption className="text-ink-muted mt-2 px-1 text-xs leading-snug">
        <span className="text-ink font-medium">{figure.caption}</span>
        <br />
        {figure.source} · {figure.ref}
      </figcaption>
      {pointLabels && labels.length ? (
        <ol className="mt-2 list-decimal px-1 pl-6 text-sm">
          {labels.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
      ) : null}
      {showKey && figure.key.length ? (
        <details className="border-line mt-2 rounded-xl border px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium">
            Gabarito dos números ({figure.key.length})
          </summary>
          <ol className="mt-2 list-decimal space-y-0.5 pl-5">
            {figure.key.map((k, i) => (
              <li key={`${i}-${k}`}>{k}</li>
            ))}
          </ol>
        </details>
      ) : null}

      {zoom ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={figure.caption}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-3"
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 grid size-11 place-items-center rounded-full bg-white/10 text-white"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-h-full overflow-auto">
            <Marked figure={figure} src={src} box={box} points={points} maxHeight="88dvh" />
          </div>
        </div>
      ) : null}
    </figure>
  );
}
