"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Box3,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Spherical,
  Vector3,
  WebGLRenderer,
} from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { meshKey, type AnatomyLayer } from "@/lib/domain/anatomy-types";
import { MODEL_URL } from "@/lib/data/anatomia/model-url";
import { cn } from "@/lib/utils";

/**
 * O corpo em 3D.
 *
 * Three.js puro, carregado só no navegador (import dinâmico), para não pesar
 * nas outras páginas. O componente é "controlado": quem está em volta diz
 * o que destacar, o que esconder e para onde olhar; ele só desenha e avisa
 * o que foi tocado ou está sob o cursor.
 *
 * Como num atlas 3D de estudo, o que está selecionado pode ganhar destaque
 * de quatro jeitos (`emphasis`):
 * - **none**: o corpo inteiro com as cores do modelo;
 * - **dim**: o corpo inteiro continua sólido, só que apagado, e o destacado
 *   brilha; o que esconde o alvo (músculos por cima de um profundo ou de um
 *   osso) vira um véu translúcido — o contexto fica, o alvo não some;
 * - **fade**: o resto fica translúcido, para ver através;
 * - **xray**: osso e músculos superficiais viram vulto, os profundos somem —
 *   o destacado aparece inteiro, sem nada na frente, mas no lugar dele;
 * - **isolate**: só o destacado e o esqueleto em vulto.
 * O treino alterna entre `dim` ("Corpo") e `xray` ("Raio-X"), à escolha do aluno.
 *
 * No treino, duas vistas pequenas giram devagar em volta do mesmo ponto, e
 * a câmera principal balança de leve até a pessoa pegar no modelo.
 *
 * Destaque e transparência trocam apenas o material — a geometria não é
 * alterada, como pede a licença do modelo.
 */

export type ViewName = "front" | "back" | "left" | "right" | "perspective";
export type Emphasis = "none" | "dim" | "fade" | "xray" | "isolate";
type Side = "left" | "right" | "midline";

export interface AnatomyPick {
  readonly key: string;
  readonly layer: AnatomyLayer;
  readonly name: string;
  /** Onde o toque acertou a superfície, no espaço do mundo (só no toque, não no passar do mouse). */
  readonly point?: readonly number[];
}

export interface FocusRequest {
  readonly keys: readonly string[];
  /** Enquadrar só um lado do corpo (os dois continuam acesos). */
  readonly side?: "left" | "right";
  /** Quanto de folga em volta: 2,3 é justo; 3 mostra a vizinhança. */
  readonly padding?: number;
  /** Muda para pedir de novo o mesmo enquadramento. */
  readonly nonce: number | string;
  /**
   * Um ponto no osso (acidente): a câmera mira nele, olhando de frente para a
   * superfície, com o osso inteiro de contexto. Lado esquerdo; espelha no
   * direito quando `side` é "right" e o ponto é de osso par.
   */
  readonly point?: {
    readonly pos: readonly number[];
    readonly normal: readonly number[];
    readonly mirror: boolean;
  };
}

/** Um acidente ósseo: ponto numerado preso ao osso. */
export interface Marker {
  readonly id: string;
  readonly label: string;
  /** Posição no lado esquerdo do corpo (+X), ou na linha média. */
  readonly pos: readonly number[];
  /** Para onde a superfície olha ali: de costas para a câmera, o ponto esmaece. */
  readonly normal: readonly number[];
  /** Osso par: o ponto vai para o lado do corpo que está virado para a câmera. */
  readonly mirror: boolean;
  /** O que vai dentro da bolinha; sem isso, o número. */
  readonly glyph?: string;
}

/**
 * Um acidente aceso na superfície do osso: uma mancha que brilha e pulsa em
 * volta do ponto, com contorno — a região, não um alfinete. O resto do osso
 * mantém a cor natural. É só material (shader); a geometria não muda.
 */
export interface Spot {
  /** As peças do osso onde o acidente está. */
  readonly keys: readonly string[];
  /** O ponto, no lado esquerdo do corpo (ou na linha média). */
  readonly pos: readonly number[];
  readonly mirror: boolean;
  /** Lado fixo, ou "auto": o lado do corpo virado para a câmera. */
  readonly side: "left" | "right" | "auto";
  /** Pergunta (vermelho) ou acerto (verde). */
  readonly tone?: "ask" | "correct";
  /** Acidente em linha (crista, margem): a faixa segue estes pontos, no lado esquerdo. */
  readonly path?: readonly (readonly number[])[];
}

export interface AnatomyViewerProps {
  /** Chaves (inglês, sem lado) a destacar como selecionadas. */
  readonly selectedKeys?: readonly string[];
  /** Chaves a destacar como alvo do quiz. */
  readonly focusKeys?: readonly string[];
  /** Depois da resposta: o que acendeu e se estava certo. */
  readonly result?: { readonly keys: readonly string[]; readonly ok: boolean } | null;
  /** Escondidas pela pessoa ("ocultar"). */
  readonly hiddenKeys?: readonly string[];
  readonly layers?: Readonly<Record<AnatomyLayer, boolean>>;
  /** 0 a 1: deixa ver o que está embaixo dos músculos superficiais. */
  readonly superficialOpacity?: number;
  /** Como o resto aparece quando há algo destacado. */
  readonly emphasis?: Emphasis;
  /** Raio-X sempre, com ou sem destaque (o treino). */
  readonly xray?: boolean;
  readonly view?: { readonly name: ViewName; readonly nonce: number };
  readonly focus?: FocusRequest | null;
  /** Etiqueta presa na estrutura, que acompanha o giro. */
  readonly pin?: { readonly keys: readonly string[]; readonly text: string } | null;
  /** Acidentes do osso selecionado, numerados na ordem da lista. */
  readonly markers?: readonly Marker[];
  readonly activeMarker?: string | null;
  readonly onMarker?: (id: string) => void;
  /** Sem rótulo, o ponto ativo não diz o nome (o treino pergunta qual é). */
  readonly markerLabels?: boolean;
  /** Um acidente aceso na superfície do osso. */
  readonly spot?: Spot | null;
  /** As duas vistas pequenas que giram em volta do foco. */
  readonly insets?: boolean;
  /** A câmera balança de leve em volta do foco até a pessoa girar. */
  readonly sway?: boolean;
  /** Altura (px) coberta embaixo por texto: o corpo é enquadrado acima dela e some antes dela. */
  readonly bottomInset?: number;
  readonly interactive?: boolean;
  readonly onPick?: (pick: AnatomyPick | null) => void;
  /** Sob o cursor (só mouse), com a posição dentro do palco. */
  readonly onHover?: (pick: AnatomyPick | null, x: number, y: number) => void;
  readonly onReady?: (stats: { readonly meshes: number; readonly keys: readonly string[] }) => void;
  readonly className?: string;
}

