"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import type {
  AnatomyData,
  AnatomyLayer,
  Landmark,
  LandmarkIndex,
} from "@/lib/domain/anatomy-types";
import { recordMuscleAnswer, useAnatomyProgress } from "@/lib/anatomy-progress";
import { recordSession } from "@/lib/study-log";
import { cn } from "@/lib/utils";
import { Button, ButtonLink, ToggleChip } from "@/components/ui/primitives";
import { AnatomyViewer, type AnatomyPick, type Spot } from "./anatomy-viewer";
import { ViewToggle } from "./view-toggle";

/**
 * O desafio sobre o modelo 3D: músculos, ossos e acidentes ósseos.
 *
 * - **identificar** — a estrutura acende (o acidente, como uma região acesa
 *   no osso); escolha o nome entre quatro;
 * - **localizar** — o nome aparece; toque nela no corpo. Para ossos e
 *   acidentes os músculos saem do caminho; no acidente, vale o toque que cair
 *   perto do ponto certo, no osso certo, de qualquer lado do corpo;
 * - **pela função** (só músculos) — uma ação, origem ou inserção: de quem é?
 *
 * As alternativas erradas saem do mesmo osso ou da mesma região, que é onde a
 * confusão mora.
 */

type Kind = "identify" | "locate" | "function";
type ItemKind = "muscle" | "bone" | "landmark";

const KIND_LABEL: Record<Kind, string> = {
  identify: "Identificar",
  locate: "Localizar",
  function: "Pela função",
};
const ITEM_LABEL: Record<ItemKind, string> = {
  muscle: "Músculos",
  bone: "Ossos",
  landmark: "Acidentes",
};
const ALLOWED: Record<ItemKind, readonly Kind[]> = {
  muscle: ["identify", "locate", "function"],
  bone: ["identify", "locate"],
  landmark: ["identify", "locate"],
};
const FIELD_LABEL = { action: "Ação", origin: "Origem", insertion: "Inserção" } as const;
type Field = keyof typeof FIELD_LABEL;

/** Até onde um toque conta como "no acidente", em metros. */
const LANDMARK_TOLERANCE = 0.032;

interface Item {
  readonly id: string;
  readonly name: string;
  readonly kind: ItemKind;
  readonly region: string;
  /** Peças do modelo a acender. */
  readonly keys: readonly string[];
  /** A estrutura no atlas (o próprio músculo/osso, ou o osso do acidente). */
  readonly structureId: string;
  readonly boneName?: string;
  readonly mark?: Landmark;
  readonly tip?: string;
  readonly fields?: Partial<Record<Field, string>>;
}

interface Question {
  readonly kind: Kind;
  readonly target: Item;
  readonly options: readonly Item[];
  readonly field?: Field;
}

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** O texto da função não pode entregar o nome ("o bíceps flexiona…"). */
function leaks(text: string, name: string): boolean {
  const t = text.toLowerCase();
  return name
    .toLowerCase()
    .split(" ")
    .some((w) => w.length > 4 && t.includes(w));
}

function itemsOf(data: AnatomyData, landmarks: LandmarkIndex): Item[] {
  const items: Item[] = [];
  for (const s of data.structures) {
    const keys = s.parts.map((p) => p.toLowerCase());
    if (s.kind === "muscle" && s.ficha) {
      const fields: Partial<Record<Field, string>> = {};
      for (const f of ["action", "origin", "insertion"] as const) {
        const text = s.ficha[f];
        if (text.trim() && !leaks(text, s.namePt)) fields[f] = text;
      }
      items.push({
        id: s.id,
        name: s.namePt,
        kind: "muscle",
        region: s.region,
        keys,
        structureId: s.id,
        tip: s.ficha.examTip,
        fields,
      });
    } else if (s.kind === "bone" && s.bone) {
      items.push({ id: s.id, name: s.namePt, kind: "bone", region: s.region, keys, structureId: s.id, tip: s.bone.examTip });
      for (const m of landmarks[s.id] ?? []) {
        items.push({
          id: m.id,
          name: m.name,
          kind: "landmark",
          region: s.region,
          keys: [m.part],
          structureId: s.id,
          boneName: s.namePt,
          mark: m,
          tip: m.info,
        });
      }
    }
  }
  return items;
}

