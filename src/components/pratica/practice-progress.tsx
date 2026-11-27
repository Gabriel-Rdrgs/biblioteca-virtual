"use client";

import { Check } from "lucide-react";
import { toggleStudied, usePracticeState } from "@/lib/practice-storage";
import { cn } from "@/lib/utils";

/** Os últimos simulados, com data e acerto. */
export function PracticeHistory() {
  const { runs } = usePracticeState();
  if (runs.length === 0) return null;
  const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return (
    <section aria-labelledby="historico">
      <h2 id="historico" className="mb-2 text-lg font-semibold">
        Seus simulados
      </h2>
      <ul className="glass divide-line divide-y rounded-2xl">
        {[...runs]
          .reverse()
          .slice(0, 6)
          .map((r) => (
            <li key={r.at} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="text-ink-muted">
                {fmt.format(r.at)}
                {r.fast ? " · treino rápido" : ""}
              </span>
              <span className="font-mono">
                {r.correct}/{r.total}
              </span>
            </li>
          ))}
      </ul>
    </section>
  );
}

/** Marca de "estudado" ao lado de um tema, na lista. */
export function StudiedMark({ topic }: { topic: string }) {
  const { studied } = usePracticeState();
  return studied.includes(topic) ? (
    <Check className="size-4 shrink-0 text-emerald-600" aria-label="Estudado" />
  ) : null;
}

/** O botão "marcar como estudado" no fim de um tema. */
export function StudiedToggle({ topic }: { topic: string }) {
  const { studied } = usePracticeState();
  const on = studied.includes(topic);
  return (
    <button
      type="button"
      onClick={() => toggleStudied(topic)}
      aria-pressed={on}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold",
        on ? "border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300" : "bg-ink text-canvas",
      )}
    >
      {on ? <Check className="size-4" aria-hidden="true" /> : null}
      {on ? "Estudado (desmarcar)" : "Marcar como estudado"}
    </button>
  );
}

/** Quantos temas já foram estudados, para o topo da página. */
export function StudiedCount({ total }: { total: number }) {
  const { studied } = usePracticeState();
  return (
    <span className="font-mono">
      {studied.length}/{total}
    </span>
  );
}
