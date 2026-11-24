"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CornerDownLeft, Flame, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import {
  giveUp as revealRest,
  isCorrect,
  pressKey,
  splitQualifier,
  startTyping,
  toSlots,
  wordsPerMinute,
  type Slot,
  type TypingState,
} from "@/lib/domain/anatomy-typing";
import { LESSON_PASS, shuffle } from "@/lib/domain/anatomy-lessons";
import { MODEL_CREDIT } from "@/lib/domain/anatomy-types";
import { playCue, type Cue } from "@/lib/anatomy-sound";
import {
  getAnatomyProgress,
  recordLessonResult,
  recordMuscleAnswer,
  setAnatomySound,
  useAnatomyProgress,
} from "@/lib/anatomy-progress";
import { recordSession } from "@/lib/study-log";
import { cn } from "@/lib/utils";
import { AnatomyViewer } from "./anatomy-viewer";
import { KeyCatcher, TypedName } from "./typed-name";

/**
 * O treino de nomes — o simulador 3D que corrige.
 *
 * O músculo acende em vermelho no corpo em raio-X, a câmera vai até ele e
 * duas vistas pequenas giram em volta. A pessoa escreve o nome; cada tecla é
 * conferida na hora (som, cor, tremida no erro).
 *
 * Lição: três rodadas pelos mesmos músculos — com o nome à vista, só com a
 * primeira letra e de memória olhando o outro lado. Só a terceira conta e
 * entra na revisão espaçada. Revisão: só a rodada de memória, com os
 * músculos que venceram hoje.
 */

export interface TrainerMuscle {
  readonly id: string;
  readonly namePt: string;
  readonly region: string;
  readonly regionName: string;
  readonly parts: readonly string[];
  readonly clue: string;
  readonly explanation: string;
}

type Round = 1 | 2 | 3;
type Phase = "typing" | "pause" | "missed" | "done";

interface Result {
  readonly id: string;
  readonly ok: boolean;
  readonly errors: number;
  readonly revealed: number;
  readonly gaveUp: boolean;
}

interface State {
  readonly round: Round;
  readonly order: readonly string[];
  readonly index: number;
  readonly slots: readonly Slot[];
  readonly typing: TypingState;
  readonly phase: Phase;
  readonly hint: boolean;
  readonly startedAt: number;
  readonly durationMs: number;
  readonly keys: number;
  readonly wrongKeys: number;
  readonly chars: number;
  readonly streak: number;
  readonly results: readonly Result[];
  readonly shake: number;
}

const ROUND_INFO: Record<Round, { label: string; instruction: string }> = {
  1: { label: "digite", instruction: "Digite o nome enquanto observa o músculo." },
  2: { label: "primeira letra", instruction: "Só a primeira letra aparece. Complete o nome." },
  3: { label: "de memória, outro lado", instruction: "Nomeie o músculo em vermelho." },
};

function itemState(muscle: TrainerMuscle | undefined) {
  const slots = toSlots(splitQualifier(muscle?.namePt ?? "").text);
  return { slots, typing: startTyping(slots), phase: "typing" as Phase, hint: false };
}

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function duration(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** No celular, o teclado virtual encolhe a área visível; o palco acompanha. */
function useVisibleHeight(): { height: number | null; keyboard: boolean } {
  const [state, setState] = useState<{ height: number | null; keyboard: boolean }>({
    height: null,
    keyboard: false,
  });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let tallest = 0;
    let width = 0;
    const update = () => {
      if (Math.abs(vv.scale - 1) > 0.01) return setState({ height: null, keyboard: false });
      if (vv.width !== width) {
        width = vv.width;
        tallest = 0;
      }
      tallest = Math.max(tallest, vv.height);
      setState({ height: Math.round(vv.height), keyboard: tallest - vv.height > 140 });
    };
    vv.addEventListener("resize", update);
    update();
    return () => vv.removeEventListener("resize", update);
  }, []);
  return state;
}