function distractors(target: Item, all: readonly Item[]): Item[] {
  const sameKind = all.filter((i) => i.kind === target.kind && i.id !== target.id && i.name !== target.name);
  const tiers =
    target.kind === "landmark"
      ? [
          sameKind.filter((i) => i.structureId === target.structureId),
          sameKind.filter((i) => i.region === target.region),
          sameKind,
        ]
      : [sameKind.filter((i) => i.region === target.region), sameKind];
  const out: Item[] = [];
  for (const tier of tiers) {
    for (const i of shuffle(tier)) {
      if (out.length >= 3) return out;
      if (!out.some((o) => o.name === i.name)) out.push(i);
    }
  }
  return out;
}

function build(pool: readonly Item[], all: readonly Item[], kinds: readonly Kind[], count: number): Question[] {
  return shuffle(pool)
    .slice(0, count)
    .map((target) => {
      const fieldKeys = Object.keys(target.fields ?? {}) as Field[];
      const possible = kinds.filter(
        (k) => ALLOWED[target.kind].includes(k) && (k !== "function" || fieldKeys.length > 0),
      );
      const kind = possible[Math.floor(Math.random() * possible.length)] ?? "identify";
      const field = kind === "function" ? fieldKeys[Math.floor(Math.random() * fieldKeys.length)] : undefined;
      return {
        kind,
        target,
        options: shuffle([target, ...distractors(target, all)]),
        ...(field ? { field } : {}),
      };
    });
}

const ALL_LAYERS: Record<AnatomyLayer, boolean> = {
  skeleton: true,
  "deep muscles": true,
  "superficial muscles": true,
};
const BONES_ONLY: Record<AnatomyLayer, boolean> = {
  skeleton: true,
  "deep muscles": false,
  "superficial muscles": false,
};

/** Distância do toque ao acidente: ao ponto, ou à linha (crista, margem). */
function distanceTo(point: readonly number[], mark: Landmark, sx: number): number {
  const [x = 0, y = 0, z = 0] = point;
  const pts = (mark.path && mark.path.length >= 2 ? mark.path : [mark.pos]).map(
    ([px = 0, py = 0, pz = 0]) => [px * sx, py, pz] as const,
  );
  if (pts.length === 1) {
    const [px, py, pz] = pts[0] ?? [0, 0, 0];
    return Math.hypot(x - px, y - py, z - pz);
  }
  let best = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay, az] = pts[i] ?? [0, 0, 0];
    const [bx, by, bz] = pts[i + 1] ?? [0, 0, 0];
    const [abx, aby, abz] = [bx - ax, by - ay, bz - az];
    const len = abx * abx + aby * aby + abz * abz || 1e-8;
    const t = Math.max(0, Math.min(1, ((x - ax) * abx + (y - ay) * aby + (z - az) * abz) / len));
    best = Math.min(best, Math.hypot(x - (ax + abx * t), y - (ay + aby * t), z - (az + abz * t)));
  }
  return best;
}

function near(point: readonly number[] | undefined, mark: Landmark): boolean {
  if (!point) return false;
  const d = Math.min(distanceTo(point, mark, 1), mark.mirror ? distanceTo(point, mark, -1) : Infinity);
  return d <= LANDMARK_TOLERANCE;
}

