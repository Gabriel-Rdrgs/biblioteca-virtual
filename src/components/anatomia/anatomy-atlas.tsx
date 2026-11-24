"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Contrast,
  Crosshair,
  Eye,
  EyeOff,
  Focus,
  GraduationCap,
  ScanLine,
  Search,
  Target,
  X,
} from "lucide-react";
import {
  fold,
  structureNames,
  type AnatomyData,
  type AnatomyLayer,
  type AnatomyStructure,
} from "@/lib/domain/anatomy-types";
import { cn } from "@/lib/utils";
import {
  AnatomyViewer,
  type AnatomyPick,
  type Emphasis,
  type FocusRequest,
  type ViewName,
} from "./anatomy-viewer";
import { StructureCardView } from "./structure-card";
import { ViewerControls } from "./viewer-controls";

/**
 * O atlas: procurar pelo nome ou tocar no corpo, e ler a ficha.
 *
 * Funciona como os atlas 3D de estudo: passar o mouse acende a estrutura e
 * diz o nome; escolher uma leva a câmera até ela e prende uma etiqueta nela;
 * e o que está na frente pode sair do caminho — esmaecer o resto, ver em
 * raio-X, isolar a estrutura ou ocultar o que atrapalha.
 */

/** "Left Humerus" → "Humerus (esquerdo)": o nome do modelo, enquanto os ossos não têm ficha. */
function modelName(name: string): string {
  const side = /\bleft\b/i.test(name) ? " (esquerdo)" : /\bright\b/i.test(name) ? " (direito)" : "";
  const base = name.replace(/\b(left|right)\b/gi, "").replace(/\s+/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1) + side;
}

const EMPHASIS: readonly { id: Exclude<Emphasis, "none">; label: string; icon: typeof Eye }[] = [
  { id: "fade", label: "Esmaecer o resto", icon: Contrast },
  { id: "xray", label: "Raio-X", icon: ScanLine },
  { id: "isolate", label: "Isolar", icon: Focus },
];

