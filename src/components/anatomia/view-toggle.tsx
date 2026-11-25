"use client";

import { PersonStanding, ScanLine } from "lucide-react";
import { setTrainerView, useAnatomyProgress, type TrainerView } from "@/lib/anatomy-progress";
import { cn } from "@/lib/utils";

/**
 * "Corpo" ou "Raio-X": como o treino mostra o músculo da vez.
 *
 * - Corpo: o corpo inteiro, os outros músculos apagados e o alvo aceso — dá
 *   para ver onde ele fica entre os vizinhos;
 * - Raio-X: só o alvo sólido, o resto em vulto — dá para ver a forma inteira.
 *
 * A escolha fica guardada no aparelho e vale para lições, revisão e desafio.
 */

const OPTIONS: readonly { id: TrainerView; label: string; icon: typeof ScanLine; hint: string }[] = [
  { id: "corpo", label: "Corpo", icon: PersonStanding, hint: "Os vizinhos à vista, apagados; o músculo da vez em destaque" },
  { id: "raiox", label: "Raio-X", icon: ScanLine, hint: "Só o músculo da vez sólido; o resto em transparência" },
];

export function ViewToggle({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const { view } = useAnatomyProgress();
  return (
    <div
      role="radiogroup"
      aria-label="Como mostrar o corpo"
      className={cn(
        "inline-flex gap-0.5 rounded-full p-0.5 text-xs font-semibold shadow-lg",
        tone === "dark" ? "bg-black/55 backdrop-blur" : "glass-strong",
        className,
      )}
    >
      {OPTIONS.map(({ id, label, icon: Icon, hint }) => {
        const on = view === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            title={hint}
            // Não tira o foco do campo de digitação.
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => setTrainerView(id)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 transition-colors",
              on
                ? "bg-[#ff4d3a] text-white"
                : tone === "dark"
                  ? "text-white/75 hover:text-white"
                  : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
