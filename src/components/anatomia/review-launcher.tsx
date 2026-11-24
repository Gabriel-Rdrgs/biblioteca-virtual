"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dueIds } from "@/lib/domain/anatomy-lessons";
import { getAnatomyProgress } from "@/lib/anatomy-progress";
import { NameTrainer, type TrainerMuscle } from "./name-trainer";

/**
 * A revisão do dia: lê no aparelho o que venceu e abre o treino só com a
 * rodada de memória. A lista é tirada uma vez, ao abrir — responder não a
 * muda no meio do caminho.
 */

const MAX_REVIEW = 20;

export function ReviewLauncher({ muscles }: { muscles: readonly TrainerMuscle[] }) {
  const [queue, setQueue] = useState<TrainerMuscle[] | null>(null);

  useEffect(() => {
    const byId = new Map(muscles.map((m) => [m.id, m]));
    const due = dueIds(getAnatomyProgress().cards, Date.now())
      .flatMap((id) => {
        const m = byId.get(id);
        return m ? [m] : [];
      })
      .slice(0, MAX_REVIEW);
    setQueue(due);
  }, [muscles]);

  if (queue === null) return <div className="min-h-[60vh]" aria-busy="true" />;

  if (queue.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">Revisão</p>
        <h2 className="mt-2 text-2xl font-semibold">Revisões em dia</h2>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Nenhum músculo venceu hoje. Aproveite para fazer uma lição nova — o que você escrever de memória
          volta aqui amanhã.
        </p>
        <Link
          href="/anatomia/licoes"
          className="bg-primary text-on-primary mt-5 inline-flex min-h-10 items-center rounded-full px-5 text-sm font-semibold"
        >
          Ver as lições
        </Link>
      </div>
    );
  }

  return <NameTrainer mode="revisao" title="Revisar hoje" muscles={queue} exitHref="/anatomia/licoes" />;
}
