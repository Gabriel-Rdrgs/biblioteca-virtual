"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import type { AnatomyData, AnatomyLayer, AnatomyStructure } from "@/lib/domain/anatomy-types";
import { recordMuscleAnswer, useAnatomyProgress } from "@/lib/anatomy-progress";
import { recordSession } from "@/lib/study-log";
import { cn } from "@/lib/utils";
import { Button, ButtonLink, ToggleChip } from "@/components/ui/primitives";
import { AnatomyViewer, type AnatomyPick } from "./anatomy-viewer";
import { ViewToggle } from "./view-toggle";

/**
 * Quiz de anatomia sobre o modelo 3D, nos três formatos do MioLab:
 *
 * - **identificar** — a estrutura acende; escolha o nome entre quatro;
 * - **localizar** — o nome aparece; toque nela no corpo;
 * - **pela função** — uma ação, origem ou inserção; de quem é?
 *
 * As alternativas erradas saem da mesma região, que é onde a confusão mora.
 */

type Kind = "identify" | "locate" | "function";
const KIND_LABEL: Record<Kind, string> = {
  identify: "Identificar",
  locate: "Localizar",
  function: "Pela função",
};
const FIELD_LABEL = { action: "Ação", origin: "Origem", insertion: "Inserção" } as const;
type Field = keyof typeof FIELD_LABEL;

interface Question {
  readonly kind: Kind;
  readonly target: AnatomyStructure;
  readonly options: readonly AnatomyStructure[];
  readonly field?: Field;
}

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** O texto da função não pode entregar o nome ("o bíceps flexiona…"). */
function leaks(text: string, s: AnatomyStructure): boolean {
  const t = text.toLowerCase();
  return s.namePt.toLowerCase().split(" ").some((w) => w.length > 4 && t.includes(w));
}

function build(pool: readonly AnatomyStructure[], all: readonly AnatomyStructure[], kinds: readonly Kind[], count: number): Question[] {
  const muscles = pool.filter((s) => s.kind === "muscle" && s.ficha);
  return shuffle(muscles)
    .slice(0, count)
    .map((target) => {
      const fields = (["action", "origin", "insertion"] as const).filter(
        (f) => target.ficha && target.ficha[f].trim() && !leaks(target.ficha[f], target),
      );
      const possible = kinds.filter((k) => k !== "function" || fields.length > 0);
      const kind = possible[Math.floor(Math.random() * possible.length)] ?? "identify";
      const sameRegion = all.filter((s) => s.id !== target.id && s.kind === "muscle" && s.region === target.region);
      const others = shuffle(sameRegion.length >= 3 ? sameRegion : all.filter((s) => s.id !== target.id && s.kind === "muscle")).slice(0, 3);
      const field = kind === "function" ? fields[Math.floor(Math.random() * fields.length)] : undefined;
      return { kind, target, options: shuffle([target, ...others]), ...(field ? { field } : {}) };
    });
}

const ALL_LAYERS: Record<AnatomyLayer, boolean> = {
  skeleton: true,
  "deep muscles": true,
  "superficial muscles": true,
};