export function NameTrainer({
  mode,
  title,
  lesson,
  muscles,
  nextLesson,
  exitHref,
}: {
  mode: "licao" | "revisao";
  title: string;
  lesson?: { readonly id: string; readonly title: string };
  muscles: readonly TrainerMuscle[];
  nextLesson?: { readonly href: string; readonly title: string } | null;
  exitHref: string;
}) {
  const router = useRouter();
  const byId = useMemo(() => new Map(muscles.map((m) => [m.id, m])), [muscles]);
  const progress = useAnatomyProgress();
  const firstRound: Round = mode === "revisao" ? 3 : 1;

  const fresh = useCallback((): State => {
    const order = mode === "revisao" ? shuffle(muscles.map((m) => m.id)) : muscles.map((m) => m.id);
    return {
      round: firstRound,
      order,
      index: 0,
      ...itemState(byId.get(order[0] ?? "")),
      startedAt: Date.now(),
      durationMs: 0,
      keys: 0,
      wrongKeys: 0,
      chars: 0,
      streak: 0,
      results: [],
      shake: 0,
    };
  }, [byId, firstRound, mode, muscles]);

  const [state, setState] = useState<State>(fresh);
  const stateRef = useRef(state);
  stateRef.current = state;
  // Grava no ref já na hora: duas teclas no mesmo quadro não leem estado velho.
  const commit = useCallback((next: State) => {
    stateRef.current = next;
    setState(next);
  }, []);
  const [now, setNow] = useState(() => Date.now());
  const bottom = useRef<HTMLDivElement>(null);
  const [bottomHeight, setBottomHeight] = useState(0);
  // "Centralizar": pede de novo o enquadramento do músculo depois de girar à vontade.
  const [refocus, setRefocus] = useState(0);
  const { height: visibleHeight, keyboard } = useVisibleHeight();

  const cue = useCallback((c: Cue, p = 0) => {
    if (getAnatomyProgress().sound) playCue(c, p);
  }, []);

  const muscle = byId.get(state.order[state.index] ?? "");
  const { qualifier } = splitQualifier(muscle?.namePt ?? "");
  const answered = state.phase !== "typing";
  const active = state.phase !== "done";

  /* ----------------------------------------------- terminar um nome */
  const settle = useCallback(
    (s: State, typing: TypingState, gaveUp: boolean): State => {
      const current = byId.get(s.order[s.index] ?? "");
      const clean = !gaveUp && typing.errors === 0 && typing.revealed.length === 0;
      if (s.round < 3) {
        cue(typing.revealed.length ? "miss" : "correct");
        return { ...s, typing, phase: "pause", streak: clean ? s.streak + 1 : 0 };
      }
      const ok = !gaveUp && isCorrect(typing, s.slots);
      if (current) recordMuscleAnswer(current, ok);
      cue(ok ? "correct" : "miss");
      return {
        ...s,
        typing,
        phase: ok ? "pause" : "missed",
        streak: ok ? s.streak + 1 : 0,
        results: [
          ...s.results,
          {
            id: current?.id ?? "",
            ok,
            errors: typing.errors,
            revealed: typing.revealed.length,
            gaveUp,
          },
        ],
      };
    },
    [byId, cue],
  );

  const key = useCallback(
    (raw: string) => {
      const s = stateRef.current;
      if (s.phase !== "typing") return;
      const { state: typing, result } = pressKey(s.typing, s.slots, raw, s.round === 1 ? Infinity : 3);
      if (result === "ignored") return;
      const ok = result === "ok";
      let next: State = {
        ...s,
        typing,
        keys: s.keys + 1,
        wrongKeys: s.wrongKeys + (ok ? 0 : 1),
        chars: s.chars + (typing.hits - s.typing.hits),
        shake: ok ? s.shake : s.shake + 1,
      };
      if (typing.done) next = settle(next, typing, false);
      else cue(ok ? "key" : "slip", typing.pos / Math.max(1, s.slots.length));
      commit(next);
    },
    [commit, cue, settle],
  );

  const giveUp = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== "typing" || s.round < 2) return;
    commit(settle(s, revealRest(s.typing, s.slots), true));
  }, [commit, settle]);

  const showHint = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === "typing" && s.round >= 2 && !s.hint) commit({ ...s, hint: true });
  }, [commit]);

  const advance = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === "typing" || s.phase === "done") return;
    if (s.index + 1 < s.order.length) {
      commit({ ...s, index: s.index + 1, ...itemState(byId.get(s.order[s.index + 1] ?? "")) });
      return;
    }
    if (s.round < 3) {
      const order = shuffle(muscles.map((m) => m.id));
      commit({
        ...s,
        round: (s.round + 1) as Round,
        order,
        index: 0,
        ...itemState(byId.get(order[0] ?? "")),
      });
      return;
    }
    const durationMs = Date.now() - s.startedAt;
    const correct = s.results.filter((r) => r.ok).length;
    const seconds = Math.round(durationMs / 1000);
    if (mode === "licao" && lesson) recordLessonResult(lesson, correct, s.results.length, seconds);
    else recordSession({ mode: "anatomia", title, correct, total: s.results.length, seconds });
    cue("finish");
    commit({ ...s, phase: "done", durationMs });
  }, [byId, commit, cue, lesson, mode, muscles, title]);

  const exit = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== "done" && s.results.length > 0) {
      const ok = window.confirm("Sair? As respostas da rodada de memória já ficaram registradas.");
      if (!ok) return;
    }
    router.push(exitHref);
  }, [exitHref, router]);

  /* ------------------------------------------------- efeitos */
  // Acertou: segue sozinho (um pouco mais devagar na rodada de memória, para ver o verde).
  useEffect(() => {
    if (state.phase !== "pause") return;
    const timer = setTimeout(advance, state.round === 3 ? 750 : 420);
    return () => clearTimeout(timer);
  }, [state.phase, state.index, state.round, advance]);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape") return exit();
      const inField = event.target instanceof HTMLInputElement;
      if (event.key === "Enter") {
        // No campo invisível, o Enter já é tratado por ele; aqui seria em dobro.
        if (!inField && stateRef.current.phase === "missed") advance();
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        if (stateRef.current.round === 3) showHint();
        return;
      }
      // Dentro do campo invisível, quem lê as teclas é ele.
      if (event.key.length === 1 && !inField) {
        if (event.key === " ") event.preventDefault();
        key(event.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, advance, exit, key, showHint]);

  useEffect(() => {
    const el = bottom.current;
    if (!el) return;
    const measure = () => setBottomHeight(el.offsetHeight + 4);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [active]);

  /* ------------------------------------------------- o que o corpo mostra */
  const parts = muscle?.parts ?? [];
  const green = state.phase === "pause" && state.round === 3;
  const focus = useMemo(
    () => ({
      keys: parts,
      side: (state.round === 3 ? "right" : "left") as "left" | "right",
      padding: 3.1,
      nonce: `${state.round}-${state.index}-${refocus}`,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.round, state.index, refocus, parts.join("|")],
  );

  if (!active) {
    return (
      <LessonResult
        mode={mode}
        state={state}
        byId={byId}
        title={title}
        nextLesson={nextLesson ?? null}
        onRepeat={() => commit(fresh())}
        exitHref={exitHref}
      />
    );
  }

  const accuracy = state.keys ? 1 - state.wrongKeys / state.keys : null;
  const text =
    state.round === 3 && !state.hint && !answered
      ? ROUND_INFO[3].instruction
      : state.round === 3 && answered
        ? muscle?.explanation
        : muscle?.clue;

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 overflow-hidden bg-[#0a0d14] text-white"
      style={{ height: visibleHeight ? `${visibleHeight}px` : "100dvh" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#161d2b,#0a0d14_70%)]" />
      <AnatomyViewer
        xray
        interactive={false}
        selectedKeys={green ? [] : parts}
        result={green ? { keys: parts, ok: true } : null}
        focus={focus}
        insets
        sway
        bottomInset={bottomHeight}
        className="absolute inset-0"
      />

      {/* ------------------------------------------------ barra de cima */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start gap-2 p-2 pt-[max(8px,env(safe-area-inset-top))] sm:p-4 [&_button]:pointer-events-auto">
        <button
          type="button"
          onClick={exit}
          aria-label="Sair do treino"
          title="Sair (Esc)"
          className="grid size-11 shrink-0 place-items-center rounded-xl text-white/70 hover:bg-white/5 hover:text-white"
        >
          <X className="size-5" />
        </button>
        <div className="min-w-0 pt-3 leading-none">
          <p className="truncate text-[13px] font-medium text-white/90">{title}</p>
          {mode === "licao" ? (
            <div className="mt-1.5 flex gap-1" aria-label={`Rodada ${state.round} de 3`}>
              {[1, 2, 3].map((r) => (
                <span
                  key={r}
                  className={cn(
                    "h-[3px] w-6 rounded-full",
                    r < state.round ? "bg-[#ff4d3a]/60" : r === state.round ? "bg-[#ff4d3a]" : "bg-white/10",
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div
          className="ml-auto flex shrink-0 items-center gap-3 pt-3 font-mono text-[12.5px] text-white/50"
          aria-label="Desempenho"
        >
          <span title="Palavras por minuto">
            <b className="font-medium text-white/90">{wordsPerMinute(state.chars, now - state.startedAt)}</b> ppm
          </span>
          <span title="Teclas certas">
            <b className="font-medium text-white/90">{percent(accuracy)}</b>
          </span>
          <span
            title="Nomes seguidos sem erro"
            className={cn("flex items-center gap-1", state.streak > 0 ? "text-amber-400" : "text-white/40")}
          >
            <Flame className="size-3" aria-hidden="true" />
            <b className="font-medium">{state.streak}</b>
          </span>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => {
            setAnatomySound(!progress.sound);
            if (!progress.sound) setTimeout(() => playCue("correct"), 0);
          }}
          aria-pressed={progress.sound}
          aria-label={progress.sound ? "Desligar sons" : "Ligar sons"}
          className="grid size-11 shrink-0 place-items-center rounded-xl text-white/70 hover:bg-white/5"
        >
          {progress.sound ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
        </button>
      </div>

      <p className="pointer-events-none absolute bottom-1 left-2 hidden text-[10px] text-white/30 sm:block">
        Modelo 3D “ecorche”, Charleeh · CC BY-SA 4.0 · BodyParts3D, Z-Anatomy
      </p>
      <div className="absolute right-2 bottom-1 hidden items-center gap-2 text-[11px] text-white/45 sm:flex">
        <span className="pointer-events-none">Arraste para girar · role para aproximar</span>
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setRefocus((n) => n + 1)}
          className="rounded-full border border-white/15 px-2.5 py-1 text-white/70 hover:bg-white/5 hover:text-white"
        >
          Centralizar
        </button>
      </div>

      {/* ------------------------------------------------ o nome */}
      <div
        ref={bottom}
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center px-3 pt-2 text-center [text-shadow:0_1px_10px_rgba(0,0,0,0.95)]",
          keyboard ? "pb-1" : "pb-4 sm:pb-8",
        )}
      >
        <p className="mb-1.5 font-mono text-[12px] tracking-wide text-white/60">
          rodada {state.round} · {ROUND_INFO[state.round].label} · {state.index + 1} / {state.order.length}
        </p>
        <KeyCatcher onKey={key} onEnter={() => stateRef.current.phase === "missed" && advance()} resetKey={`${state.round}-${state.index}`}>
          <TypedName
            slots={state.slots}
            typing={state.typing}
            round={state.round}
            reveal={answered}
            shakeKey={state.shake}
          />
          {qualifier ? <p className="mt-0.5 font-mono text-[11px] text-white/40">({qualifier})</p> : null}
        </KeyCatcher>
        <p
          className={cn(
            "mx-auto max-w-xl leading-snug text-white/90 lg:text-[14px]",
            keyboard ? "mt-1 line-clamp-2 text-[13.5px]" : "mt-2 line-clamp-3 min-h-[2.6em] text-[14.5px]",
          )}
        >
          {text}
        </p>
        <div
          className={cn("pointer-events-auto flex items-center gap-2", keyboard ? "mt-0.5" : "mt-2", "min-h-11")}
          onPointerDown={(e) => e.preventDefault()}
        >
          {state.phase === "missed" ? (
            <button
              type="button"
              onClick={advance}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#ff4d3a] px-4 text-sm font-semibold text-white hover:bg-[#ff6a55]"
            >
              Continuar <CornerDownLeft className="size-3.5" aria-hidden="true" />
            </button>
          ) : state.round >= 2 && !answered ? (
            <>
              {state.round === 3 && !state.hint ? (
                <button
                  type="button"
                  onClick={showHint}
                  title="Pista (Tab)"
                  className="min-h-9 rounded-full px-3 text-sm font-medium text-white/80 hover:bg-white/5"
                >
                  Pista
                </button>
              ) : null}
              <button
                type="button"
                onClick={giveUp}
                className="min-h-9 rounded-full px-3 text-sm font-medium text-white/80 hover:bg-white/5"
              >
                Não sei
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ resultado */

function LessonResult({
  mode,
  state,
  byId,
  title,
  nextLesson,
  onRepeat,
  exitHref,
}: {
  mode: "licao" | "revisao";
  state: State;
  byId: ReadonlyMap<string, TrainerMuscle>;
  title: string;
  nextLesson: { readonly href: string; readonly title: string } | null;
  onRepeat: () => void;
  exitHref: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const correct = state.results.filter((r) => r.ok).length;
  const total = state.results.length;
  const score = total ? correct / total : 0;
  const passed = score >= LESSON_PASS;
  const accuracy = state.keys ? 1 - state.wrongKeys / state.keys : null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 pt-6 pb-10 sm:px-6">
      <div>
        <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">
          {mode === "licao" ? "Lição" : "Revisão"} · {title}
        </p>
        <div className="mt-2 flex items-end gap-4">
          <p
            className={cn(
              "text-6xl leading-none font-semibold tracking-tight",
              passed ? "text-emerald-600 dark:text-emerald-400" : "text-ink",
            )}
          >
            {correct}/{total}
          </p>
          <p className="text-ink-muted pb-1 text-sm">nomes escritos de memória</p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Velocidade", `${wordsPerMinute(state.chars, state.durationMs)} ppm`],
          ["Teclas certas", percent(accuracy)],
          ["Tempo", duration(state.durationMs)],
        ].map(([label, value]) => (
          <div key={label} className="glass rounded-xl py-3">
            <dd className="font-mono text-xl">{value}</dd>
            <dt className="text-ink-faint mt-0.5 text-[11px] tracking-wider uppercase">{label}</dt>
          </div>
        ))}
      </dl>

      <p className="glass text-ink-muted rounded-xl px-4 py-3 text-sm leading-relaxed">
        {passed
          ? "Bem fixado. Os músculos entraram na revisão espaçada e voltam amanhã em “Revisar hoje”."
          : "Os nomes que faltaram voltam ainda hoje em “Revisar hoje”. Repita para fixar."}
      </p>

      <section>
        <h2 className="text-ink-faint text-micro mb-2 font-semibold tracking-[0.14em] uppercase">Músculos</h2>
        <ul className="space-y-1">
          {state.results.map((r) => {
            const m = byId.get(r.id);
            if (!m) return null;
            const isOpen = open === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  aria-expanded={isOpen}
                  className={cn(
                    "border-line flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm",
                    isOpen && "border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full",
                      r.ok ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600",
                    )}
                  >
                    {r.ok ? <Check className="size-3" /> : <X className="size-3" />}
                  </span>
                  <span className="flex-1 truncate">{m.namePt}</span>
                  <span className="text-ink-faint font-mono text-[11px]">
                    {r.gaveUp
                      ? "não lembrou"
                      : r.revealed
                        ? `${r.revealed} letra${r.revealed > 1 ? "s" : ""} revelada${r.revealed > 1 ? "s" : ""}`
                        : r.errors
                          ? `${r.errors} deslize${r.errors > 1 ? "s" : ""}`
                          : "sem erros"}
                  </span>
                </button>
                {isOpen ? (
                  <div className="glass text-ink-muted mt-1 space-y-2 rounded-xl p-3.5 text-sm leading-relaxed">
                    <p>{m.explanation}</p>
                    <Link href={`/anatomia/atlas?estrutura=${m.id}`} className="text-primary font-medium">
                      Abrir a ficha no atlas →
                    </Link>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        {nextLesson && passed ? (
          <Link
            href={nextLesson.href}
            className="bg-primary text-on-primary inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold"
          >
            Próxima lição · {nextLesson.title} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onRepeat}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold",
            nextLesson && passed ? "glass-strong" : "bg-primary text-on-primary",
          )}
        >
          <RotateCcw className="size-4" aria-hidden="true" /> Repetir
        </button>
        <Link
          href={exitHref}
          className="text-ink-muted inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium"
        >
          Concluir
        </Link>
      </div>
      <p className="text-ink-faint text-xs leading-relaxed">{MODEL_CREDIT}</p>
    </div>
  );
}
