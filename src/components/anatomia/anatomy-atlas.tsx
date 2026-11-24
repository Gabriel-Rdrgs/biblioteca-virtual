"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronUp,
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
 *
 * No computador são três colunas: lista, corpo, ficha. No celular o corpo
 * ocupa a tela; a busca abre por cima e a ficha sobe numa gaveta, com as
 * ações sempre à mão do polegar.
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

/* -------------------------------------------------- busca e lista */

function StructureList({
  data,
  selectedId,
  onSelect,
  autoFocus,
}: {
  data: AnatomyData;
  selectedId: string | null;
  onSelect: (s: AnatomyStructure) => void;
  autoFocus?: boolean;
}) {
  const [region, setRegion] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"muscles" | "bones">(() =>
    data.structures.find((s) => s.id === selectedId)?.layer === "skeleton" ? "bones" : "muscles",
  );
  const list = useMemo(() => {
    const q = fold(query);
    return data.structures.filter(
      (s) =>
        // Buscando pelo nome, procura em tudo; navegando, só a aba aberta.
        (q.length >= 2 || (tab === "bones") === (s.layer === "skeleton")) &&
        (!region || s.region === region) &&
        (q.length < 2 || structureNames(s).some((n) => fold(n).includes(q))),
    );
  }, [data.structures, region, query, tab]);

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
          placeholder="Músculo em português, inglês ou latim…"
          className="bg-surface border-line focus:border-primary min-h-11 w-full rounded-full border py-2 pr-3 pl-9 text-base outline-none lg:min-h-10 lg:text-sm"
        />
      </label>
      <div className="bg-surface-sunken mt-3 grid grid-cols-2 gap-1 rounded-full p-1 text-sm" role="tablist">
        {(
          [
            ["muscles", "Músculos"],
            ["bones", "Ossos"],
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
      {/* No celular as regiões rolam de lado, numa linha só. */}
      <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
        {[{ id: null, short: "Todas" }, ...data.regions].map((r) => (
          <button
            key={r.id ?? "todas"}
            type="button"
            onClick={() => setRegion(r.id)}
            className={cn(
              "min-h-9 shrink-0 rounded-full px-3 text-xs font-medium lg:min-h-0 lg:px-2.5 lg:py-1",
              region === r.id ? "bg-primary text-on-primary" : "glass-strong text-ink-muted",
            )}
          >
            {r.short}
          </button>
        ))}
      </div>
      <ul className="mt-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {list.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s)}
              aria-current={s.id === selectedId ? "true" : undefined}
              className={cn(
                "min-h-11 w-full rounded-lg px-2.5 py-2 text-left text-[15px] transition-colors lg:min-h-0 lg:py-1.5 lg:text-sm",
                s.id === selectedId
                  ? "bg-primary-soft text-primary font-semibold"
                  : "hover:glass-strong",
              )}
            >
              {s.namePt}
              {s.kind === "connective" ? (
                <span className="text-ink-faint ml-1 text-xs">
                  · {s.layer === "skeleton" ? "outras" : "conjuntivo"}
                </span>
              ) : null}
            </button>
          </li>
        ))}
        {list.length === 0 ? (
          <li className="text-ink-muted px-2 py-3 text-sm">Nenhuma estrutura com esse nome.</li>
        ) : null}
      </ul>
    </>
  );
}

/* ------------------------------------------------------------ atlas */

