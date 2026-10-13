"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Composes a simulado from the bank.
 *
 * A unidade curricular covers several áreas and a real exam draws from two
 * or three of them, so the choice of áreas is the first thing asked. The
 * counts default to a short drill, since the long one already exists as a
 * fixed simulado.
 */

export interface DrillArea {
  readonly id: string;
  readonly label: string;
  readonly discursivas: number;
  readonly objetivas: number;
}

export function DrillBuilder({
  disciplineId,
  areas,
}: {
  disciplineId: string;
  areas: readonly DrillArea[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(areas.map((area) => area.id));
  const [objetivas, setObjetivas] = useState(15);
  const [discursivas, setDiscursivas] = useState(3);

  const chosen = areas.filter((area) => selected.includes(area.id));
  const availableObj = chosen.reduce((sum, area) => sum + area.objetivas, 0);
  const availableDis = chosen.reduce((sum, area) => sum + area.discursivas, 0);

  // Split the requested totals across the chosen áreas, remainder first.
  const parts = chosen.map((area, i) => {
    const share = (total: number) =>
      Math.floor(total / chosen.length) + (i < total % chosen.length ? 1 : 0);
    return `${area.id}:${share(Math.min(discursivas, availableDis))}:${share(
      Math.min(objetivas, availableObj),
    )}`;
  });

  const start = () => {
    const query = new URLSearchParams({ materia: disciplineId, partes: parts.join(",") });
    router.push(`/simulados/treino?${query.toString()}`);
  };

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium">Áreas</legend>
        <ul className="mt-2 flex flex-wrap gap-2">
          {areas.map((area) => {
            const on = selected.includes(area.id);
            return (
              <li key={area.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setSelected((current) =>
                      current.includes(area.id)
                        ? current.filter((id) => id !== area.id)
                        : [...current, area.id],
                    )
                  }
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    on ? "bg-primary text-on-primary" : "glass-strong text-ink-muted",
                  )}
                >
                  {area.label}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Objetivas</span>
          <span className="text-ink-faint"> — até {availableObj}</span>
          <input
            type="number"
            min={0}
            max={availableObj}
            value={objetivas}
            onChange={(event) => setObjetivas(Math.max(0, Number(event.target.value)))}
            className="glass-strong focus:border-primary mt-1.5 w-full rounded-full border border-transparent px-4 py-2 text-sm outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Discursivas</span>
          <span className="text-ink-faint"> — até {availableDis}</span>
          <input
            type="number"
            min={0}
            max={availableDis}
            value={discursivas}
            onChange={(event) => setDiscursivas(Math.max(0, Number(event.target.value)))}
            className="glass-strong focus:border-primary mt-1.5 w-full rounded-full border border-transparent px-4 py-2 text-sm outline-none"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={start}
        disabled={chosen.length === 0 || objetivas + discursivas === 0}
        className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        Montar treino de {Math.min(discursivas, availableDis) +
          Math.min(objetivas, availableObj)}{" "}
        questões
      </button>
    </div>
  );
}
