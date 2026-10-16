"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./button";
import { cn } from "@/lib/utils";

/**
 * O pop-up do Atlas.
 *
 * É o `<dialog>` do navegador, não uma camada improvisada com `position:
 * fixed`. A diferença não é estética: o elemento nativo já tranca o foco
 * dentro de si, devolve o foco ao botão que o abriu, fecha no Esc e esconde
 * o resto da página dos leitores de tela. Reescrever isso à mão é onde a
 * acessibilidade de um pop-up costuma morrer.
 *
 * No celular ele sobe do rodapé, porque é onde o dedo está, e no desktop
 * fica centrado. Em tela pequena nunca passa de 88% da altura: o conteúdo
 * rola por dentro, com o cabeçalho e o rodapé parados.
 */
export function Dialog({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  rodape,
  rotuloFechar = "Fechar",
}: {
  readonly aberto: boolean;
  readonly onFechar: () => void;
  readonly titulo: string;
  readonly descricao?: string;
  readonly children: ReactNode;
  readonly rodape?: ReactNode;
  readonly rotuloFechar?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (aberto && !el.open) el.showModal();
    if (!aberto && el.open) el.close();
  }, [aberto]);

  /**
   * O modal já impede o clique na página atrás, mas não a rolagem dela —
   * e rolar o fundo enquanto o pop-up fica parado lê como defeito.
   */
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={tituloId}
      // `close` cobre o Esc e o `close()` programático de uma vez.
      onClose={onFechar}
      onClick={(e) => {
        // Clicar fora fecha: fora é o próprio <dialog>, que só aparece
        // onde o conteúdo não cobre — ou seja, o fundo.
        if (e.target === ref.current) onFechar();
      }}
      className={cn(
        // Cor literal no fundo: o ::backdrop vive na camada de topo e nem sempre
        // enxerga as variáveis do tema, e um fundo que falha deixa o pop-up
        // flutuando sobre a página inteira legível, sem foco nenhum.
        "backdrop:bg-[rgb(0_0_0/0.55)] text-ink border-line fixed inset-x-0 bottom-0 top-auto m-0",
        // O navegador impõe max-width ao <dialog>; sem isto a folha não
        // encosta na borda direita do celular.
        "max-h-[88dvh] w-full max-w-none",
        "rounded-t-hero overflow-hidden border bg-surface p-0 shadow-[var(--shadow-lift)]",
        "sm:inset-0 sm:m-auto sm:max-h-[86dvh] sm:max-w-xl sm:rounded-hero",
      )}
    >
      {/* O dialog nativo não rola por dentro sozinho: a grade faz isso. */}
      <div className="grid max-h-[88dvh] grid-rows-[auto_1fr_auto] sm:max-h-[86dvh]">
        <div className="border-line flex items-start gap-3 border-b px-4 py-3.5 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={tituloId} className="text-lg leading-snug font-semibold">
              {titulo}
            </h2>
            {descricao ? (
              <p className="text-ink-muted mt-0.5 text-sm leading-relaxed">{descricao}</p>
            ) : null}
          </div>
          <IconButton label={rotuloFechar} onClick={onFechar} className="-mt-1 -mr-1 shrink-0">
            <X className="size-5" aria-hidden="true" />
          </IconButton>
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>

        {rodape ? (
          <div className="border-line flex flex-wrap items-center gap-3 border-t px-4 py-3 sm:px-6">
            {rodape}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
