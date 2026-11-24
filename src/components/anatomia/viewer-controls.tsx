"use client";

import { useState } from "react";
import { Eye, EyeOff, Layers, RotateCcw, X } from "lucide-react";
import { LAYER_LABELS, type AnatomyLayer } from "@/lib/domain/anatomy-types";
import { cn } from "@/lib/utils";
import type { ViewName } from "./anatomy-viewer";

/**
 * Camadas, transparência e vistas — a barra que fica sobre o corpo.
 *
 * No computador, tudo numa faixa. No celular, a faixa cobriria metade do
 * corpo: vira um botão "Camadas" que abre o painel e um atalho para voltar
 * à vista de frente.
 */

const VIEWS: readonly { name: ViewName; label: string }[] = [
  { name: "front", label: "Anterior" },
  { name: "back", label: "Posterior" },
  { name: "left", label: "Lateral E" },
  { name: "right", label: "Lateral D" },
  { name: "perspective", label: "3/4" },
];

const ORDER: readonly AnatomyLayer[] = ["superficial muscles", "deep muscles", "skeleton"];

interface Props {
  layers: Readonly<Record<AnatomyLayer, boolean>>;
  onToggle: (layer: AnatomyLayer) => void;
  opacity: number;
  onOpacity: (value: number) => void;
  onView: (name: ViewName) => void;
}

function LayerButtons({ layers, onToggle }: Pick<Props, "layers" | "onToggle">) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Camadas">
      {ORDER.map((layer) => (
        <button
          key={layer}
          type="button"
          aria-pressed={layers[layer]}
          onClick={() => onToggle(layer)}
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 font-medium transition-colors lg:min-h-8",
            layers[layer] ? "bg-primary text-on-primary" : "text-ink-muted hover:text-ink",
          )}
        >
          {layers[layer] ? (
            <Eye className="size-3.5" aria-hidden="true" />
          ) : (
            <EyeOff className="size-3.5" aria-hidden="true" />
          )}
          {LAYER_LABELS[layer]}
        </button>
      ))}
    </div>
  );
}

function Opacity({ opacity, onOpacity }: Pick<Props, "opacity" | "onOpacity">) {
  return (
    <label className="text-ink-muted flex items-center gap-2">
      Transparência
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round((1 - opacity) * 100)}
        onChange={(e) => onOpacity(1 - Number(e.target.value) / 100)}
        className="w-full min-w-24 accent-[var(--primary)] lg:w-24"
        aria-label="Transparência dos músculos superficiais"
      />
    </label>
  );
}

function Views({ onView }: Pick<Props, "onView">) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Vistas">
      {VIEWS.map((v) => (
        <button
          key={v.name}
          type="button"
          onClick={() => onView(v.name)}
          className="text-ink-muted hover:text-ink hover:glass min-h-9 rounded-full px-2.5 font-medium lg:min-h-8"
        >
          {v.name === "front" ? (
            <RotateCcw className="mr-1 inline size-3" aria-hidden="true" />
          ) : null}
          {v.label}
        </button>
      ))}
    </div>
  );
}

export function ViewerControls(props: Props) {
  const [open, setOpen] = useState(false);
  const hiddenCount = ORDER.filter((l) => !props.layers[l]).length;

  return (
    <>
      {/* computador */}
      <div className="glass-strong rounded-panel hidden flex-wrap items-center gap-x-4 gap-y-2 p-2.5 text-xs lg:flex">
        <LayerButtons layers={props.layers} onToggle={props.onToggle} />
        <Opacity opacity={props.opacity} onOpacity={props.onOpacity} />
        <div className="ml-auto">
          <Views onView={props.onView} />
        </div>
      </div>

      {/* celular e tablet */}
      <div className="flex items-start justify-end gap-2 text-xs lg:hidden">
        <button
          type="button"
          onClick={() => props.onView("front")}
          className="glass-strong inline-flex size-10 items-center justify-center rounded-full"
          aria-label="Voltar à vista de frente"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn(
            "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 font-semibold",
            open ? "bg-primary text-on-primary" : "glass-strong",
          )}
        >
          <Layers className="size-4" aria-hidden="true" />
          Camadas
          {hiddenCount ? (
            <span className="bg-primary text-on-primary rounded-full px-1.5 text-[10px]">
              {hiddenCount} off
            </span>
          ) : null}
        </button>
      </div>
      {open ? (
        <div className="glass-strong rounded-panel mt-2 space-y-3 p-3 text-xs lg:hidden">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Camadas e vistas</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-ink-muted -m-1 p-1"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>
          <LayerButtons layers={props.layers} onToggle={props.onToggle} />
          <Opacity opacity={props.opacity} onOpacity={props.onOpacity} />
          <Views
            onView={(name) => {
              props.onView(name);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </>
  );
}
