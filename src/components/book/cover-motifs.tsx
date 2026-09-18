import type { CoverMotif } from "@/lib/domain/types";

/**
 * Abstract artwork for generated covers — one visual language per subject
 * area, so a placeholder still reads as "anatomy" or "cell biology" at a
 * glance. Nothing here imitates a publisher's real cover.
 *
 * Each motif draws into a 300x450 viewBox using currentColor, so the palette
 * lives with the cover component.
 */

export interface MotifPalette {
  readonly base: string;
  readonly deep: string;
  readonly art: string;
  readonly text: string;
  readonly label: string;
}

export const motifPalettes: Record<CoverMotif, MotifPalette> = {
  anatomia: {
    base: "#123c47",
    deep: "#0a262e",
    art: "#7fd4e2",
    text: "#f2f8f8",
    label: "Anatomia",
  },
  histologia: {
    base: "#5d2f4c",
    deep: "#3d1d32",
    art: "#e6a8cd",
    text: "#fbf2f7",
    label: "Histologia",
  },
  bioquimica: {
    base: "#1d3f63",
    deep: "#112944",
    art: "#8fc0f0",
    text: "#f1f6fc",
    label: "Biologia celular",
  },
  semiologia: {
    base: "#17454f",
    deep: "#0d2c34",
    art: "#79d0c2",
    text: "#f0f9f7",
    label: "Semiologia",
  },
  humanidades: {
    base: "#43356b",
    deep: "#2a2047",
    art: "#bda9ef",
    text: "#f5f2fc",
    label: "Humanidades",
  },
  "saude-coletiva": {
    base: "#2b4d33",
    deep: "#1a3220",
    art: "#9fd0a6",
    text: "#f1f8f2",
    label: "Saúde coletiva",
  },
  metodologia: {
    base: "#6a4318",
    deep: "#472c0e",
    art: "#efc389",
    text: "#fbf4ea",
    label: "Metodologia",
  },
};

/** Small deterministic hash so each book gets a stable variation. */
export function seedOf(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

interface MotifProps {
  readonly seed: number;
}

function AnatomiaArt({ seed }: MotifProps) {
  // Contour bands, as on an anatomical plate.
  const shift = seed % 24;
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.1">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse
          key={i}
          cx={150}
          cy={150 + shift}
          rx={38 + i * 19}
          ry={54 + i * 15}
          opacity={0.5 - i * 0.06}
        />
      ))}
      <path d="M150 62 L150 250" strokeWidth="1.6" opacity="0.5" />
      <path d="M104 118 L196 118 M96 176 L204 176 M108 232 L192 232" opacity="0.35" />
    </g>
  );
}

function HistologiaArt({ seed }: MotifProps) {
  // A loose tessellation of cells.
  const cells = Array.from({ length: 22 }, (_, i) => {
    const h = seedOf(`${seed}-${i}`);
    return {
      cx: 48 + ((h >> 3) % 205),
      cy: 74 + ((h >> 9) % 190),
      r: 11 + ((h >> 15) % 15),
    };
  });
  return (
    <g stroke="currentColor" fill="none" strokeWidth="1.2">
      {cells.map((cell, i) => (
        <g key={i} opacity={0.22 + (i % 5) * 0.09}>
          <circle cx={cell.cx} cy={cell.cy} r={cell.r} />
          <circle cx={cell.cx} cy={cell.cy} r={cell.r * 0.34} fill="currentColor" opacity="0.5" />
        </g>
      ))}
    </g>
  );
}

function BioquimicaArt({ seed }: MotifProps) {
  // A molecular graph: nodes joined by bonds.
  const nodes = Array.from({ length: 9 }, (_, i) => {
    const h = seedOf(`${seed}-mol-${i}`);
    return { x: 60 + ((h >> 4) % 180), y: 88 + ((h >> 11) % 165) };
  });
  return (
    <g stroke="currentColor" strokeWidth="1.2">
      {nodes.map((node, i) => {
        const next = nodes[(i + 1) % nodes.length];
        const far = nodes[(i + 3) % nodes.length];
        return (
          <g key={i} opacity="0.4">
            {next ? <line x1={node.x} y1={node.y} x2={next.x} y2={next.y} /> : null}
            {far ? <line x1={node.x} y1={node.y} x2={far.x} y2={far.y} opacity="0.4" /> : null}
          </g>
        );
      })}
      {nodes.map((node, i) => (
        <circle
          key={`n${i}`}
          cx={node.x}
          cy={node.y}
          r={i % 3 === 0 ? 7 : 4.5}
          fill="currentColor"
          opacity={0.75}
          stroke="none"
        />
      ))}
    </g>
  );
}

