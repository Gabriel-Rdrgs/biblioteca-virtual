"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Target, X } from "lucide-react";
import {
  fold,
  structureNames,
  type AnatomyData,
  type AnatomyLayer,
  type AnatomyStructure,
} from "@/lib/domain/anatomy-types";
import { cn } from "@/lib/utils";
import { AnatomyViewer, type AnatomyPick, type ViewName } from "./anatomy-viewer";
import { StructureCardView } from "./structure-card";
import { ViewerControls } from "./viewer-controls";

/**
 * O atlas: procurar pelo nome ou tocar no corpo, e ler a ficha.
 *
 * As duas portas levam ao mesmo lugar — a estrutura selecionada acende no
 * modelo (os dois lados, todas as partes) e a ficha abre ao lado. Tocar num
 * osso diz o nome dele; as fichas de ossos são a próxima etapa.
 */

export function AnatomyAtlas({ data, initialId }: { data: AnatomyData; initialId?: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialId && data.structures.some((s) => s.id === initialId) ? initialId : null,
  );
  const [bonePick, setBonePick] = useState<AnatomyPick | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [layers, setLayers] = useState<Record<AnatomyLayer, boolean>>({
    skeleton: true,
    "deep muscles": true,
    "superficial muscles": true,
  });
  const [opacity, setOpacity] = useState(1);
  const [view, setView] = useState<{ name: ViewName; nonce: number }>({ name: "front", nonce: 0 });

  const byKey = useMemo(() => {
    const map = new Map<string, AnatomyStructure>();
    for (const s of data.structures) for (const p of s.parts) map.set(p.toLowerCase(), s);
    return map;
  }, [data.structures]);

  const regionById = useMemo(() => new Map(data.regions.map((r) => [r.id, r])), [data.regions]);
  const selected = selectedId ? data.structures.find((s) => s.id === selectedId) : undefined;

  const list = useMemo(() => {
    const q = fold(query);
    return data.structures.filter(
      (s) =>
        (!region || s.region === region) &&
        (q.length < 2 || structureNames(s).some((n) => fold(n).includes(q))),
    );
  }, [data.structures, region, query]);

  const select = (structure: AnatomyStructure | undefined) => {
    setSelectedId(structure?.id ?? null);
    setBonePick(null);
  };

  const onPick = (pick: AnatomyPick | null) => {
    if (!pick) return select(undefined);
    const found = byKey.get(pick.key);
    if (found) return select(found);
    setSelectedId(null);
    setBonePick(pick);
  };

  return (
    <div className="grid gap-4 lg:h-[calc(100dvh-9rem)] lg:grid-cols-[17rem_minmax(0,1fr)_24rem]">
      {/* ------------------------------------------------------ lista */}
      <aside className="glass rounded-panel flex min-h-0 flex-col p-3 lg:order-none">
        <label className="relative block">
          <span className="sr-only">Buscar estrutura</span>
          <Search
            className="text-ink-faint pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Músculo em português, inglês ou latim…"
            className="bg-surface border-line focus:border-primary min-h-10 w-full rounded-full border py-2 pr-3 pl-9 text-sm outline-none"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRegion(null)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              region === null ? "bg-primary text-on-primary" : "glass-strong text-ink-muted",
            )}
          >
            Todas
          </button>
          {data.regions.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegion(r.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                region === r.id ? "bg-primary text-on-primary" : "glass-strong text-ink-muted",
              )}
            >
              {r.short}
            </button>
          ))}
        </div>
        <ul className="mt-3 max-h-72 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1 lg:max-h-none">
          {list.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => select(s)}
                aria-current={s.id === selectedId ? "true" : undefined}
                className={cn(
                  "w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
                  s.id === selectedId ? "bg-primary-soft text-primary font-semibold" : "hover:glass-strong",
                )}
              >
                {s.namePt}
                {s.kind === "connective" ? (
                  <span className="text-ink-faint ml-1 text-xs">· conjuntivo</span>
                ) : null}
              </button>
            </li>
          ))}
          {list.length === 0 ? (
            <li className="text-ink-muted px-2 py-3 text-sm">Nenhuma estrutura com esse nome.</li>
          ) : null}
        </ul>
        <Link
          href="/anatomia/quiz"
          className="bg-primary text-on-primary mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold"
        >
          <Target className="size-4" aria-hidden="true" />
          Treinar no quiz
        </Link>
      </aside>

      {/* ------------------------------------------------------- corpo */}
      <section
        aria-label="Corpo em 3D"
        className="rounded-panel relative h-[62vh] min-h-[24rem] overflow-hidden bg-[radial-gradient(ellipse_at_center,#1b2333,#0a0d14_70%)] lg:h-auto"
      >
        <AnatomyViewer
          selectedKeys={selected?.parts.map((p) => p.toLowerCase()) ?? (bonePick ? [bonePick.key] : [])}
          layers={layers}
          superficialOpacity={opacity}
          view={view}
          onPick={onPick}
        />
        <div className="absolute inset-x-2 top-2">
          <ViewerControls
            layers={layers}
            onToggle={(layer) => setLayers((l) => ({ ...l, [layer]: !l[layer] }))}
            opacity={opacity}
            onOpacity={setOpacity}
            onView={(name) => setView((v) => ({ name, nonce: v.nonce + 1 }))}
          />
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-white/60">
          Arraste para girar · pinça ou roda para aproximar · toque num músculo para abrir a ficha
        </p>
      </section>

      {/* ------------------------------------------------------- ficha */}
      <aside className="glass rounded-panel min-h-0 overflow-y-auto p-5" aria-live="polite">
        {selected ? (
          <>
            <button
              type="button"
              onClick={() => select(undefined)}
              className="text-ink-faint hover:text-ink float-right -mt-1 -mr-1 p-1"
              aria-label="Fechar ficha"
            >
              <X className="size-4" />
            </button>
            <StructureCardView
              structure={selected}
              region={regionById.get(selected.region)}
              refs={data.refs}
            />
          </>
        ) : bonePick ? (
          <div className="space-y-2">
            <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">
              {bonePick.layer === "skeleton" ? "Esqueleto" : "Estrutura"}
            </p>
            <h2 className="text-2xl font-semibold">{bonePick.name}</h2>
            <p className="text-ink-muted text-sm leading-relaxed">
              As fichas dos ossos — acidentes, articulações, o que passa por cada forame — são a
              próxima etapa da anatomia 3D. Por enquanto, o nome do modelo.
            </p>
          </div>
        ) : (
          <div className="text-ink-muted space-y-3 text-sm leading-relaxed">
            <h2 className="text-ink text-lg font-semibold">Toque num músculo</h2>
            <p>
              Gire o corpo e toque em qualquer músculo para ver origem, inserção, ação, inervação e
              o ponto de prova — ou procure pelo nome na lista.
            </p>
            <p>
              Para ver os profundos, desligue os superficiais ou use a transparência. São{" "}
              {data.structures.length} estruturas com ficha, em {data.regions.length} regiões.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