interface Entry {
  readonly mesh: Mesh;
  readonly key: string;
  readonly layer: AnatomyLayer;
  readonly side: Side;
  readonly name: string;
  readonly box: Box3;
  readonly center: Vector3;
}

interface Tween {
  t0: number | null;
  readonly fromTarget: Vector3;
  readonly toTarget: Vector3;
  readonly from: Spherical;
  readonly to: Spherical;
}

interface Controller {
  readonly entries: Entry[];
  readonly mats: {
    layer: Record<AnatomyLayer, MeshStandardMaterial>;
    hover: MeshStandardMaterial;
    soft: MeshStandardMaterial;
    fadeMuscle: MeshStandardMaterial;
    dimMuscle: MeshStandardMaterial;
    dimBone: MeshStandardMaterial;
    veil: MeshStandardMaterial;
    spot: MeshStandardMaterial;
    fadeBone: MeshStandardMaterial;
    ghostBone: MeshStandardMaterial;
    ghostMuscle: MeshStandardMaterial;
    selected: MeshStandardMaterial;
    focus: MeshStandardMaterial;
    correct: MeshStandardMaterial;
    wrong: MeshStandardMaterial;
  };
  setView: (name: ViewName, animate?: boolean) => void;
  focusOn: (req: FocusRequest) => void;
  setInsets: (on: boolean) => void;
  setSway: (on: boolean) => void;
  setBottomInset: (px: number) => void;
  setPin: (pin: { keys: readonly string[]; text: string } | null) => void;
  setMarkers: (markers: readonly Marker[], active: string | null, labels: boolean) => void;
  setSpot: (spot: Spot | null) => void;
  invalidate: () => void;
}

const LAYERS: readonly AnatomyLayer[] = ["skeleton", "deep muscles", "superficial muscles"];
const GHOST_LAYER = 1;
const TWEEN_MS = 620;
const ALL_LAYERS: Readonly<Record<AnatomyLayer, boolean>> = {
  skeleton: true,
  "deep muscles": true,
  "superficial muscles": true,
};

