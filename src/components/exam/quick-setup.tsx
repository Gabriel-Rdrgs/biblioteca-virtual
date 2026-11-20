"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { Button, ToggleChip } from "@/components/ui/primitives";

/**
 * Montar uma rodada do modo rápido: áreas, e — para quem já sabe onde está
 * fraco — eixos. Sem eixo marcado, vale a área inteira.
 */

export interface QuickArea {
  readonly id: string;
  readonly label: string;
  readonly discipline: string;
  readonly objetivas: number;
  readonly axes: readonly { readonly id: string; readonly label: string; readonly count: number }[];
}

const COUNTS = [10, 20, 30, 50] as const;

export function QuickSetup({ areas }: { areas: readonly QuickArea[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(areas[0] ? [areas[0].id] : []);
  const [axes, setAxes] = useState<string[]>([]);
  const [count, setCount] = useState<number>(20);

  const chosen = areas.filter((a) => selected.includes(a.id));
  const axisOptions = chosen.flatMap((a) => a.axes.filter((x) => x.count > 0));
  const available = axes.length
    ? axisOptions.filter((x) => axes.includes(x.id)).reduce((n, x) => n + x.count, 0)
    : chosen.reduce((n, a) => n + a.objetivas, 0);

  const toggleArea = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
    // Eixos de uma área desmarcada deixam de valer.
    const area = areas.find((a) => a.id === id);
    if (area && selected.includes(id)) {
      setAxes((current) => current.filter((x) => !area.axes.some((ax) => ax.id === x)));
    }
  };

  const start = () => {
    const query = new URLSearchParams({ areas: selected.join(","), n: String(count) });
    if (axes.length) query.set("eixos", axes.join(","));
    router.push(`/estudar/rapido?${query.toString()}`);
  };

  const byDiscipline = new Map<string, QuickArea[]>();
  for (const area of areas) {
    byDiscipline.set(area.discipline, [...(byDiscipline.get(area.discipline) ?? []), area]);
  }

  return (
    <div className="glass rounded-hero space-y-6 p-5 sm:p-6">
      <fieldset>
        <legend className="text-sm font-semibold">Áreas</legend>
        <div className="mt-2 space-y-3">
          {[...byDiscipline.entries()].map(([discipline, list]) => (
            <div key={discipline}>
              <p className="text-ink-faint mb-1.5 text-xs">{discipline}</p>
              <ul className="flex flex-wrap gap-2">
                {list.map((area) => (
                  <li key={area.id}>
                    <ToggleChip pressed={selected.includes(area.id)} onClick={() => toggleArea(area.id)}>
                      {area.label}
                      <span className="ml-1.5 opacity-70 tabular-nums">{area.objetivas}</span>
                    </ToggleChip>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </fieldset>

      {axisOptions.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-semibold">
            Eixos <span className="text-ink-faint font-normal">— opcional; sem nenhum, vale tudo</span>
          </legend>
          <ul className="mt-2 flex flex-wrap gap-2">
            {axisOptions.map((axis) => (
              <li key={axis.id}>
                <ToggleChip
                  pressed={axes.includes(axis.id)}
                  onClick={() =>
                    setAxes((current) =>
                      current.includes(axis.id)
                        ? current.filter((x) => x !== axis.id)
                        : [...current, axis.id],
                    )
                  }
                >
                  {axis.label}
                  <span className="ml-1.5 opacity-70 tabular-nums">{axis.count}</span>
                </ToggleChip>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="text-sm font-semibold">Quantas questões</legend>
        <ul className="mt-2 flex flex-wrap gap-2">
          {COUNTS.map((n) => (
            <li key={n}>
              <ToggleChip pressed={count === n} onClick={() => setCount(n)} disabled={n > available && n !== COUNTS[0]}>
                {n}
              </ToggleChip>
            </li>
          ))}
        </ul>
      </fieldset>

      <Button type="button" size="lg" onClick={start} disabled={selected.length === 0 || available === 0}>
        <Zap className="size-4" aria-hidden="true" />
        Começar {Math.min(count, available)} questões
      </Button>
    </div>
  );
}