function SemiologiaArt({ seed }: MotifProps) {
  // A vital-signs trace.
  const amp = 22 + (seed % 12);
  const path = [
    "M40 200",
    "L86 200",
    `L98 ${200 - amp * 0.5}`,
    `L110 ${200 + amp}`,
    `L122 ${200 - amp * 2}`,
    `L134 ${200 + amp * 0.7}`,
    "L148 200",
    "L188 200",
    `L200 ${200 - amp * 0.6}`,
    `L212 ${200 + amp * 0.4}`,
    "L224 200",
    "L260 200",
  ].join(" ");
  return (
    <g fill="none" stroke="currentColor">
      <path d={path} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M40 140 L260 140 M40 262 L260 262" strokeWidth="1" opacity="0.28" />
      <circle cx={122} cy={200 - amp * 2} r="4" fill="currentColor" opacity="0.8" />
    </g>
  );
}

function HumanidadesArt({ seed }: MotifProps) {
  // Two figures facing each other — consultation, dialogue.
  const gap = 24 + (seed % 14);
  return (
    <g stroke="currentColor" fill="none" strokeWidth="1.5">
      <g opacity="0.75">
        <circle cx={150 - gap} cy={148} r="20" />
        <path d={`M${150 - gap - 32} 252 q32 -52 64 0`} />
      </g>
      <g opacity="0.45">
        <circle cx={150 + gap} cy={158} r="17" />
        <path d={`M${150 + gap - 28} 252 q28 -46 56 0`} />
      </g>
      <path d="M96 286 L204 286" opacity="0.3" />
    </g>
  );
}

function SaudeColetivaArt({ seed }: MotifProps) {
  // A community network over a territory.
  const nodes = Array.from({ length: 11 }, (_, i) => {
    const h = seedOf(`${seed}-net-${i}`);
    return { x: 52 + ((h >> 5) % 196), y: 92 + ((h >> 12) % 162) };
  });
  const hub = nodes[0];
  return (
    <g stroke="currentColor" strokeWidth="1.1">
      {hub
        ? nodes
            .slice(1)
            .map((node, i) => (
              <line
                key={i}
                x1={hub.x}
                y1={hub.y}
                x2={node.x}
                y2={node.y}
                opacity={0.24 + (i % 4) * 0.08}
              />
            ))
        : null}
      {nodes.map((node, i) => (
        <circle
          key={`p${i}`}
          cx={node.x}
          cy={node.y}
          r={i === 0 ? 9 : 5}
          fill="currentColor"
          stroke="none"
          opacity={i === 0 ? 0.9 : 0.6}
        />
      ))}
    </g>
  );
}

function MetodologiaArt({ seed }: MotifProps) {
  // The evidence pyramid.
  const tiers = [0, 1, 2, 3, 4];
  const lean = seed % 2 === 0 ? 1 : -1;
  return (
    <g stroke="currentColor" fill="none" strokeWidth="1.3">
      {tiers.map((i) => {
        const top = 108 + i * 30;
        const halfTop = 16 + i * 22;
        const halfBottom = 16 + (i + 1) * 22;
        return (
          <path
            key={i}
            d={`M${150 - halfTop} ${top} L${150 + halfTop} ${top} L${150 + halfBottom} ${top + 30} L${150 - halfBottom} ${top + 30} Z`}
            opacity={0.66 - i * 0.1}
            fill={i === 0 ? "currentColor" : "none"}
          />
        );
      })}
      <path d={`M${150 + lean * 96} 96 L150 96`} opacity="0.3" />
    </g>
  );
}

const motifArt: Record<CoverMotif, (props: MotifProps) => React.JSX.Element> = {
  anatomia: AnatomiaArt,
  histologia: HistologiaArt,
  bioquimica: BioquimicaArt,
  semiologia: SemiologiaArt,
  humanidades: HumanidadesArt,
  "saude-coletiva": SaudeColetivaArt,
  metodologia: MetodologiaArt,
};

export function MotifArtwork({ motif, seed }: { motif: CoverMotif; seed: number }) {
  const Art = motifArt[motif];
  return <Art seed={seed} />;
}
