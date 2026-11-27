"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  ChevronDown,
  ChevronUp,
  Contrast,
  Crosshair,
  Eye,
  EyeOff,
  Focus,
  GraduationCap,
  Highlighter,
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
  type LandmarkIndex,
} from "@/lib/domain/anatomy-types";
import { cn } from "@/lib/utils";
import {
  AnatomyViewer,
  type AnatomyPick,
  type Emphasis,
  type FocusRequest,
  type Marker,
  type ViewName,
} from "./anatomy-viewer";
import { StructureCardView } from "./structure-card";
import { ViewerControls } from "./viewer-controls";

/**
 * O atlas: procurar pelo nome ou tocar no corpo, e ler a ficha.
 *
 * Organizado como um atlas de papel: escolhe-se o sistema (ossos ou
 * músculos), a região e então a estrutura — ou busca-se pelo nome. A câmera
 * vai até o que foi escolhido e uma etiqueta fica presa nele. Num osso, os
 * acidentes aparecem como pontos numerados no próprio modelo.
 *
 * Como nos atlas 3D de estudo, o que está na frente pode sair do caminho:
 * destacar (o resto apagado), esmaecer, ver em raio-X, isolar ou ocultar.
 *
 * No computador são três colunas: índice, corpo, ficha. No celular o corpo
 * ocupa a tela; o índice abre por cima e a ficha sobe numa gaveta.
 */

export type AtlasSystem = "ossos" | "musculos";

/** "Left Humerus" → "Humerus (esquerdo)": nome do modelo, para peças sem estrutura. */
function modelName(name: string): string {
  const side = /\bleft\b/i.test(name) ? " (esquerdo)" : /\bright\b/i.test(name) ? " (direito)" : "";
  const base = name.replace(/\b(left|right)\b/gi, "").replace(/\s+/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1) + side;
}

const EMPHASIS: readonly { id: Exclude<Emphasis, "none">; label: string; icon: typeof Eye }[] = [
  { id: "dim", label: "Destacar", icon: Highlighter },
  { id: "fade", label: "Esmaecer o resto", icon: Contrast },
  { id: "xray", label: "Raio-X", icon: ScanLine },
  { id: "isolate", label: "Isolar", icon: Focus },
];

const keysOf = (structures: readonly AnatomyStructure[]) =>
  structures.flatMap((s) => s.parts.map((p) => p.toLowerCase()));

/* -------------------------------------------------- o índice */