export function AnatomyAtlas({ data, initialId }: { data: AnatomyData; initialId?: string }) {
  const initial =
    initialId && data.structures.some((s) => s.id === initialId) ? initialId : null;
  const [selectedId, setSelectedId] = useState<string | null>(initial);
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
  const [emphasis, setEmphasis] = useState<Emphasis>("none");
  const [hidden, setHidden] = useState<readonly string[]>([]);
  // Chegando pela ficha (?estrutura=), a câmera já vai até ela.
  const [focusReq, setFocusReq] = useState<FocusRequest | null>(() => {
    const s = initial ? data.structures.find((x) => x.id === initial) : undefined;
    return s ? { keys: s.parts.map((p) => p.toLowerCase()), padding: 2.6, nonce: 1 } : null;
  });
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null);

  const byKey = useMemo(() => {
    const map = new Map<string, AnatomyStructure>();
    for (const s of data.structures) for (const p of s.parts) map.set(p.toLowerCase(), s);
    return map;
  }, [data.structures]);

  const regionById = useMemo(() => new Map(data.regions.map((r) => [r.id, r])), [data.regions]);
  const selected = selectedId ? data.structures.find((s) => s.id === selectedId) : undefined;
  const selectedKeys = selected?.parts.map((p) => p.toLowerCase()) ?? (bonePick ? [bonePick.key] : []);
  const label = selected?.namePt ?? (bonePick ? modelName(bonePick.name) : "");

  const list = useMemo(() => {
    const q = fold(query);
    return data.structures.filter(
      (s) =>
        (!region || s.region === region) &&
        (q.length < 2 || structureNames(s).some((n) => fold(n).includes(q))),
    );
  }, [data.structures, region, query]);

  const flyTo = (keys: readonly string[]) =>
    setFocusReq((f) => ({ keys, padding: 2.6, nonce: (Number(f?.nonce) || 0) + 1 }));

  const select = (structure: AnatomyStructure | undefined, fly = true) => {
    setSelectedId(structure?.id ?? null);
    setBonePick(null);
    if (!structure) setEmphasis("none");
    else if (fly) flyTo(structure.parts.map((p) => p.toLowerCase()));
  };

  const onPick = (pick: AnatomyPick | null) => {
    if (!pick) return select(undefined);
    const found = byKey.get(pick.key);
    if (found) return select(found, false);
    setSelectedId(null);
    setBonePick(pick);
  };

  const onHover = (pick: AnatomyPick | null, x: number, y: number) => {
    if (!pick) return setHover(null);
    const s = byKey.get(pick.key);
    setHover({ label: s?.namePt ?? modelName(pick.name), x, y });
  };

  const hideSelection = () => {
    if (!selectedKeys.length) return;
    setHidden((h) => [...new Set([...h, ...selectedKeys])]);
    select(undefined);
  };

  return (
    <div className="grid gap-4 lg:h-[calc(100dvh-9rem)] lg:grid-cols-[17rem_minmax(0,1fr)_24rem]">
      {/* ------------------------------------------------------ lista */}
      <aside className="glass rounded-panel flex min-h-0 flex-col p-3">
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
                  s.id === selectedId
                    ? "bg-primary-soft text-primary font-semibold"
                    : "hover:glass-strong",
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
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/anatomia"
            className="bg-primary text-on-primary inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full text-sm font-semibold"
          >
            <GraduationCap className="size-4" aria-hidden="true" />
            Lições
          </Link>
          <Link
            href="/anatomia/quiz"
            className="glass-strong inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full text-sm font-semibold"
          >
            <Target className="size-4" aria-hidden="true" />
            Desafiar
          </Link>
        </div>
      </aside>

      {/* ------------------------------------------------------- corpo */}
      <section
        aria-label="Corpo em 3D"
        className="rounded-panel relative h-[62vh] min-h-[24rem] overflow-hidden bg-[radial-gradient(ellipse_at_center,#1b2333,#0a0d14_70%)] lg:h-auto"
      >
        <AnatomyViewer
          selectedKeys={selectedKeys}
          hiddenKeys={hidden}
          layers={layers}
          superficialOpacity={opacity}
          emphasis={emphasis}
          view={view}
          focus={focusReq}
          pin={label ? { keys: selectedKeys, text: label } : null}
          onPick={onPick}
          onHover={onHover}
        />
        {hover && hover.label !== label ? (
          <div
            className="pointer-events-none absolute z-10 rounded-full bg-black/80 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-lg"
            style={{ left: hover.x + 14, top: hover.y + 14 }}
          >
            {hover.label}
          </div>
        ) : null}
        <div className="absolute inset-x-2 top-2">
          <ViewerControls
            layers={layers}
            onToggle={(layer) => setLayers((l) => ({ ...l, [layer]: !l[layer] }))}
            opacity={opacity}
            onOpacity={setOpacity}
            onView={(name) => setView((v) => ({ name, nonce: v.nonce + 1 }))}
          />
        </div>

        {/* Ações sobre o que está selecionado, como num atlas 3D. */}
        <div className="absolute inset-x-2 bottom-2 flex flex-col items-center gap-2">
          {selectedKeys.length ? (
            <div
              className="glass-strong flex flex-wrap items-center justify-center gap-1 rounded-full p-1 text-xs"
              role="toolbar"
              aria-label={`Ações para ${label}`}
            >
              <button
                type="button"
                onClick={() => flyTo(selectedKeys)}
                className="hover:glass inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 font-medium"
              >
                <Crosshair className="size-3.5" aria-hidden="true" /> Focar
              </button>
              {EMPHASIS.map(({ id, label: text, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={emphasis === id}
                  onClick={() => setEmphasis((e) => (e === id ? "none" : id))}
                  className={cn(
                    "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 font-medium",
                    emphasis === id ? "bg-primary text-on-primary" : "hover:glass",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" /> {text}
                </button>
              ))}
              <button
                type="button"
                onClick={hideSelection}
                className="hover:glass inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 font-medium"
              >
                <EyeOff className="size-3.5" aria-hidden="true" /> Ocultar
              </button>
            </div>
          ) : (
            <p className="pointer-events-none text-center text-xs text-white/60">
              Arraste para girar · pinça ou roda para aproximar · toque num músculo para abrir a
              ficha
            </p>
          )}
          {hidden.length ? (
            <button
              type="button"
              onClick={() => setHidden([])}
              className="glass-strong inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium"
            >
              <Eye className="size-3.5" aria-hidden="true" /> Mostrar tudo ({hidden.length}{" "}
              {hidden.length === 1 ? "oculta" : "ocultas"})
            </button>
          ) : null}
        </div>
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
            <h2 className="text-2xl font-semibold">{modelName(bonePick.name)}</h2>
            <p className="text-ink-muted text-sm leading-relaxed">
              As fichas dos ossos — acidentes, articulações, o que passa por cada forame — são a
              próxima etapa da anatomia 3D. Por enquanto, o nome do modelo.
            </p>
          </div>
        ) : (
          <div className="text-ink-muted space-y-3 text-sm leading-relaxed">
            <h2 className="text-ink text-lg font-semibold">Toque num músculo</h2>
            <p>
              Passe o mouse para ver o nome; toque para abrir origem, inserção, ação, inervação e
              o ponto de prova — ou procure pelo nome na lista, e a câmera vai até ele.
            </p>
            <p>
              Com um músculo escolhido, dá para esmaecer o resto, ver em raio-X, isolá-lo ou
              ocultar o que está na frente. São {data.structures.length} estruturas com ficha, em{" "}
              {data.regions.length} regiões.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
