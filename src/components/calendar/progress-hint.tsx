"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { summariseProgress } from "@/lib/domain/progress";
import { loadHistory } from "@/lib/exam-storage";

/**
 * O cruzamento entre a prova e o que você já errou.
 *
 * O simulado sabe em que eixo você está fraco; o calendário sabe quando cai
 * a prova que cobra aquele eixo. Separados, os dois são relatórios. Juntos,
 * viram "faltam 12 dias e você está em 45% nisto".
 *
 * Lê só o localStorage deste aparelho, então renderiza depois de montar —
 * e some de vez quando não há nada a dizer, em vez de ocupar espaço com uma
 * caixa vazia.
 */
export function ProgressHint({
  axisIds,
  daysLeft,
}: {
  readonly axisIds: readonly string[];
  readonly daysLeft: number;
}) {
  const [fracos, setFracos] = useState<{ label: string; latest: number }[] | null>(null);

  useEffect(() => {
    const resumo = summariseProgress(loadHistory());
    const alvo = new Set(axisIds);
    setFracos(
      resumo.toRevise
        .filter((eixo) => alvo.has(eixo.id))
        .slice(0, 3)
        .map((eixo) => ({ label: eixo.label, latest: Math.round(eixo.latest) })),
    );
  }, [axisIds]);

  if (!fracos || fracos.length === 0) return null;

  return (
    <div className="bg-accent-soft rounded-control mt-3 p-3">
      <p className="text-accent flex items-center gap-1.5 text-xs font-semibold">
        <Target className="size-3.5" aria-hidden="true" />
        {daysLeft === 0
          ? "É hoje, e isto aqui ainda está fraco"
          : `Faltam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}, e isto aqui ainda está fraco`}
      </p>
      <ul className="text-ink-muted mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {fracos.map((eixo) => (
          <li key={eixo.label}>
            {eixo.label}{" "}
            <span className="text-accent font-semibold tabular-nums">{eixo.latest}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