function StructureTree({
  data,
  landmarks,
  selectedId,
  initialTab,
  initialRegion,
  autoFocus,
  onSelect,
  onRegion,
}: {
  data: AnatomyData;
  landmarks: LandmarkIndex;
  selectedId: string | null;
  initialTab: AtlasSystem;
  initialRegion: string | null;
  autoFocus?: boolean;
  onSelect: (s: AnatomyStructure) => void;
  onRegion: (regionId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<AtlasSystem>(initialTab);
  const [open, setOpen] = useState<string | null>(initialRegion);

  const results = useMemo(() => {
    const q = fold(query);
    if (q.length < 2) return [];
    const starts = data.structures.filter((s) => fold(s.namePt).startsWith(q));
    const rest = data.structures.filter(
      (s) => !starts.includes(s) && structureNames(s).some((n) => fold(n).includes(q)),
    );
    return [...starts, ...rest];
  }, [data.structures, query]);

  const item = (s: AnatomyStructure) => {
    const marks = landmarks[s.id]?.length ?? 0;
    return (
      <li key={s.id}>
        <button
          type="button"
          onClick={() => onSelect(s)}
          aria-current={s.id === selectedId ? "true" : undefined}
          className={cn(
            "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[15px] transition-colors lg:min-h-9 lg:py-1.5 lg:text-sm",
            s.id === selectedId ? "bg-primary-soft text-primary font-semibold" : "hover:glass-strong",
          )}
        >
          <span className="min-w-0 truncate">{s.namePt}</span>
          {marks ? (
            <span className="text-ink-faint shrink-0 font-mono text-[11px]" title="Acidentes no modelo">
              {marks} pts
            </span>
          ) : null}
        </button>
      </li>
    );
  };

  const groups = (regionId: string): { title: string | null; items: AnatomyStructure[] }[] => {
    const here = data.structures.filter((s) => s.region === regionId);
    if (tab === "ossos") {
      return [
        { title: null, items: here.filter((s) => s.kind === "bone") },
        { title: "Outras estruturas", items: here.filter((s) => s.kind !== "bone" && s.layer === "skeleton") },
      ];
    }
    return [
      { title: "Superficiais", items: here.filter((s) => s.kind === "muscle" && s.layer === "superficial") },
      { title: "Profundos", items: here.filter((s) => s.kind === "muscle" && s.layer === "deep") },
      { title: "Fáscias e tendões", items: here.filter((s) => s.kind !== "muscle" && s.layer !== "skeleton") },
    ];
  };

  return (
    <>
      <label className="relative block">
        <span className="sr-only">Buscar estrutura</span>
        <Search
          className="text-ink-faint pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar em português, inglês ou latim…"
          className="bg-surface border-line focus:border-primary min-h-11 w-full rounded-full border py-2 pr-3 pl-9 text-base outline-none lg:min-h-10 lg:text-sm"
        />
      </label>

      {query.trim().length >= 2 ? (
        <ul className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {results.map(item)}
          {results.length === 0 ? (
            <li className="text-ink-muted px-2 py-3 text-sm">Nada com esse nome.</li>
          ) : null}
        </ul>
      ) : (
        <>
          <div className="bg-surface-sunken mt-3 grid grid-cols-2 gap-1 rounded-full p-1 text-sm" role="tablist">
            {(
              [
                ["ossos", "Ossos"],
                ["musculos", "Músculos"],
              ] as const
            ).map(([id, text]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  "min-h-9 rounded-full font-medium transition-colors lg:min-h-8",
                  tab === id ? "bg-surface text-ink shadow-sm" : "text-ink-muted",
                )}
              >
                {text}
              </button>
            ))}
          </div>

          {/* Uma região aberta por vez: o índice não vira uma parede de nomes. */}
          <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {data.regions.map((r) => {
              const g = groups(r.id).filter((x) => x.items.length);
              const total = g.reduce((n, x) => n + x.items.length, 0);
              if (!total) return null;
              const isOpen = open === r.id;
              return (
                <li key={r.id} className={cn("rounded-xl", isOpen && "bg-surface-sunken/60")}>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : r.id)}
                      aria-expanded={isOpen}
                      className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 text-left font-medium"
                    >
                      <ChevronDown
                        className={cn("text-ink-faint size-4 shrink-0 transition-transform", !isOpen && "-rotate-90")}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 truncate">{r.name}</span>
                      <span className="text-ink-faint ml-auto shrink-0 font-mono text-xs">{total}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRegion(r.id)}
                      className="text-ink-muted hover:text-primary grid size-11 shrink-0 place-items-center rounded-xl lg:size-9"
                      aria-label={`Ver ${r.name.toLowerCase()} em 3D`}
                      title="Ver a região em 3D"
                    >
                      <Box className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  {isOpen ? (
                    <div className="px-1 pb-2">
                      {g.map((x) => (
                        <div key={x.title ?? "itens"}>
                          {x.title ? (
                            <p className="text-ink-faint text-micro mt-2 mb-0.5 px-2.5 font-semibold tracking-[0.12em] uppercase">
                              {x.title}
                            </p>
                          ) : null}
                          <ul className="space-y-0.5">{x.items.map(item)}</ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------ atlas */

export function AnatomyAtlas({
  data,
  landmarks,
  initialId,
  initialSystem,
  initialRegion,
  initialLandmark,
}: {
  data: AnatomyData;
  landmarks: LandmarkIndex;
  initialId?: string;
  initialSystem?: AtlasSystem;
  initialRegion?: string;
  /** Um acidente do osso de `initialId`, já aceso. */
  initialLandmark?: string;
}) {
  const initialStructure = initialId ? data.structures.find((s) => s.id === initialId) : undefined;
  const region0 =
    initialRegion && data.regions.some((r) => r.id === initialRegion) ? initialRegion : null;
  const system0: AtlasSystem =
    initialSystem ?? (initialStructure?.layer === "skeleton" ? "ossos" : "musculos");

  const [selectedId, setSelectedId] = useState<string | null>(initialStructure?.id ?? null);
  const [bonePick, setBonePick] = useState<AnatomyPick | null>(null);
  // Entrando pelo sistema esquelético, os músculos começam desligados.
  const [layers, setLayers] = useState<Record<AnatomyLayer, boolean>>(() => {
    const bonesOnly = initialSystem === "ossos";
    return { skeleton: true, "deep muscles": !bonesOnly, "superficial muscles": !bonesOnly };
  });
  const [opacity, setOpacity] = useState(1);
  const [view, setView] = useState<{ name: ViewName; nonce: number }>({ name: "front", nonce: 0 });
  // Chegando direto num osso com os músculos ligados, ele estaria escondido: começa destacado (músculos em véu).
  const [emphasis, setEmphasis] = useState<Emphasis>(() =>
    initialStructure?.layer === "skeleton" && initialSystem !== "ossos" ? "dim" : "none",
  );
  const [hidden, setHidden] = useState<readonly string[]>([]);
  // A câmera já começa no que foi pedido: a estrutura, ou a região inteira.
  const [focusReq, setFocusReq] = useState<FocusRequest | null>(() => {
    if (initialStructure) return { keys: keysOf([initialStructure]), padding: 2.6, nonce: 1 };
    if (region0) {
      return { keys: keysOf(data.structures.filter((s) => s.region === region0)), padding: 1.25, nonce: 1 };
    }
    return null;
  });
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null);
  const [searching, setSearching] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeMark, setActiveMark] = useState<string | null>(() =>
    initialStructure && initialLandmark && landmarks[initialStructure.id]?.some((m) => m.id === initialLandmark)
      ? initialLandmark
      : null,
  );

  const byKey = useMemo(() => {
    const map = new Map<string, AnatomyStructure>();
    for (const s of data.structures) for (const p of s.parts) map.set(p.toLowerCase(), s);
    return map;
  }, [data.structures]);

  const regionById = useMemo(() => new Map(data.regions.map((r) => [r.id, r])), [data.regions]);
  const selected = selectedId ? data.structures.find((s) => s.id === selectedId) : undefined;
  const selectedKeys = selected ? keysOf([selected]) : bonePick ? [bonePick.key] : [];
  const label = selected?.namePt ?? (bonePick ? modelName(bonePick.name) : "");
  const marks = useMemo(() => (selected ? (landmarks[selected.id] ?? []) : []), [landmarks, selected]);
  const markers: Marker[] = useMemo(
    () => marks.map((m) => ({ id: m.id, label: m.name, pos: m.pos, normal: m.normal, mirror: m.mirror })),
    [marks],
  );
  const activeInfo = marks.find((m) => m.id === activeMark);
  // O acidente escolhido acende na superfície do osso, no lado virado para a câmera.
  const spot = useMemo(
    () =>
      activeInfo
        ? {
            keys: [activeInfo.part],
            pos: activeInfo.pos,
            mirror: activeInfo.mirror,
            side: "auto" as const,
            ...(activeInfo.path ? { path: activeInfo.path } : {}),
          }
        : null,
    [activeInfo],
  );

  // Com o índice aberto no celular, a página de trás não rola.
  useEffect(() => {
    if (!searching) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [searching]);

  const flyTo = (keys: readonly string[], padding = 2.6) =>
    setFocusReq((f) => ({ keys, padding, nonce: (Number(f?.nonce) || 0) + 1 }));

  const select = (structure: AnatomyStructure | undefined, fly = true) => {
    setSelectedId(structure?.id ?? null);
    setBonePick(null);
    setSheetOpen(false);
    setActiveMark(null);
    if (!structure) return setEmphasis("none");
    if (!fly) return;
    flyTo(keysOf([structure]));
    // Osso escolhido pelo índice com os músculos à vista: destaca, com os músculos em véu.
    if (structure.layer === "skeleton" && layers["superficial muscles"]) {
      setEmphasis((e) => (e === "none" ? "dim" : e));
    }
  };

  const showRegion = (regionId: string) => {
    select(undefined);
    flyTo(keysOf(data.structures.filter((s) => s.region === regionId)), 1.25);
  };

  const onPick = (pick: AnatomyPick | null) => {
    if (!pick) return select(undefined);
    const found = byKey.get(pick.key);
    if (found) return select(found, false);
    setSelectedId(null);
    setSheetOpen(false);
    setActiveMark(null);
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

  const toggleMark = (id: string) => {
    const turningOn = activeMark !== id;
    setActiveMark(turningOn ? id : null);
    const m = marks.find((x) => x.id === id);
    // Acender um acidente aproxima a câmera dele, de frente para a superfície.
    if (turningOn && m) {
      setFocusReq((f) => ({
        keys: [m.part],
        point: { pos: m.pos, normal: m.normal, mirror: m.mirror },
        nonce: (Number(f?.nonce) || 0) + 1,
      }));
    }
  };

  /** As ações sobre o selecionado; no celular, só os ícones. */
  const actions = (compact: boolean) => (
    <div
      className={cn(
        "flex items-center gap-1 text-xs",
        compact ? "justify-between" : "glass-strong flex-wrap justify-center rounded-full p-1",
      )}
      role="toolbar"
      aria-label={`Ações para ${label}`}
    >
      <button
        type="button"
        onClick={() => flyTo(selectedKeys)}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium",
          compact ? "glass size-11 justify-center" : "hover:glass min-h-8 px-3",
        )}
        aria-label="Focar"
        title="Focar"
      >
        <Crosshair className="size-4" aria-hidden="true" />
        {compact ? null : "Focar"}
      </button>
      {EMPHASIS.map(({ id, label: text, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={emphasis === id}
          aria-label={text}
          title={text}
          onClick={() => setEmphasis((e) => (e === id ? "none" : id))}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium",
            compact ? "size-11 justify-center" : "min-h-8 px-3",
            emphasis === id ? "bg-primary text-on-primary" : compact ? "glass" : "hover:glass",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
          {compact ? null : text}
        </button>
      ))}
      <button
        type="button"
        onClick={hideSelection}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium",
          compact ? "glass size-11 justify-center" : "hover:glass min-h-8 px-3",
        )}
        aria-label="Ocultar"
        title="Ocultar"
      >
        <EyeOff className="size-4" aria-hidden="true" />
        {compact ? null : "Ocultar"}
      </button>
    </div>
  );

  const card = selected ? (
    <StructureCardView
      structure={selected}
      region={regionById.get(selected.region)}
      refs={data.refs}
      landmarks={marks}
      activeLandmark={activeMark}
      onLandmark={toggleMark}
    />
  ) : bonePick ? (
    <div className="space-y-2">
      <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">Peça do modelo</p>
      <h2 className="text-2xl font-semibold">{modelName(bonePick.name)}</h2>
    </div>
  ) : null;

  const tree = (mobile: boolean) => (
    <StructureTree
      data={data}
      landmarks={landmarks}
      selectedId={selectedId}
      initialTab={system0}
      initialRegion={region0 ?? selected?.region ?? null}
      autoFocus={mobile}
      onSelect={(s) => {
        if (mobile) setSearching(false);
        select(s);
      }}
      onRegion={(id) => {
        if (mobile) setSearching(false);
        showRegion(id);
      }}
    />
  );

  return (
    <div className="flex flex-col gap-4 lg:grid lg:h-[calc(100dvh-9rem)] lg:grid-cols-[18rem_minmax(0,1fr)_24rem]">
      {/* ------------------------------------------------ índice (computador) */}
      <aside className="glass rounded-panel hidden min-h-0 flex-col p-3 lg:flex">
        {tree(false)}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/anatomia/licoes"
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
        className="rounded-panel relative h-[calc(100dvh-10.5rem)] min-h-[22rem] overflow-hidden bg-[radial-gradient(ellipse_at_center,#1b2333,#0a0d14_70%)] lg:h-auto"
      >
        <AnatomyViewer
          selectedKeys={selectedKeys}
          hiddenKeys={hidden}
          layers={layers}
          superficialOpacity={opacity}
          emphasis={emphasis}
          view={view}
          focus={focusReq}
          pin={label && !marks.length ? { keys: selectedKeys, text: label } : null}
          markers={markers}
          spot={spot}
          activeMarker={activeMark}
          onMarker={toggleMark}
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

        <div className="absolute inset-x-2 top-2 flex items-start gap-2">
          <button
            type="button"
            onClick={() => setSearching(true)}
            className="glass-strong inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold lg:hidden"
          >
            <Search className="size-4" aria-hidden="true" />
            Índice
          </button>
          <div className="min-w-0 flex-1">
            <ViewerControls
              layers={layers}
              onToggle={(layer) => setLayers((l) => ({ ...l, [layer]: !l[layer] }))}
              opacity={opacity}
              onOpacity={setOpacity}
              onView={(name) => setView((v) => ({ name, nonce: v.nonce + 1 }))}
            />
          </div>
        </div>

        <div className="absolute inset-x-2 bottom-2 flex flex-col items-center gap-2">
          {selectedKeys.length ? (
            <div className="hidden lg:block">{actions(false)}</div>
          ) : (
            <p className="pointer-events-none text-center text-xs text-white/60">
              <span className="hidden lg:inline">
                Arraste para girar · roda para aproximar · passe o mouse para ver o nome · clique
                para abrir a ficha
              </span>
              <span className="lg:hidden">Arraste para girar · pinça para aproximar · toque numa estrutura</span>
            </p>
          )}
          {hidden.length ? (
            <button
              type="button"
              onClick={() => setHidden([])}
              className="glass-strong inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium"
            >
              <Eye className="size-3.5" aria-hidden="true" /> Mostrar tudo ({hidden.length}{" "}
              {hidden.length === 1 ? "oculta" : "ocultas"})
            </button>
          ) : null}
        </div>
      </section>

      {/* ------------------------------------------------ ficha (computador) */}
      <aside className="glass rounded-panel hidden min-h-0 overflow-y-auto p-5 lg:block" aria-live="polite">
        {card ? (
          <>
            <button
              type="button"
              onClick={() => select(undefined)}
              className="text-ink-faint hover:text-ink float-right -mt-1 -mr-1 p-1"
              aria-label="Fechar ficha"
            >
              <X className="size-4" />
            </button>
            {card}
          </>
        ) : (
          <div className="text-ink-muted space-y-3 text-sm leading-relaxed">
            <h2 className="text-ink text-lg font-semibold">Escolha uma estrutura</h2>
            <p>
              No índice, escolha o sistema e a região; ou toque direto no corpo. O botão{" "}
              <Box className="inline size-3.5" aria-label="3D" /> ao lado de cada região leva a câmera
              até ela.
            </p>
            <p>
              Nos ossos, os acidentes aparecem como pontos numerados no modelo. São{" "}
              {data.structures.filter((s) => s.kind === "muscle").length} músculos e{" "}
              {data.structures.filter((s) => s.kind === "bone").length} ossos com ficha.
            </p>
          </div>
        )}
      </aside>

      {/* ------------------------------------------------ celular: atalhos */}
      <div className="grid grid-cols-2 gap-2 lg:hidden">
        <Link
          href="/anatomia/licoes"
          className="bg-primary text-on-primary inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full text-sm font-semibold"
        >
          <GraduationCap className="size-4" aria-hidden="true" />
          Lições
        </Link>
        <Link
          href="/anatomia/quiz"
          className="glass-strong inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full text-sm font-semibold"
        >
          <Target className="size-4" aria-hidden="true" />
          Desafiar
        </Link>
      </div>

      {/* ------------------------------------------------ celular: gaveta da ficha */}
      {card ? (
        <div
          className={cn(
            "fixed inset-x-0 z-50 px-2 lg:hidden",
            sheetOpen ? "top-16 bottom-0" : "bottom-[calc(env(safe-area-inset-bottom)+4.75rem)]",
          )}
        >
          <div
            className={cn(
              "glass-strong mx-auto flex max-w-lg flex-col shadow-2xl",
              sheetOpen ? "h-full rounded-t-3xl" : "rounded-3xl",
            )}
          >
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
              <button
                type="button"
                onClick={() => setSheetOpen((o) => !o)}
                aria-expanded={sheetOpen}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <ChevronUp
                  className={cn("text-ink-faint size-5 shrink-0 transition-transform", sheetOpen && "rotate-180")}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{label}</span>
                  <span className="text-ink-faint block text-xs">
                    {sheetOpen ? "Toque para fechar a ficha" : "Toque para ver a ficha"}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => select(undefined)}
                className="text-ink-faint -mr-1 grid size-10 shrink-0 place-items-center"
                aria-label="Fechar"
              >
                <X className="size-5" />
              </button>
            </div>
            {sheetOpen ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                {card}
              </div>
            ) : (
              <div className="space-y-2 px-3 pb-3">
                {/* Acidentes do osso: uma fileira que rola de lado; o escolhido diz o que é. */}
                {marks.length ? (
                  <>
                    <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
                      {marks.map((m, i) => (
                        <li key={m.id} className="shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleMark(m.id)}
                            aria-pressed={activeMark === m.id}
                            className={cn(
                              "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap",
                              activeMark === m.id ? "bg-[#ff4d3a] text-white" : "glass",
                            )}
                          >
                            <span className="font-mono font-bold">{i + 1}</span>
                            {m.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {activeInfo ? (
                      <p className="text-ink-muted px-1 text-xs leading-snug">{activeInfo.info}</p>
                    ) : null}
                  </>
                ) : null}
                {actions(true)}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------ celular: índice */}
      {searching ? (
        <div className="bg-canvas fixed inset-0 z-50 flex flex-col p-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-lg font-semibold">Índice do atlas</p>
            <button
              type="button"
              onClick={() => setSearching(false)}
              className="glass-strong grid size-10 place-items-center rounded-full"
              aria-label="Fechar o índice"
            >
              <X className="size-5" />
            </button>
          </div>
          {tree(true)}
        </div>
      ) : null}
    </div>
  );
}
