"use client";

import { useState, type ReactNode } from "react";
import { PencilLine } from "lucide-react";
import { schemeFor } from "@/lib/data/grading";
import { Button, Dialog } from "@/components/ui/primitives";
import { GradeSheet } from "./grade-sheet";

/**
 * O botão que abre a folha de notas de uma disciplina.
 *
 * O mesmo botão em todo lugar: na matéria, no cartão da prova que já
 * passou, no painel de notas. Anotar nota é sempre a mesma tarefa, então é
 * sempre a mesma tela — quem aprendeu a fazer num lugar já sabe fazer nos
 * outros.
 *
 * A folha só é montada enquanto o pop-up está aberto: assim cada abertura
 * começa dos números que estão guardados, sem herdar o que a abertura
 * anterior deixou no campo.
 */
export function GradeDialog({
  disciplineId,
  disciplineName,
  rotulo,
  variant = "secundario",
  size = "sm",
  block,
  className,
  children,
}: {
  readonly disciplineId: string;
  readonly disciplineName: string;
  /** O que o botão diz; o padrão serve para a maioria dos lugares. */
  readonly rotulo?: string;
  readonly variant?: "primario" | "secundario" | "fantasma";
  readonly size?: "sm" | "md";
  readonly block?: boolean;
  readonly className?: string;
  /** Substitui o conteúdo do botão, quando o lugar pede outra coisa. */
  readonly children?: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const scheme = schemeFor(disciplineId);
  if (!scheme) return null;

  const texto = rotulo ?? "Anotar notas";

  return (
    <>
      <Button
        variant={variant}
        size={size}
        {...(block ? { block: true } : {})}
        {...(className ? { className } : {})}
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        aria-label={`${texto} — ${disciplineName}`}
      >
        {children ?? (
          <>
            <PencilLine className="size-4" aria-hidden="true" />
            {texto}
          </>
        )}
      </Button>

      <Dialog
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo={disciplineName}
        descricao="A média e o que falta se refazem a cada número."
        rotuloFechar="Fechar as notas"
        rodape={
          <Button variant="primario" size="sm" className="ml-auto" onClick={() => setAberto(false)}>
            Pronto
          </Button>
        }
      >
        {aberto ? <GradeSheet scheme={scheme} disciplineName={disciplineName} /> : null}
      </Dialog>
    </>
  );
}