function isLayer(value: unknown): value is AnatomyLayer {
  return typeof value === "string" && (LAYERS as readonly string[]).includes(value);
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function AnatomyViewer({
  selectedKeys = [],
  focusKeys = [],
  result = null,
  hiddenKeys = [],
  layers = ALL_LAYERS,
  superficialOpacity = 1,
  emphasis = "none",
  xray = false,
  view,
  focus,
  pin = null,
  markers,
  activeMarker = null,
  markerLabels = true,
  spot = null,
  onMarker,
  insets = false,
  sway = false,
  bottomInset = 0,
  interactive = true,
  onPick,
  onHover,
  onReady,
  className,
}: AnatomyViewerProps) {
  const host = useRef<HTMLDivElement>(null);
  const ctl = useRef<Controller | null>(null);
  const [status, setStatus] = useState<{ phase: "loading" | "ready" | "error"; progress: number }>({
    phase: "loading",
    progress: 0,
  });
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  // Callbacks e estado mudam a cada render; o controlador lê sempre o mais recente.
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const hoverRef = useRef<AnatomyViewerProps["onHover"]>(undefined);
  const markerRef = useRef(onMarker);
  markerRef.current = onMarker;
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  const stateRef = useRef({ interactive, pickable: [] as Mesh[], priority: [] as Mesh[] });
  stateRef.current.interactive = interactive;

  /* -------------------------------------------- montar e carregar */
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { MeshoptDecoder } = await import("three/examples/jsm/libs/meshopt_decoder.module.js");
      await MeshoptDecoder.ready;
      if (cancelled) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const renderer: WebGLRenderer = new THREE.WebGLRenderer({
        antialias: !coarse,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.AgXToneMapping;
      renderer.toneMappingExposure = 1.1;
      const canvas = renderer.domElement;
      canvas.style.display = "block";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.touchAction = "none";
      canvas.style.cursor = "grab";
      canvas.setAttribute("aria-label", "Modelo anatômico 3D interativo");
      el.appendChild(canvas);

      // Moldura das vistas pequenas: as bordas esfumam no fundo do palco.
      const frames = [0, 1].map(() => {
        const frame = document.createElement("div");
        frame.style.cssText =
          "position:absolute;pointer-events:none;display:none;box-shadow:inset 0 0 26px 20px #0a0d14;";
        el.appendChild(frame);
        return frame;
      });

      // Etiqueta presa na estrutura: ponto, haste e nome.
      const pinEl = document.createElement("div");
      pinEl.style.cssText =
        "position:absolute;left:0;top:0;pointer-events:none;display:none;will-change:transform;";
      pinEl.innerHTML =
        '<span style="position:absolute;left:-5px;top:-5px;width:10px;height:10px;border-radius:9999px;background:#fff;box-shadow:0 0 0 3px rgba(255,77,58,.55),0 0 12px rgba(0,0,0,.6)"></span>' +
        '<span style="position:absolute;left:0;bottom:0;width:1.5px;height:42px;background:linear-gradient(to top,#fff,rgba(255,255,255,.35))"></span>' +
        '<span data-pin-text style="position:absolute;left:-2px;bottom:42px;transform:translateX(-50%);white-space:nowrap;padding:5px 11px;border-radius:9999px;background:rgba(10,13,20,.86);color:#fff;font:600 13px/1.2 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.14)"></span>';
      el.appendChild(pinEl);
      const pinText = pinEl.querySelector<HTMLElement>("[data-pin-text]");

      // Acidentes: um botão numerado por ponto; o ativo mostra o nome ao lado.
      const markerLayer = document.createElement("div");
      markerLayer.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;";
      el.appendChild(markerLayer);
      let markerList: readonly Marker[] = [];
      let markerActive: string | null = null;
      let labelsOn = true;
      let markerEls: HTMLButtonElement[] = [];
      const buildMarkers = () => {
        markerLayer.replaceChildren();
        markerEls = markerList.map((m, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.setAttribute("aria-label", `${i + 1}. ${m.label}`);
          const on = m.id === markerActive;
          const showLabel = on && labelsOn;
          b.style.cssText =
            "position:absolute;left:0;top:0;pointer-events:auto;display:none;align-items:center;gap:6px;" +
            "padding:0;border:0;background:none;cursor:pointer;transform-origin:11px 11px;will-change:transform;";
          b.innerHTML =
            `<span style="display:grid;place-items:center;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:9999px;` +
            `font:700 11px/1 system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.45);` +
            (on
              ? "background:#ff4d3a;color:#fff;border:2px solid #fff;"
              : "background:#fff;color:#c62f20;border:2px solid #ff4d3a;") +
            `">${(m.glyph ?? String(i + 1)).replace(/</g, "&lt;")}</span>` +
            (showLabel
              ? `<span style="margin-top:-11px;white-space:nowrap;padding:4px 9px;border-radius:9999px;background:rgba(10,13,20,.88);` +
                `color:#fff;font:600 12px/1.2 system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.4)">${m.label.replace(/</g, "&lt;")}</span>`
              : "");
          b.addEventListener("click", (event) => {
            event.stopPropagation();
            markerRef.current?.(m.id);
          });
          markerLayer.appendChild(b);
          return b;
        });
      };

      const scene: Scene = new THREE.Scene();
      const camera: PerspectiveCamera = new THREE.PerspectiveCamera(30, 1, 0.02, 40);
      camera.layers.enable(GHOST_LAYER);
      const insetCams = [0, 1].map(() => new THREE.PerspectiveCamera(30, 1, 0.02, 40));
      scene.add(camera);
      scene.add(new THREE.HemisphereLight(0xe6f0ff, 0x1c1622, 0.85));

      // As luzes acompanham a câmera que está desenhando: o lado visto está sempre iluminado.
      const rig: Group = new THREE.Group();
      const addLight = (color: number, intensity: number, x: number, y: number, z: number) => {
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(x, y, z);
        light.target.position.set(0, 0, -1);
        rig.add(light, light.target);
      };
      addLight(0xfff4e6, 1.9, 0.9, 1.2, 1.4);
      addLight(0xbcd2ff, 0.55, -1.4, -0.2, 0.6);
      addLight(0xdfeaff, 0.7, 0, 1.5, -2);
      scene.add(rig);
      const lightFrom = (cam: PerspectiveCamera) => {
        cam.updateMatrixWorld();
        rig.position.setFromMatrixPosition(cam.matrixWorld);
        rig.quaternion.setFromRotationMatrix(cam.matrixWorld);
        rig.updateMatrixWorld(true);
      };

      const base = { vertexColors: true, metalness: 0 } as const;
      const tone = (color: number, emissive: number) =>
        new THREE.MeshStandardMaterial({
          color,
          emissive,
          emissiveIntensity: 0.55,
          roughness: 0.55,
          metalness: 0,
        });
      const ghost = (color: number, opacity: number) =>
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.9,
          metalness: 0,
          transparent: true,
          opacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
      const see = (opacity: number, roughness: number) =>
        new THREE.MeshStandardMaterial({
          ...base,
          roughness,
          transparent: true,
          opacity,
          depthWrite: false,
        });
      const mats: Controller["mats"] = {
        layer: {
          skeleton: new THREE.MeshStandardMaterial({ ...base, roughness: 0.62 }),
          "deep muscles": new THREE.MeshStandardMaterial({ ...base, roughness: 0.72 }),
          "superficial muscles": new THREE.MeshStandardMaterial({ ...base, roughness: 0.72 }),
        },
        hover: new THREE.MeshStandardMaterial({
          ...base,
          roughness: 0.7,
          emissive: 0xff6a4a,
          emissiveIntensity: 0.38,
        }),
        soft: see(0.4, 0.8),
        fadeMuscle: see(0.16, 0.8),
        fadeBone: see(0.42, 0.7),
        // "Destacar": o corpo inteiro, sólido mas apagado (a cor do vértice escurecida),
        // e só a camada que esconde o alvo vira um véu translúcido.
        dimMuscle: new THREE.MeshStandardMaterial({ ...base, color: 0x6e6e6e, roughness: 0.8 }),
        dimBone: new THREE.MeshStandardMaterial({ ...base, color: 0x8c8c8c, roughness: 0.7 }),
        veil: see(0.2, 0.8),
        spot: new THREE.MeshStandardMaterial({ ...base, roughness: 0.6 }),
        ghostBone: ghost(0xdfe8f5, 0.16),
        ghostMuscle: ghost(0x9fb0cc, 0.05),
        selected: tone(0xff4d3a, 0xb51b0c),
        focus: tone(0x3d8bff, 0x0b3fa8),
        correct: tone(0x35d07f, 0x0c7a48),
        wrong: tone(0xff4d3a, 0xb51b0c),
      };

      // A mancha do acidente: a cor do osso e, em volta do ponto, um núcleo que
      // brilha e pulsa e um anel de contorno. Calculado por fragmento, pela
      // distância ao ponto no espaço do mundo.
      const spotUniforms = {
        uSpot: { value: new THREE.Vector3() },
        uRadius: { value: 0.02 },
        uSpotColor: { value: new THREE.Color(0xff3b2a) },
        uTime: { value: 0 },
        // Até 8 pontos de uma linha; uCount < 2 = acidente pontual.
        uPath: { value: Array.from({ length: 8 }, () => new THREE.Vector3()) },
        uCount: { value: 0 },
      };
      mats.spot.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, spotUniforms);
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vSpotWorld;")
          .replace(
            "#include <project_vertex>",
            "#include <project_vertex>\nvSpotWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;",
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            [
              "#include <common>",
              "varying vec3 vSpotWorld;",
              "uniform vec3 uSpot;",
              "uniform float uRadius;",
              "uniform vec3 uSpotColor;",
              "uniform float uTime;",
              "float spotCore;",
              "float spotRing;",
              "uniform vec3 uPath[8];",
              "uniform int uCount;",
              "float spotDist(vec3 p) {",
              "  if (uCount < 2) return distance(p, uSpot);",
              "  float d = 1e9;",
              "  for (int i = 0; i < 7; i++) {",
              "    if (i + 1 >= uCount) break;",
              "    vec3 a = uPath[i];",
              "    vec3 ab = uPath[i + 1] - a;",
              "    float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);",
              "    d = min(d, distance(p, a + ab * t));",
              "  }",
              "  return d;",
              "}",
            ].join("\n"),
          )
          .replace(
            "#include <color_fragment>",
            [
              "#include <color_fragment>",
              "float spotD = spotDist(vSpotWorld);",
              "spotCore = 1.0 - smoothstep(uRadius * 0.55, uRadius, spotD);",
              "spotRing = smoothstep(uRadius * 0.92, uRadius * 1.02, spotD) * (1.0 - smoothstep(uRadius * 1.02, uRadius * 1.18, spotD));",
              "diffuseColor.rgb = mix(diffuseColor.rgb, uSpotColor, clamp(spotCore * 0.85 + spotRing, 0.0, 1.0));",
            ].join("\n"),
          )
          .replace(
            "#include <emissivemap_fragment>",
            "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uSpotColor * (spotCore * (0.35 + 0.25 * sin(uTime * 3.2)) + spotRing * 0.7);",
          );
      };
      let spotState: Spot | null = null;
      const spotPos = new THREE.Vector3();

      const controls: OrbitControls = new OrbitControls(camera, canvas);
      const placeSpot = () => {
        if (!spotState) return;
        const p = spotState.pos;
        const left =
          spotState.side === "auto"
            ? camera.position.x - controls.target.x >= 0
            : spotState.side === "left";
        const sx = spotState.mirror && !left ? -1 : 1;
        spotPos.set((p[0] ?? 0) * sx, p[1] ?? 0, p[2] ?? 0);
        spotUniforms.uSpot.value.copy(spotPos);
        const path = spotState.path ?? [];
        spotUniforms.uCount.value = Math.min(path.length, 8);
        path.slice(0, 8).forEach((q, i) => {
          spotUniforms.uPath.value[i]?.set((q[0] ?? 0) * sx, q[1] ?? 0, q[2] ?? 0);
        });
      };
      controls.enableDamping = true;
      controls.dampingFactor = 0.09;
      controls.rotateSpeed = 0.8;
      controls.zoomSpeed = 0.9;
      controls.minDistance = 0.12;
      controls.maxDistance = 9;
      controls.screenSpacePanning = true;

      let dirty = true;
      const invalidate = () => {
        dirty = true;
      };
      let tween: Tween | null = null;
      let showInsets = false;
      let swayOn = false;
      // Balanço: parte do ponto onde a câmera parou; some quando a pessoa pega no modelo.
      let swayBase: { sph: Spherical; t0: number } | null = null;
      let reserved = 0;
      let pinKeys: Set<string> | null = null;
      controls.addEventListener("change", invalidate);
      controls.addEventListener("start", () => {
        tween = null;
        swayBase = null;
        canvas.style.cursor = "grabbing";
      });
      controls.addEventListener("end", () => {
        canvas.style.cursor = "grab";
      });

      /* ----------------------------------------- medidas do palco */
      const width = () => el.clientWidth || 1;
      const height = () => el.clientHeight || 1;
      // A parte de cima do palco, livre do texto do treino.
      const freeHeight = () => Math.max(height() * 0.35, height() - reserved);
      const roomForInsets = () => freeHeight() >= 230;
      const applyViewOffset = () => {
        const shift = (height() - freeHeight()) / 2;
        if (shift > 0) camera.setViewOffset(width(), height(), 0, shift, width(), height());
        else camera.clearViewOffset();
        // O corpo some antes do texto, para as letras ficarem sobre fundo escuro.
        const fade = Math.round(Math.min(90, height() * 0.12));
        const mask =
          reserved > 0
            ? `linear-gradient(to bottom, #000 0, #000 calc(100% - ${reserved + fade}px), transparent calc(100% - ${Math.max(0, reserved - 10)}px))`
            : "";
        canvas.style.maskImage = mask;
        canvas.style.setProperty("-webkit-mask-image", mask);
      };
      const insetRects = () => {
        const w = width();
        const h = height();
        const free = freeHeight();
        const small = w < 640;
        const a = small
          ? { x: 0.01 * w, top: 0.12 * free, w: 0.27 * w, h: 0.3 * free }
          : { x: 0.03 * w, top: 0.03 * free, w: 0.25 * w, h: 0.52 * free };
        const b = small
          ? { x: 0.72 * w, top: 0.12 * free, w: 0.27 * w, h: 0.3 * free }
          : { x: 0.75 * w, top: 0.26 * free, w: 0.2 * w, h: 0.42 * free };
        return [
          { x: a.x, y: h - a.top - a.h, w: a.w, h: a.h, turn: 1.75, tilt: -0.12 },
          { x: b.x, y: h - b.top - b.h, w: b.w, h: b.h, turn: -1.15, tilt: 0.1 },
        ];
      };
      const placeFrames = () => {
        const rects = insetRects();
        frames.forEach((frame, i) => {
          const r = rects[i];
          if (!r) return;
          frame.style.display = showInsets && width() >= 640 && roomForInsets() ? "block" : "none";
          frame.style.left = `${r.x}px`;
          frame.style.top = `${height() - r.y - r.h}px`;
          frame.style.width = `${r.w}px`;
          frame.style.height = `${r.h}px`;
        });
      };

      /* ------------------------------------------------ desenhar */
      const anchor = new THREE.Vector3();
      const mp = new THREE.Vector3();
      const mn = new THREE.Vector3();
      const toCam = new THREE.Vector3();
      const placeMarkers = () => {
        if (!markerEls.length) return;
        // Osso par: mostra no lado do corpo que está virado para a câmera.
        const left = camera.position.x - controls.target.x >= 0;
        markerList.forEach((m, i) => {
          const elm = markerEls[i];
          if (!elm) return;
          const sx = m.mirror && !left ? -1 : 1;
          mp.set((m.pos[0] ?? 0) * sx, m.pos[1] ?? 0, m.pos[2] ?? 0);
          mn.set((m.normal[0] ?? 0) * sx, m.normal[1] ?? 0, m.normal[2] ?? 0);
          const facing = mn.dot(toCam.copy(camera.position).sub(mp)) >= 0;
          const ndc = mp.clone().project(camera);
          const inside = ndc.z < 1 && Math.abs(ndc.x) < 1.05 && Math.abs(ndc.y) < 1.05;
          elm.style.display = inside ? "flex" : "none";
          if (!inside) return;
          const x = ((ndc.x + 1) / 2) * width();
          const y = ((1 - ndc.y) / 2) * height();
          elm.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
          // Do outro lado do osso: continua clicável, mas apagado.
          elm.style.opacity = facing || m.id === markerActive ? "1" : "0.4";
          elm.style.zIndex = m.id === markerActive ? "2" : "1";
        });
      };

      const placePin = () => {
        if (!pinKeys || !pinText?.textContent) {
          pinEl.style.display = "none";
          return;
        }
        // O ponto vai na peça visível mais perto da câmera, não no meio do corpo.
        let best: Entry | null = null;
        let bestDistance = Infinity;
        for (const e of entries) {
          if (!pinKeys.has(e.key) || !e.mesh.visible) continue;
          const d = e.center.distanceToSquared(camera.position);
          if (d < bestDistance) {
            bestDistance = d;
            best = e;
          }
        }
        if (!best) {
          pinEl.style.display = "none";
          return;
        }
        anchor.copy(best.center).project(camera);
        const visible = anchor.z < 1 && Math.abs(anchor.x) < 1.1 && Math.abs(anchor.y) < 1.1;
        pinEl.style.display = visible ? "block" : "none";
        if (!visible) return;
        const x = ((anchor.x + 1) / 2) * width();
        const y = ((1 - anchor.y) / 2) * height();
        pinEl.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      };

      const render = () => {
        const w = width();
        const h = height();
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, w, h);
        lightFrom(camera);
        renderer.render(scene, camera);
        placePin();
        placeMarkers();
        if (!showInsets || !roomForInsets()) return;
        const time = performance.now() / 1000;
        const target = controls.target;
        const sph = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
        renderer.autoClear = false;
        renderer.setScissorTest(true);
        insetRects().forEach((r, i) => {
          const cam = insetCams[i];
          if (!cam) return;
          const swing = reducedMotion.matches ? 0 : Math.sin(time * 0.3 + i * 2.1) * 0.3;
          const s = new THREE.Spherical(
            sph.radius * 0.92,
            THREE.MathUtils.clamp(sph.phi + r.tilt, 0.35, 2.7),
            sph.theta + r.turn + swing,
          );
          cam.position.setFromSpherical(s).add(target);
          cam.lookAt(target);
          cam.fov = camera.fov;
          cam.aspect = r.w / r.h;
          cam.updateProjectionMatrix();
          renderer.setViewport(r.x, r.y, r.w, r.h);
          renderer.setScissor(r.x, r.y, r.w, r.h);
          renderer.clearDepth();
          lightFrom(cam);
          renderer.render(scene, cam);
        });
        renderer.setScissorTest(false);
        renderer.autoClear = true;
        renderer.setViewport(0, 0, w, h);
      };

      const resize = () => {
        renderer.setSize(width(), height(), false);
        camera.aspect = width() / height();
        camera.updateProjectionMatrix();
        applyViewOffset();
        placeFrames();
        invalidate();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(el);

      let raf = 0;
      let skip = false;
      let pendingHover: { x: number; y: number } | null = null;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (document.hidden) return;
        const now = performance.now();
        if (tween) {
          tween.t0 ??= now;
          const t = Math.min(1, (now - tween.t0) / TWEEN_MS);
          const k = ease(t);
          const s = new THREE.Spherical(
            THREE.MathUtils.lerp(tween.from.radius, tween.to.radius, k),
            THREE.MathUtils.lerp(tween.from.phi, tween.to.phi, k),
            THREE.MathUtils.lerp(tween.from.theta, tween.to.theta, k),
          );
          controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
          camera.position.setFromSpherical(s).add(controls.target);
          if (t >= 1) {
            tween = null;
            if (swayOn) swayBase = { sph: s.clone(), t0: now };
          }
          dirty = true;
        } else if (swayOn && swayBase && !reducedMotion.matches) {
          // Vai e volta uns 14° em volta do foco, devagar: o músculo é visto em volume.
          const e = (now - swayBase.t0) / 1000;
          const s = swayBase.sph.clone();
          s.theta += Math.sin(e * 0.45) * 0.25;
          s.phi = THREE.MathUtils.clamp(s.phi + Math.sin(e * 0.31) * 0.05, 0.2, Math.PI - 0.2);
          camera.position.setFromSpherical(s).add(controls.target);
          dirty = true;
        }
        if (controls.update()) dirty = true;
        if (spotState) {
          // A mancha pulsa: o quadro precisa ser redesenhado.
          spotUniforms.uTime.value = now / 1000;
          placeSpot();
          dirty = true;
        }
        if (pendingHover && !tween) {
          const { x, y } = pendingHover;
          pendingHover = null;
          const entry = pickAt(x, y);
          hoverRef.current?.(entry ? toPick(entry) : null, x, y);
          canvas.style.cursor = entry ? "pointer" : "grab";
        }
        // As vistas pequenas balançam sempre; a 30 quadros por segundo basta.
        if (showInsets && !reducedMotion.matches && roomForInsets() && !dirty) {
          skip = !skip;
          if (skip) return;
          dirty = true;
        }
        if (!dirty) return;
        dirty = false;
        render();
      };

      const gltf = await new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .loadAsync(MODEL_URL, (event) => {
          if (!cancelled && event.total) {
            setStatus({ phase: "loading", progress: event.loaded / event.total });
          }
        })
        .catch(() => null);
      if (cancelled || !gltf) {
        renderer.dispose();
        canvas.remove();
        frames.forEach((f) => f.remove());
        pinEl.remove();
        markerLayer.remove();
        if (!cancelled) setStatus({ phase: "error", progress: 0 });
        return;
      }

      scene.add(gltf.scene);
      gltf.scene.updateMatrixWorld(true);
      const entries: Entry[] = [];
      gltf.scene.traverse((object) => {
        const mesh = object as Mesh;
        if (!mesh.isMesh) return;
        const data = mesh.userData as { name?: unknown; layer?: unknown; side?: unknown };
        if (typeof data.name !== "string" || !isLayer(data.layer)) return;
        mesh.material = mats.layer[data.layer];
        mesh.geometry.computeBoundingBox();
        const box = (mesh.geometry.boundingBox ?? new THREE.Box3())
          .clone()
          .applyMatrix4(mesh.matrixWorld);
        const side: Side = data.side === "left" || data.side === "right" ? data.side : "midline";
        entries.push({
          mesh,
          key: meshKey(data.name),
          layer: data.layer,
          side,
          name: data.name,
          box,
          center: box.getCenter(new THREE.Vector3()),
        });
      });
      const byMesh = new Map(entries.map((e) => [e.mesh, e]));
      const bones = entries.filter((e) => e.layer === "skeleton");
      const bounds = new THREE.Box3();
      entries.forEach((e) => bounds.union(e.box));
      const toPick = (e: Entry): AnatomyPick => ({ key: e.key, layer: e.layer, name: e.name });

      /* ------------------------------------------------ câmera */
      const freeFov = () => {
        const fov = THREE.MathUtils.degToRad(camera.fov);
        return 2 * Math.atan(Math.tan(fov / 2) * (freeHeight() / height()));
      };
      const animateTo = (position: Vector3, target: Vector3, animate: boolean) => {
        swayBase = null;
        if (!animate || reducedMotion.matches) {
          tween = null;
          camera.position.copy(position);
          controls.target.copy(target);
          controls.update();
          if (swayOn) {
            swayBase = {
              sph: new THREE.Spherical().setFromVector3(position.clone().sub(target)),
              t0: performance.now(),
            };
          }
          invalidate();
          return;
        }
        const from = new THREE.Spherical().setFromVector3(
          camera.position.clone().sub(controls.target),
        );
        const to = new THREE.Spherical().setFromVector3(position.clone().sub(target));
        // Gira pelo caminho mais curto.
        let turn = to.theta - from.theta;
        if (turn > Math.PI) turn -= 2 * Math.PI;
        if (turn < -Math.PI) turn += 2 * Math.PI;
        to.theta = from.theta + turn;
        tween = {
          t0: null,
          fromTarget: controls.target.clone(),
          toTarget: target.clone(),
          from,
          to,
        };
        invalidate();
      };
      const direction = (name: ViewName) =>
        name === "front"
          ? new THREE.Vector3(0, 0, 1)
          : name === "back"
            ? new THREE.Vector3(0, 0, -1)
            : name === "left"
              ? new THREE.Vector3(1, 0, 0)
              : name === "right"
                ? new THREE.Vector3(-1, 0, 0)
                : new THREE.Vector3(0.62, 0.3, 0.72).normalize();

      const home = (dir: Vector3, animate: boolean) => {
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const hFov =
          2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
        const distance =
          Math.max(
            (size.y / 2 / Math.tan(freeFov() / 2)) * 1.12,
            (size.x / 2 / Math.tan(hFov / 2)) * 1.1,
          ) +
          size.z / 2;
        animateTo(center.clone().addScaledVector(dir, distance), center, animate);
      };

      // Os botões de vista mostram o corpo inteiro, de frente, de costas, de lado.
      const setView = (name: ViewName, animate = true) => home(direction(name), animate);

      /**
       * De que lado olhar um músculo: do osso mais próximo para o músculo.
       * O bíceps está na frente do úmero, o tríceps atrás, o masseter do lado
       * e à frente do crânio — e é de lá que se vê cada um. Arredonda para
       * oito direções, com leve preferência pela frente.
       */
      const viewCache = new Map<string, Vector3>();
      const bestDirection = (sig: string, center: Vector3): Vector3 => {
        const cached = viewCache.get(sig);
        if (cached) return cached.clone();
        const near = bones
          .map((b) => ({ b, d: b.box.distanceToPoint(center) }))
          .sort((x, y) => x.d - y.d)
          .slice(0, 3);
        const axis = new THREE.Vector3();
        let total = 0;
        for (const { b, d } of near) {
          const w = 1 / (d + 0.01);
          axis.addScaledVector(b.center, w);
          total += w;
        }
        if (total > 0) axis.divideScalar(total);
        const off = new THREE.Vector3(center.x - axis.x, 0, center.z - axis.z);
        let best = new THREE.Vector3(0, 0.1, 1).normalize();
        if (off.lengthSq() > 1e-6) {
          off.normalize();
          let score = -Infinity;
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            const dir = new THREE.Vector3(Math.sin(a), 0.1, Math.cos(a)).normalize();
            const s = dir.dot(off) + (i % 2 === 0 ? 0.04 : 0) + (i === 0 ? 0.06 : 0);
            if (s > score) {
              score = s;
              best = dir;
            }
          }
        }
        viewCache.set(sig, best.clone());
        return best;
      };

      const focusOn = (req: FocusRequest) => {
        const keys = new Set(req.keys);
        const all = entries.filter((e) => keys.has(e.key));
        const sided = req.side ? all.filter((e) => e.side === req.side || e.side === "midline") : all;
        const chosen = sided.length ? sided : all;
        if (chosen.length === 0) return;
        const box = new THREE.Box3();
        chosen.forEach((e) => box.union(e.box));
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const hFov =
          2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
        const fit = size.length() / 2 / Math.sin(Math.min(freeFov(), hFov) / 2);
        if (req.point) {
          // Mira no ponto, olhando a superfície de frente, com o osso como contexto.
          const sx = req.side === "right" && req.point.mirror ? -1 : 1;
          const p = new THREE.Vector3(
            (req.point.pos[0] ?? 0) * sx,
            req.point.pos[1] ?? 0,
            req.point.pos[2] ?? 0,
          );
          const n = new THREE.Vector3(
            (req.point.normal[0] ?? 0) * sx,
            (req.point.normal[1] ?? 0) * 0.5 + 0.12,
            req.point.normal[2] ?? 0,
          );
          if (n.lengthSq() < 1e-6) n.set(0, 0.1, 1);
          n.normalize();
          const d = THREE.MathUtils.clamp(fit * (req.padding ?? 0.55), 0.3, 0.95);
          animateTo(p.clone().addScaledVector(n, d), p, true);
          return;
        }
        const distance = Math.max(fit * (req.padding ?? 2.3), 0.7);
        const sig = `${[...keys].sort().join("|")}:${req.side ?? "both"}`;
        animateTo(center.clone().addScaledVector(bestDirection(sig, center), distance), center, true);
      };

      resize();
      home(direction("front"), false);

      /* ----------------------------------------------------- tocar */
      const raycaster = new THREE.Raycaster();
      raycaster.layers.enableAll();
      let lastHit: number[] | null = null;
      const pickAt = (clientX: number, clientY: number): Entry | null => {
        lastHit = null;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;
        const pointer = new THREE.Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        // O destacado ganha do vulto que está na frente dele.
        const { priority, pickable } = stateRef.current;
        const hit =
          (priority.length ? raycaster.intersectObjects(priority, false)[0] : undefined) ??
          raycaster.intersectObjects(pickable, false)[0];
        lastHit = hit ? hit.point.toArray() : null;
        return hit ? (byMesh.get(hit.object as Mesh) ?? null) : null;
      };
      let down: { x: number; y: number; t: number } | null = null;
      const onDown = (event: PointerEvent) => {
        down = { x: event.clientX, y: event.clientY, t: performance.now() };
      };
      const onUp = (event: PointerEvent) => {
        const start = down;
        down = null;
        if (!start || event.button !== 0 || !stateRef.current.interactive) return;
        const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
        if (moved > 6 || performance.now() - start.t > 600) return; // foi um giro, não um toque
        const entry = pickAt(event.clientX, event.clientY);
        const point = lastHit;
        pickRef.current?.(entry ? { ...toPick(entry), ...(point ? { point } : {}) } : null);
      };
      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || event.buttons !== 0) return;
        if (!stateRef.current.interactive || !hoverRef.current) return;
        pendingHover = { x: event.clientX, y: event.clientY };
      };
      const onLeave = () => {
        pendingHover = null;
        hoverRef.current?.(null, 0, 0);
      };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);

      loop();

      ctl.current = {
        entries,
        mats,
        setView,
        focusOn,
        setInsets: (on) => {
          showInsets = on;
          placeFrames();
          invalidate();
        },
        setSway: (on) => {
          swayOn = on;
          if (!on) swayBase = null;
          else if (!tween) {
            swayBase = {
              sph: new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)),
              t0: performance.now(),
            };
          }
        },
        setBottomInset: (px) => {
          const next = Math.max(0, Math.round(px));
          if (next === reserved) return;
          reserved = next;
          applyViewOffset();
          placeFrames();
          invalidate();
        },
        setSpot: (next) => {
          spotState = next;
          if (next) {
            spotUniforms.uSpotColor.value.set(next.tone === "correct" ? 0x2fd27a : 0xff3b2a);
            // O raio acompanha o tamanho do osso: maior no fêmur, menor no crânio.
            const keys = new Set(next.keys);
            const box = new THREE.Box3();
            entries.filter((e) => keys.has(e.key)).forEach((e) => box.union(e.box));
            const size = box.isEmpty() ? 0.3 : box.getSize(new THREE.Vector3()).length();
            // Numa linha, a faixa é mais estreita: parece uma borda, não uma mancha.
            const wide = THREE.MathUtils.clamp(size * 0.07, 0.011, 0.03);
            spotUniforms.uRadius.value = (next.path?.length ?? 0) >= 2 ? wide * 0.6 : wide;
            placeSpot();
          }
          invalidate();
        },
        setMarkers: (list, active, labels) => {
          labelsOn = labels;
          markerList = list;
          markerActive = active;
          buildMarkers();
          invalidate();
        },
        setPin: (next) => {
          pinKeys = next && next.text ? new Set(next.keys) : null;
          if (pinText) pinText.textContent = next?.text ?? "";
          invalidate();
        },
        invalidate,
      };
      cleanup = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
        controls.dispose();
        gltf.scene.traverse((object) => {
          const mesh = object as Mesh;
          if (mesh.isMesh) mesh.geometry.dispose();
        });
        const all: Material[] = [
          ...Object.values(mats.layer),
          mats.hover,
          mats.soft,
          mats.fadeMuscle,
          mats.fadeBone,
          mats.dimMuscle,
          mats.dimBone,
          mats.veil,
          mats.spot,
          mats.ghostBone,
          mats.ghostMuscle,
          mats.selected,
          mats.focus,
          mats.correct,
          mats.wrong,
        ];
        all.forEach((m) => m.dispose());
        renderer.dispose();
        canvas.remove();
        frames.forEach((f) => f.remove());
        pinEl.remove();
        markerLayer.remove();
      };
      setStatus({ phase: "ready", progress: 1 });
      readyRef.current?.({ meshes: entries.length, keys: [...new Set(entries.map((e) => e.key))] });
    })();

    return () => {
      cancelled = true;
      ctl.current = null;
      cleanup?.();
    };
  }, []);

  const ready = status.phase === "ready";

  /* ------------------------------------ aplicar o estado aos materiais */
  const selectedSig = selectedKeys.join("|");
  const focusSig = focusKeys.join("|");
  const resultSig = result ? `${result.ok}:${result.keys.join("|")}` : "";
  const hiddenSig = hiddenKeys.join("|");
  const spotSig = spot
    ? `${spot.keys.join("|")}:${spot.pos.join(",")}:${spot.side}:${spot.mirror}:${spot.tone ?? "ask"}:${spot.path?.length ?? 0}`
    : "";
  const layerSig = LAYERS.map((l) => (layers[l] ? 1 : 0)).join("");

  useEffect(() => {
    const c = ctl.current;
    if (!c || !ready) return;
    const selected = new Set(selectedKeys);
    const focused = new Set(focusKeys);
    const answered = new Set(result?.keys ?? []);
    const hidden = new Set(hiddenKeys);
    const spotKeys = new Set(spot?.keys ?? []);
    // No lado fixo, só a peça daquele lado leva a mancha; no "auto", as duas.
    const isSpot = (key: string, side: string) =>
      !!spot &&
      spotKeys.has(key) &&
      (spot.side === "auto" || side === "midline" || side === spot.side);
    const lit = selected.size + focused.size + answered.size + spotKeys.size > 0;
    const style: Emphasis = xray ? "xray" : lit ? emphasis : "none";
    const pickable: Mesh[] = [];
    const priority: Mesh[] = [];
    c.mats.soft.opacity = Math.max(0.05, superficialOpacity);

    // No "destacar", o que fica na frente do alvo vira véu: alvo profundo → a camada
    // superficial; alvo no esqueleto → as duas camadas de músculo.
    const litLayers = new Set(
      c.entries
        .filter(
          (e) =>
            answered.has(e.key) ||
            focused.has(e.key) ||
            selected.has(e.key) ||
            isSpot(e.key, e.side),
        )
        .map((e) => e.layer),
    );
    const veiled = new Set<AnatomyLayer>(
      litLayers.has("skeleton")
        ? ["superficial muscles", "deep muscles"]
        : litLayers.has("deep muscles")
          ? ["superficial muscles"]
          : [],
    );

    for (const { mesh, key, layer, side } of c.entries) {
      let tone: Material | null = null;
      if (isSpot(key, side)) tone = c.mats.spot;
      else if (answered.has(key)) tone = result?.ok ? c.mats.correct : c.mats.wrong;
      else if (focused.has(key)) tone = c.mats.focus;
      else if (selected.has(key)) tone = c.mats.selected;

      mesh.layers.set(0);
      mesh.renderOrder = 0;
      if (tone) {
        mesh.visible = true;
        mesh.material = tone;
        pickable.push(mesh);
        if (style !== "none") priority.push(mesh);
        continue;
      }
      if (hidden.has(key)) {
        mesh.visible = false;
        continue;
      }

      if (style === "xray" || style === "isolate") {
        if (layer === "deep muscles" || (style === "isolate" && layer !== "skeleton")) {
          mesh.visible = false;
          continue;
        }
        mesh.visible = true;
        mesh.renderOrder = 2;
        if (layer === "skeleton") {
          mesh.material = c.mats.ghostBone;
        } else {
          // O vulto dos músculos só aparece na vista grande; nas pequenas, só osso.
          mesh.material = c.mats.ghostMuscle;
          mesh.layers.set(GHOST_LAYER);
        }
        continue;
      }

      mesh.visible = layers[layer];
      if (!mesh.visible) continue;
      if (style === "dim") {
        const veil = veiled.has(layer);
        mesh.material = veil ? c.mats.veil : layer === "skeleton" ? c.mats.dimBone : c.mats.dimMuscle;
        mesh.renderOrder = veil ? 1 : 0;
        if (!veil) pickable.push(mesh);
        continue;
      }
      if (style === "fade") {
        mesh.material = layer === "skeleton" ? c.mats.fadeBone : c.mats.fadeMuscle;
        mesh.renderOrder = 1;
        pickable.push(mesh);
        continue;
      }
      const soft = layer === "superficial muscles" && superficialOpacity < 0.999;
      mesh.material = key === hoverKey && !soft ? c.mats.hover : soft ? c.mats.soft : c.mats.layer[layer];
      mesh.renderOrder = soft ? 1 : 0;
      // Com a camada superficial quase transparente, o toque atravessa.
      if (!(soft && superficialOpacity < 0.35)) pickable.push(mesh);
    }
    stateRef.current.pickable = pickable;
    stateRef.current.priority = priority;
    c.invalidate();
    // As assinaturas em texto evitam recalcular a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSig, focusSig, resultSig, hiddenSig, spotSig, layerSig, superficialOpacity, emphasis, xray, hoverKey, ready]);

  useEffect(() => {
    if (ready) ctl.current?.setSpot(spot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotSig, ready]);

  /* ------------------------------------------------- câmera e vistas */
  // Só um pedido novo (outro nome ou outro nonce) move a câmera — não um objeto recriado.
  const viewName = view?.name;
  const viewNonce = view?.nonce;
  useEffect(() => {
    if (viewName && ready) ctl.current?.setView(viewName);
  }, [viewName, viewNonce, ready]);

  const focusSigReq = focus ? `${focus.nonce}:${focus.side ?? ""}:${focus.keys.join("|")}` : "";
  useEffect(() => {
    if (focus && ready) ctl.current?.focusOn(focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSigReq, ready]);

  const markerSig = markers ? markers.map((m) => m.id).join("|") : "";
  useEffect(() => {
    if (ready) ctl.current?.setMarkers(markers ?? [], activeMarker, markerLabels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerSig, activeMarker, markerLabels, ready]);

  const pinSig = pin ? `${pin.text}:${pin.keys.join("|")}` : "";
  useEffect(() => {
    if (ready) ctl.current?.setPin(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinSig, ready]);

  useEffect(() => {
    if (ready) ctl.current?.setInsets(insets);
  }, [insets, ready]);

  useEffect(() => {
    if (ready) ctl.current?.setSway(sway);
  }, [sway, ready]);

  useEffect(() => {
    if (ready) ctl.current?.setBottomInset(bottomInset);
  }, [bottomInset, ready]);

  // O destaque de passar o mouse só existe se alguém está ouvindo.
  hoverRef.current = onHover
    ? (pickResult, x, y) => {
        setHoverKey(pickResult?.key ?? null);
        const rect = host.current?.getBoundingClientRect();
        onHover(pickResult, x - (rect?.left ?? 0), y - (rect?.top ?? 0));
      }
    : undefined;

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div ref={host} className="absolute inset-0" />
      {!ready ? (
        <div className="absolute inset-0 grid place-items-center">
          {status.phase === "error" ? (
            <p className="max-w-xs text-center text-sm text-white/70">
              Não foi possível carregar o modelo 3D. Recarregue a página; se continuar, o navegador
              pode estar sem suporte a WebGL.
            </p>
          ) : (
            <div className="w-48 text-center">
              <p className="text-sm text-white/70">Carregando o modelo anatômico…</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="bg-primary h-full transition-[width]"
                  style={{ width: `${Math.round(status.progress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