export function AnatomyAtlas({ data, initialId }: { data: AnatomyData; initialId?: string }) {
  const initial =
    initialId && data.structures.some((s) => s.id === initialId) ? initialId : null;
  const [selectedId, setSelectedId] = useState<string | null>(initial);
  const [bonePick, setBonePick] = useState<AnatomyPick | null>(null);
  const [layers, setLayers] = useState<Record<AnatomyLayer, boolean>>({
    skeleton: true,
    "deep muscles": true,
    "superficial muscles": true,
  });
  const [opacity, setOpacity] = useState(1);
  const [view, setView] = useState<{ name: ViewName; nonce: number }>({ name: "front", nonce: 0 });
  // Chegando direto num osso, ele estaria escondido pelos músculos: começa em raio-X.
  const [emphasis, setEmphasis] = useState<Emphasis>(() =>
    data.structures.find((s) => s.id === initial)?.layer === "skeleton" ? "xray" : "none",
  );
  const [hidden, setHidden] = useState<readonly string[]>([]);
  // Chegando pela ficha (?estrutura=), a câmera já vai até ela.
  const [focusReq, setFocusReq] = useState<FocusRequest | null>(() => {
    const s = initial ? data.structures.find((x) => x.id === initial) : undefined;
    return s ? { keys: s.parts.map((p) => p.toLowerCase()), padding: 2.6, nonce: 1 } : null;
  });
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null);
  const [searching, setSearching] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const byKey = useMemo(() => {
    const map = new Map<string, AnatomyStructure>();
    for (const s of data.structures) for (const p of s.parts) map.set(p.toLowerCase(), s);
    return map;
  }, [data.structures]);

  const regionById = useMemo(() => new Map(data.regions.map((r) => [r.id, r])), [data.regions]);
  const selected = selectedId ? data.structures.find((s) => s.id === selectedId) : undefined;
  const selectedKeys =
    selected?.parts.map((p) => p.toLowerCase()) ?? (bonePick ? [bonePick.key] : []);
  const label = selected?.namePt ?? (bonePick ? modelName(bonePick.name) : "");

  // Com a busca aberta no celular, a página de trás não rola.
  useEffect(() => {
    if (!searching) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [searching]);

  const flyTo = (keys: readonly string[]) =>
    setFocusReq((f) => ({ keys, padding: 2.6, nonce: (Number(f?.nonce) || 0) + 1 }));

  const select = (structure: AnatomyStructure | undefined, fly = true) => {
    setSelectedId(structure?.id ?? null);
    setBonePick(null);
    setSheetOpen(false);
    if (!structure) return setEmphasis("none");
    if (!fly) return;
    flyTo(structure.parts.map((p) => p.toLowerCase()));
    // Osso escolhido pela lista está embaixo dos músculos: mostra em raio-X.
    if (structure.layer === "skeleton") setEmphasis((e) => (e === "none" ? "xray" : e));
  };

  const onPick = (pick: AnatomyPick | null) => {
    if (!pick) return select(undefined);
    const found = byKey.get(pick.key);
    if (found) return select(found, false);
    setSelectedId(null);
    setSheetOpen(false);
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
          "inline-flex items-center gap-1.5 rounded-full font-medium",
          compact ? "glass size-11 justify-center" : "hover:glass min-h-8 px-3",
        )}
        aria-label="Focar"
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
            "inline-flex items-center gap-1.5 rounded-full font-medium",
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
          "inline-flex items-center gap-1.5 rounded-full font-medium",
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
    <StructureCardView structure={selected} region={regionById.get(selected.region)} refs={data.refs} />
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
  ) : null;

  return (
    <div className="flex flex-col gap-4 lg:grid lg:h-[calc(100dvh-9rem)] lg:grid-cols-[17rem_minmax(0,1fr)_24rem]">
      {/* ------------------------------------------------ lista (computador) */}
      <aside className="glass rounded-panel hidden min-h-0 flex-col p-3 lg:flex">
        <StructureList data={data} selectedId={selectedId} onSelect={(s) => select(s)} />
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

        <div className="absolute inset-x-2 top-2 flex items-start gap-2">
          {/* Busca no celular: um botão que abre a lista por cima. */}
          <button
            type="button"
            onClick={() => setSearching(true)}
            className="glass-strong inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold lg:hidden"
          >
            <Search className="size-4" aria-hidden="true" />
            Buscar
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
              <span className="lg:hidden">
                Arraste para girar · pinça para aproximar · toque num músculo
              </span>
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
      <aside
        className="glass rounded-panel hidden min-h-0 overflow-y-auto p-5 lg:block"
        aria-live="polite"
      >
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
            <h2 className="text-ink text-lg font-semibold">Toque num músculo ou osso</h2>
            <p>
              Passe o mouse para ver o nome; clique para abrir origem, inserção, ação, inervação e
              o ponto de prova — ou procure pelo nome na lista, e a câmera vai até ele.
            </p>
            <p>
              Com uma estrutura escolhida, dá para esmaecer o resto, ver em raio-X, isolá-la ou
              ocultar o que está na frente. São{" "}
              {data.structures.filter((s) => s.kind === "muscle").length} músculos e{" "}
              {data.structures.filter((s) => s.kind === "bone").length} ossos com ficha, em{" "}
              {data.regions.length} regiões. Para ver os ossos, desligue as camadas de músculos.
            </p>
          </div>
        )}
      </aside>

      {/* ------------------------------------------------ celular: atalhos */}
      <div className="grid grid-cols-2 gap-2 lg:hidden">
        <Link
          href="/anatomia"
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
                className="text-ink-faint -mr-1 grid size-10 place-items-center"
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
              <div className="px-3 pb-3">{actions(true)}</div>
            )}
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------ celular: busca */}
      {searching ? (
        <div className="bg-canvas fixed inset-0 z-50 flex flex-col p-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-lg font-semibold">Buscar estrutura</p>
            <button
              type="button"
              onClick={() => setSearching(false)}
              className="glass-strong grid size-10 place-items-center rounded-full"
              aria-label="Fechar busca"
            >
              <X className="size-5" />
            </button>
          </div>
          <StructureList
            data={data}
            selectedId={selectedId}
            autoFocus
            onSelect={(s) => {
              setSearching(false);
              select(s);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