export function AnatomyQuiz({ data, landmarks }: { data: AnatomyData; landmarks: LandmarkIndex }) {
  const [region, setRegion] = useState<string | null>(null);
  const [what, setWhat] = useState<ItemKind[]>(["muscle"]);
  const [kinds, setKinds] = useState<Kind[]>(["identify", "locate", "function"]);
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<{ ok: boolean; keys: string[]; chosen?: string } | null>(null);
  const [score, setScore] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const { view: bodyView } = useAnatomyProgress();
  const started = useRef(Date.now());
  const regionName = useMemo(() => new Map(data.regions.map((r) => [r.id, r.name])), [data.regions]);
  const items = useMemo(() => itemsOf(data, landmarks), [data, landmarks]);

  const pool = items.filter((i) => what.includes(i.kind) && (!region || i.region === region));

  const start = () => {
    setQuestions(build(pool, items, kinds, count));
    setIndex(0);
    setScore(0);
    setAnswer(null);
    setOpacity(1);
    started.current = Date.now();
  };

  const q = questions?.[index];
  const targetKeys = q ? [...q.target.keys] : [];
  const finished = questions !== null && index >= questions.length;

  const settle = (ok: boolean, keys: string[], chosen?: string) => {
    if (!q || answer) return;
    setAnswer({ ok, keys, ...(chosen ? { chosen } : {}) });
    if (ok) setScore((n) => n + 1);
    // Conta também na revisão espaçada, como as lições.
    recordMuscleAnswer(
      {
        id: q.target.id,
        namePt: q.target.name,
        region: q.target.region,
        regionName: regionName.get(q.target.region) ?? q.target.region,
        kind: q.target.kind,
      },
      ok,
    );
  };

  const next = () => {
    if (!questions) return;
    const n = index + 1;
    setIndex(n);
    setAnswer(null);
    setOpacity(1);
    if (n >= questions.length) {
      recordSession({
        mode: "anatomia",
        title: `Desafiar · ${what.map((w) => ITEM_LABEL[w]).join(", ")}${region ? ` · ${regionName.get(region)}` : ""}`,
        correct: score,
        total: questions.length,
        seconds: Math.round((Date.now() - started.current) / 1000),
      });
    }
  };

  const onPick = (pick: AnatomyPick | null) => {
    if (!q || q.kind !== "locate" || answer || !pick) return;
    const mark = q.target.mark;
    const ok = mark ? pick.key === mark.part && near(pick.point, mark) : targetKeys.includes(pick.key);
    settle(ok, [pick.key]);
  };

  /* --------------------------------------------------- configuração */
  if (!questions) {
    const counts = (Object.keys(ITEM_LABEL) as ItemKind[]).map((k) => ({
      k,
      n: items.filter((i) => i.kind === k && (!region || i.region === region)).length,
    }));
    const onlyFunctionless = !what.includes("muscle");
    return (
      <div className="glass rounded-hero mx-auto max-w-2xl space-y-6 p-5 sm:p-6">
        <fieldset>
          <legend className="text-sm font-semibold">O que treinar</legend>
          <ul className="mt-2 flex flex-wrap gap-2">
            {counts.map(({ k, n }) => (
              <li key={k}>
                <ToggleChip
                  pressed={what.includes(k)}
                  onClick={() =>
                    setWhat((cur) =>
                      cur.includes(k) ? (cur.length > 1 ? cur.filter((x) => x !== k) : cur) : [...cur, k],
                    )
                  }
                >
                  {ITEM_LABEL[k]} <span className="text-ink-faint ml-1 font-mono text-xs">{n}</span>
                </ToggleChip>
              </li>
            ))}
          </ul>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">Região</legend>
          <ul className="mt-2 flex flex-wrap gap-2">
            <li>
              <ToggleChip pressed={region === null} onClick={() => setRegion(null)}>
                Corpo inteiro
              </ToggleChip>
            </li>
            {data.regions.map((r) => (
              <li key={r.id}>
                <ToggleChip pressed={region === r.id} onClick={() => setRegion(r.id)}>
                  {r.name}
                </ToggleChip>
              </li>
            ))}
          </ul>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">Tipos de pergunta</legend>
          <ul className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
              <li key={k}>
                <ToggleChip
                  pressed={kinds.includes(k)}
                  onClick={() =>
                    setKinds((cur) =>
                      cur.includes(k) ? (cur.length > 1 ? cur.filter((x) => x !== k) : cur) : [...cur, k],
                    )
                  }
                >
                  {KIND_LABEL[k]}
                </ToggleChip>
              </li>
            ))}
          </ul>
          {onlyFunctionless && kinds.includes("function") ? (
            <p className="text-ink-faint mt-2 text-xs">
              “Pela função” vale só para músculos; ossos e acidentes caem em identificar e localizar.
            </p>
          ) : null}
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">Quantas</legend>
          <ul className="mt-2 flex gap-2">
            {[10, 20, 30].map((n) => (
              <li key={n}>
                <ToggleChip pressed={count === n} onClick={() => setCount(n)}>
                  {n}
                </ToggleChip>
              </li>
            ))}
          </ul>
        </fieldset>
        <Button type="button" size="lg" onClick={start} disabled={pool.length === 0}>
          Começar
        </Button>
      </div>
    );
  }

  /* ------------------------------------------------------ resultado */
  if (finished || !q) {
    const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="glass rounded-hero mx-auto max-w-xl p-8 text-center">
        <p className="text-ink-faint text-xs font-semibold tracking-[0.18em] uppercase">Resultado</p>
        <p className="font-display text-primary mt-2 text-6xl tabular-nums">
          {score}/{questions.length}
        </p>
        <p className="text-ink-muted mt-1">{pct}% de acerto</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={start}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Outra rodada
          </Button>
          <Button type="button" variant="secundario" onClick={() => setQuestions(null)}>
            Mudar o desafio
          </Button>
          <ButtonLink href="/anatomia" variant="fantasma">
            Voltar ao atlas
          </ButtonLink>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------- pergunta */
  const t = q.target;
  const isMark = t.kind === "landmark" && !!t.mark;
  const locating = q.kind === "locate" && !answer;
  // Ossos e acidentes: os músculos saem do caminho para o dedo alcançar o osso.
  const boneLike = t.kind !== "muscle";

  // Antes da resposta, só o "identificar" mostra o alvo. Depois, o alvo fica
  // verde ou vermelho; no "localizar" errado, o toque fica vermelho e o
  // certo, azul. No acidente, quem acende é a região no osso (a "mancha").
  const missedLocate = q.kind === "locate" && answer !== null && !answer.ok;
  const focusKeys = !isMark && ((q.kind === "identify" && !answer) || missedLocate) ? targetKeys : [];
  const result =
    answer && !isMark
      ? missedLocate
        ? { keys: answer.keys, ok: false }
        : { keys: targetKeys, ok: answer.ok }
      : answer && isMark && missedLocate
        ? { keys: answer.keys, ok: false }
        : null;
  const spot: Spot | null =
    isMark && t.mark && (q.kind !== "locate" || answer)
      ? {
          keys: [t.mark.part],
          pos: t.mark.pos,
          mirror: t.mark.mirror,
          side: "auto",
          tone: answer?.ok ? "correct" : "ask",
          ...(t.mark.path ? { path: t.mark.path } : {}),
        }
      : null;

  const noun = t.kind === "muscle" ? "músculo" : t.kind === "bone" ? "osso" : "acidente";
  const prompt =
    q.kind === "identify"
      ? `Que ${noun} é este?`
      : q.kind === "locate"
        ? `Toque: ${t.name}`
        : `${FIELD_LABEL[q.field ?? "action"]}: de que músculo?`;

  // A câmera vai até o alvo sempre que ele é mostrado; no "localizar", até o
  // osso (no acidente) ou o corpo de frente — achar é a pergunta.
  const focus =
    isMark && t.mark
      ? q.kind === "identify" || answer
        ? { keys: [t.mark.part], point: { pos: t.mark.pos, normal: t.mark.normal, mirror: t.mark.mirror }, nonce: `${index}-${answer ? 1 : 0}` }
        : { keys: [t.mark.part], padding: 2.2, nonce: `${index}-bone` }
      : q.kind !== "locate" || answer
        ? { keys: targetKeys, padding: 2.8, nonce: `${index}-${answer ? 1 : 0}` }
        : null;
  const emphasis = locating ? "none" : bodyView === "raiox" ? "xray" : "dim";
  const atlasHref = isMark
    ? `/anatomia/atlas?estrutura=${t.structureId}&acidente=${t.id}`
    : `/anatomia/atlas?estrutura=${t.structureId}`;

  return (
    <div className="flex flex-col gap-3 lg:grid lg:h-[calc(100dvh-9rem)] lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-4">
      {/* No celular o corpo fica preso no topo e as alternativas rolam embaixo dele. */}
      <section
        aria-label="Corpo em 3D"
        className="rounded-panel sticky top-[4.75rem] z-10 h-[42dvh] min-h-[16rem] overflow-hidden bg-[radial-gradient(ellipse_at_center,#1b2333,#0a0d14_70%)] shadow-lg lg:static lg:h-auto lg:shadow-none"
      >
        <AnatomyViewer
          focusKeys={focusKeys}
          result={result}
          spot={spot}
          layers={boneLike && locating ? BONES_ONLY : ALL_LAYERS}
          superficialOpacity={opacity}
          emphasis={emphasis}
          focus={focus}
          view={locating && !isMark ? { name: "front", nonce: index } : undefined}
          onPick={onPick}
        />
        <ViewToggle className="absolute top-2 right-2" />
        {!boneLike ? (
          <label className="glass-strong absolute bottom-2 left-2 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:top-2 sm:bottom-auto">
            Transparência
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((1 - opacity) * 100)}
              onChange={(e) => setOpacity(1 - Number(e.target.value) / 100)}
              className="w-24"
              aria-label="Transparência dos músculos superficiais"
            />
          </label>
        ) : null}
      </section>

      <aside className="glass rounded-panel flex flex-col gap-4 p-4 sm:p-5 lg:overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="bg-line h-1.5 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-[width]"
              style={{ width: `${(index / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-ink-muted text-sm tabular-nums">
            {index + 1}/{questions.length}
          </span>
        </div>

        <div>
          <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">
            {KIND_LABEL[q.kind]} · {ITEM_LABEL[t.kind]} · {regionName.get(t.region)}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{prompt}</h2>
          {isMark && t.boneName ? <p className="text-ink-muted mt-1 text-sm">No osso: {t.boneName}</p> : null}
          {q.kind === "function" && q.field && t.fields?.[q.field] ? (
            <p className="bg-surface-sunken rounded-panel mt-3 px-4 py-3 text-sm leading-relaxed">
              {t.fields[q.field]}
            </p>
          ) : null}
          {locating ? (
            <p className="text-ink-muted mt-2 text-sm">
              {isMark
                ? "Gire o osso e toque no ponto; vale qualquer um dos lados do corpo."
                : boneLike
                  ? "Os músculos foram desligados: gire o esqueleto e toque no osso."
                  : "Gire o corpo e toque. Se ele estiver por baixo, aumente a transparência."}
            </p>
          ) : null}
        </div>

        {q.kind !== "locate" ? (
          <ul className="grid gap-2">
            {q.options.map((opt) => {
              const right = opt.id === t.id;
              const chosen = answer?.chosen === opt.id;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    disabled={Boolean(answer)}
                    onClick={() => settle(right, targetKeys, opt.id)}
                    className={cn(
                      "rounded-panel flex min-h-12 w-full items-center gap-3 border-2 px-4 py-3 text-left text-sm font-medium transition-colors",
                      !answer && "border-line bg-surface hover:border-primary",
                      answer && right && "border-sage bg-sage-soft",
                      answer && chosen && !right && "border-danger bg-danger-soft",
                      answer && !right && !chosen && "border-line bg-surface opacity-60",
                    )}
                  >
                    {answer && right ? <Check className="text-sage size-4" aria-hidden="true" /> : null}
                    {answer && chosen && !right ? <X className="text-danger size-4" aria-hidden="true" /> : null}
                    {opt.name}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {answer ? (
          <div
            role="status"
            className={cn(
              "rounded-panel border p-4 text-sm leading-relaxed",
              answer.ok ? "border-sage/40 bg-sage-soft" : "border-danger/30 bg-danger-soft",
            )}
          >
            <p className={cn("font-semibold", answer.ok ? "text-sage" : "text-danger")}>
              {answer.ok
                ? "Certo."
                : isMark && q.kind === "locate"
                  ? `O ${t.name.toLowerCase()} é a região acesa.`
                  : `Era: ${t.name}.`}
            </p>
            {t.tip ? <p className="mt-1.5">{t.tip}</p> : null}
            <Link href={atlasHref} className="text-primary mt-2 inline-block text-xs font-medium hover:underline">
              Abrir no atlas
            </Link>
          </div>
        ) : null}

        <div className="mt-auto flex justify-between gap-2">
          <Button type="button" variant="fantasma" size="sm" onClick={() => setQuestions(null)}>
            Sair
          </Button>
          {answer ? (
            <Button type="button" onClick={next}>
              {index + 1 === questions.length ? "Ver resultado" : "Próxima"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : q.kind === "locate" ? (
            <Button type="button" variant="secundario" size="sm" onClick={() => settle(false, [])}>
              Não sei
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