export function AnatomyQuiz({ data }: { data: AnatomyData }) {
  const [region, setRegion] = useState<string | null>(null);
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

  const start = () => {
    const pool = data.structures.filter((s) => !region || s.region === region);
    setQuestions(build(pool, data.structures, kinds, count));
    setIndex(0);
    setScore(0);
    setAnswer(null);
    setOpacity(1);
    started.current = Date.now();
  };

  const q = questions?.[index];
  const targetKeys = q ? q.target.parts.map((p) => p.toLowerCase()) : [];
  const finished = questions !== null && index >= questions.length;

  const settle = (ok: boolean, keys: string[], chosen?: string) => {
    if (!q || answer) return;
    setAnswer({ ok, keys, ...(chosen ? { chosen } : {}) });
    if (ok) setScore((n) => n + 1);
    // Conta também na revisão espaçada, como as lições.
    recordMuscleAnswer(
      {
        id: q.target.id,
        namePt: q.target.namePt,
        region: q.target.region,
        regionName: regionName.get(q.target.region) ?? q.target.region,
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
        title: region ? `Anatomia 3D · ${regionName.get(region)}` : "Anatomia 3D",
        correct: score,
        total: questions.length,
        seconds: Math.round((Date.now() - started.current) / 1000),
      });
    }
  };

  const onPick = (pick: AnatomyPick | null) => {
    if (!q || q.kind !== "locate" || answer || !pick) return;
    settle(targetKeys.includes(pick.key), [pick.key]);
  };

  /* --------------------------------------------------- configuração */
  if (!questions) {
    return (
      <div className="glass rounded-hero mx-auto max-w-2xl space-y-6 p-6">
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
        <Button type="button" size="lg" onClick={start}>
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
            Mudar região ou tipo
          </Button>
          <ButtonLink href="/anatomia" variant="fantasma">
            Voltar ao atlas
          </ButtonLink>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------- pergunta */
  // Antes da resposta, só o "identificar" mostra o alvo. Depois, o alvo fica
  // verde ou vermelho; no "localizar" errado, o toque fica vermelho e o
  // músculo certo, azul.
  const missedLocate = q.kind === "locate" && answer !== null && !answer.ok;
  const focusKeys = (q.kind === "identify" && !answer) || missedLocate ? targetKeys : [];
  const result = answer
    ? missedLocate
      ? { keys: answer.keys, ok: false }
      : { keys: targetKeys, ok: answer.ok }
    : null;
  const prompt =
    q.kind === "identify"
      ? "Que músculo é este?"
      : q.kind === "locate"
        ? `Toque no ${q.target.namePt.toLowerCase()}`
        : `${FIELD_LABEL[q.field ?? "action"]}: de que músculo?`;

  // A câmera vai até o músculo sempre que ele é mostrado: no celular, o corpo
  // inteiro deixaria o alvo do tamanho de um grão. No "localizar", só depois
  // da resposta — antes, achar é a pergunta.
  const showTarget = q.kind !== "locate" || answer !== null;
  const focus = showTarget
    ? { keys: targetKeys, padding: 2.8, nonce: `${index}-${answer ? 1 : 0}` }
    : { keys: [] as string[], nonce: `${index}-home` };

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
          layers={ALL_LAYERS}
          superficialOpacity={opacity}
          emphasis={q.kind === "locate" && !answer ? "none" : bodyView === "raiox" ? "xray" : "dim"}
          focus={focus.keys.length ? focus : null}
          view={q.kind === "locate" && !answer ? { name: "front", nonce: index } : undefined}
          onPick={onPick}
        />
        <ViewToggle className="absolute top-2 right-2" />
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
            {KIND_LABEL[q.kind]} · {regionName.get(q.target.region)}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{prompt}</h2>
          {q.kind === "function" && q.field && q.target.ficha ? (
            <p className="bg-surface-sunken rounded-panel mt-3 px-4 py-3 text-sm leading-relaxed">
              {q.target.ficha[q.field]}
            </p>
          ) : null}
          {q.kind === "locate" && !answer ? (
            <p className="text-ink-muted mt-2 text-sm">
              Gire o corpo e toque. Se ele estiver por baixo, aumente a transparência.
            </p>
          ) : null}
        </div>

        {q.kind !== "locate" ? (
          <ul className="grid gap-2">
            {q.options.map((opt) => {
              const right = opt.id === q.target.id;
              const chosen = answer?.chosen === opt.id;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    disabled={Boolean(answer)}
                    onClick={() => settle(right, targetKeys, opt.id)}
                    className={cn(
                      "rounded-panel flex w-full items-center gap-3 border-2 px-4 py-3 text-left text-sm font-medium transition-colors",
                      !answer && "border-line bg-surface hover:border-primary",
                      answer && right && "border-sage bg-sage-soft",
                      answer && chosen && !right && "border-danger bg-danger-soft",
                      answer && !right && !chosen && "border-line bg-surface opacity-60",
                    )}
                  >
                    {answer && right ? <Check className="text-sage size-4" aria-hidden="true" /> : null}
                    {answer && chosen && !right ? <X className="text-danger size-4" aria-hidden="true" /> : null}
                    {opt.namePt}
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
              {answer.ok ? "Certo." : `Era o ${q.target.namePt.toLowerCase()}.`}
            </p>
            {q.target.ficha?.examTip ? <p className="mt-1.5">{q.target.ficha.examTip}</p> : null}
            <Link
              href={`/anatomia/atlas?estrutura=${q.target.id}`}
              className="text-primary mt-2 inline-block text-xs font-medium hover:underline"
            >
              Abrir a ficha no atlas
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
