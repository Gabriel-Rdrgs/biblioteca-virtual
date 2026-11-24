"use client";

import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { LAYER_LABELS, type AnatomyLayer } from "@/lib/domain/anatomy-types";
import { cn } from "@/lib/utils";
import type { ViewName } from "./anatomy-viewer";

/** Camadas, transparência e vistas — a barra que fica sobre o corpo. */

const VIEWS: readonly { name: ViewName; label: string }[] = [
  { name: "front", label: "Anterior" },
  { name: "back", label: "Posterior" },
  { name: "left", label: "Lateral E" },
  { name: "right", label: "Lateral D" },
  { name: "perspective", label: "3/4" },
];

const ORDER: readonly AnatomyLayer[] = ["superficial muscles", "deep muscles", "skeleton"];

export function ViewerControls({
  layers,
  onToggle,
  opacity,
  onOpacity,
  onView,
}: {
  layers: Readonly<Record<AnatomyLayer, boolean>>;
  onToggle: (layer: AnatomyLayer) => void;
  opacity: number;
  onOpacity: (value: number) => void;
  onView: (name: ViewName) => void;
}) {
  return (
    <div className="glass-strong rounded-panel flex flex-wrap items-center gap-x-4 gap-y-2 p-2.5 text-xs">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Camadas">
        {ORDER.map((layer) => (
          <button
            key={layer}
            type="button"
            aria-pressed={layers[layer]}
            onClick={() => onToggle(layer)}
            className={cn(
              "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 font-medium transition-colors",
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
      <label className="text-ink-muted flex items-center gap-2">
        Transparência
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round((1 - opacity) * 100)}
          onChange={(e) => onOpacity(1 - Number(e.target.value) / 100)}
          className="accent-[var(--primary)] w-24"
          aria-label="Transparência dos músculos superficiais"
        />
      </label>
      <div className="ml-auto flex flex-wrap gap-1" role="group" aria-label="Vistas">
        {VIEWS.map((v) => (
          <button
            key={v.name}
            type="button"
            onClick={() => onView(v.name)}
            className="text-ink-muted hover:text-ink hover:glass min-h-8 rounded-full px-2.5 font-medium"
          >
            {v.name === "front" ? <RotateCcw className="mr-1 inline size-3" aria-hidden="true" /> : null}
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
