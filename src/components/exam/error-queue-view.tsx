"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { loadErrorQueue, STREAK_TO_CLEAR, type QueuedError } from "@/lib/study-log";
import { ButtonLink, EmptyState } from "@/components/ui/primitives";

/**
 * A fila de erros: toda objetiva errada, em qualquer modo, até ser acertada
 * duas vezes seguidas. Mora no aparelho; esta página só a lê e manda para
 * o modo rápido com os ids na URL.
 */

function retryHref(items: readonly QueuedError[]): string {
  // Os mais errados primeiro: são os que mais valem o tempo.
  const ids = [...items]
    .sort((a, b) => b.misses - a.misses)
    .slice(0, 100)
    .map((item) => item.questionId);
  return `/estudar/rapido?origem=erros&questoes=${ids.join(",")}`;
}

export function ErrorQueueView({
  areas,
}: {
  areas: readonly { readonly id: string; readonly label: string; readonly discipline: string }[];
}) {
  const [queue, setQueue] = useState<QueuedError[] | null>(null);

  useEffect(() => setQueue(loadErrorQueue()), []);

  if (!queue) return <p className="text-ink-muted py-16 text-center text-sm">Carregando…</p>;

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Fila vazia"
        description="Nenhuma questão pendente. Quando você errar uma objetiva — no modo rápido ou num simulado corrigido —, ela aparece aqui até você acertar duas vezes seguidas."
        action={<ButtonLink href="/estudar/rapido">Fazer uma rodada rápida</ButtonLink>}
      />
    );
  }

  const groups = areas
    .map((area) => ({ area, items: queue.filter((q) => q.areaId === area.id) }))
    .filter((g) => g.items.length > 0);
  const known = new Set(areas.map((a) => a.id));
  const orphans = queue.filter((q) => !known.has(q.areaId));

  return (
    <div className="space-y-6">
      <div className="glass rounded-hero flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="font-display text-4xl tabular-nums">{queue.length}</p>
          <p className="text-ink-muted text-sm">
            {queue.length === 1 ? "questão esperando" : "questões esperando"} · saem com{" "}
            {STREAK_TO_CLEAR} acertos seguidos
          </p>
        </div>
        <ButtonLink href={retryHref(queue)} size="lg">
          <RotateCcw className="size-4" aria-hidden="true" />
          Revisar {Math.min(queue.length, 100)} agora
        </ButtonLink>
      </div>

      <ul className="space-y-3">
        {[...groups, ...(orphans.length ? [{ area: { id: "?", label: "Outras", discipline: "" }, items: orphans }] : [])].map(
          ({ area, items }) => {
            const topics = new Map<string, number>();
            for (const item of items) topics.set(item.topic, (topics.get(item.topic) ?? 0) + 1);
            return (
              <li key={area.id} className="glass rounded-panel p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{area.label}</h2>
                    <p className="text-ink-faint text-xs">
                      {area.discipline ? `${area.discipline} · ` : ""}
                      {items.length} {items.length === 1 ? "questão" : "questões"}
                    </p>
                  </div>
                  <ButtonLink href={retryHref(items)} size="sm" variant="secundario">
                    Revisar só esta área
                  </ButtonLink>
                </div>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {[...topics.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([topic, n]) => (
                      <li
                        key={topic}
                        className="bg-danger-soft text-danger rounded-full px-2.5 py-0.5 text-xs font-medium"
                      >
                        {topic}
                        {n > 1 ? <span className="ml-1 tabular-nums opacity-70">×{n}</span> : null}
                      </li>
                    ))}
                </ul>
              </li>
            );
          },
        )}
      </ul>
    </div>
  );
}
