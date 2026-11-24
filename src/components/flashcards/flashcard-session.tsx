"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Shuffle } from "lucide-react";
import {
  buildQueue,
  cardStatus,
  countDeck,
  requeue,
  type CardReview,
  type CardStatus,
  type Grade,
} from "@/lib/domain/flashcard-review";
import type { DeckImage, FlashDeck, Flashcard } from "@/lib/domain/flashcard-types";
import { gradeCard, loadReviews, resetDeckProgress } from "@/lib/flashcard-storage";
import { recordAnswer, recordSession } from "@/lib/study-log";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/primitives";
import { CardFigure, FigureLightbox } from "./card-figure";
import { RichText } from "./rich-text";

/**
 * Uma sessão de flashcards.
 *
 * A fila começa pelo que venceu, segue pelos novos e, se a pessoa quiser,
 * passa pelo resto. Cada nota move o cartão de caixa (flashcard-review) e,
 * se foi ruim, o devolve à fila da própria sessão: errou, volta daqui a
 * quatro cartões; quase, daqui a oito.
 *
 * Atalhos como os do Anki, que é o que metade da turma já usa: espaço vira,
 * 1-2-3 dão a nota, setas navegam.
 */

const OPTIONS_KEY = "atlas:flashcards:opcoes";

interface Options {
  shuffle: boolean;
  onlyPending: boolean;
  onlyImages: boolean;
}

function readOptions(): Options {
  try {
    const raw = window.localStorage.getItem(OPTIONS_KEY);
    return { shuffle: false, onlyPending: false, onlyImages: false, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { shuffle: false, onlyPending: false, onlyImages: false };
  }
}

function writeOptions(options: Options): void {
  try {
    window.localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
  } catch {
    // Preferência de conforto: sem armazenamento, só não é lembrada.
  }
}

const STATUS_STYLES: Record<CardStatus, string> = {
  novo: "border-ink-faint bg-transparent",
  aprendendo: "border-accent bg-accent-soft",
  revisar: "border-danger bg-danger",
  dominado: "border-ink bg-ink",
};

const STATUS_LABELS: Record<CardStatus, string> = {
  novo: "nova",
  aprendendo: "aprendendo",
  revisar: "revisar",
  dominado: "dominada",
};

function Toggle({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="border-line flex min-h-11 w-full items-center justify-between gap-3 border-b py-2 text-left text-sm last:border-b-0"
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          pressed ? "bg-primary" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
            pressed ? "left-[1.125rem]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

function Ring({ percent, size = 56 }: { percent: number; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-line" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dasharray] duration-500"
          strokeDasharray={`${(c * percent) / 100} ${c}`}
        />
      </svg>
      <span className="font-display absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums">
        {percent}%
      </span>
    </div>
  );
}

export function FlashcardSession({
  deck,
  groupLabel,
  aside,
}: {
  deck: FlashDeck;
  /** Nome da área ou matéria, para o painel de desempenho. */
  groupLabel: string;
  /** Algo a mais na coluna lateral (copiar o baralho, editar…). */
  aside?: ReactNode;
}) {
  const [states, setStates] = useState<Record<string, CardReview> | null>(null);
  const [options, setOptions] = useState<Options>({
    shuffle: false,
    onlyPending: false,
    onlyImages: false,
  });
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [zoom, setZoom] = useState<DeckImage | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const tally = useRef({ correct: 0, total: 0, started: Date.now(), recorded: false });

  const cards = useMemo(() => new Map(deck.cards.map((card) => [card.id, card])), [deck.cards]);
  const images = useMemo(() => new Map(deck.images.map((image) => [image.id, image])), [deck.images]);
  const hasImages = deck.cards.some((card) => card.kind !== "texto");

  const rebuild = useCallback(
    (nextOptions: Options, nextStates: Record<string, CardReview>) => {
      const ids = deck.cards
        .filter((card) => !nextOptions.onlyImages || card.kind !== "texto")
        .map((card) => card.id);
      setQueue(
        buildQueue(ids, nextStates, new Date(), {
          shuffle: nextOptions.shuffle,
          onlyPending: nextOptions.onlyPending,
        }),
      );
      setIndex(0);
      setFlipped(false);
      tally.current = { correct: 0, total: 0, started: Date.now(), recorded: false };
    },
    [deck.cards],
  );

  // O progresso e as preferências moram no aparelho: só no cliente.
  useEffect(() => {
    const loaded = loadReviews(deck.id);
    const opts = readOptions();
    setStates(loaded);
    setOptions(opts);
    rebuild(opts, loaded);
  }, [deck.id, rebuild]);

  const changeOption = (key: keyof Options) => {
    const next = { ...options, [key]: !options[key] };
    setOptions(next);
    writeOptions(next);
    rebuild(next, states ?? {});
  };

  const currentId = queue[index];
  const current = currentId ? cards.get(currentId) : undefined;
  const finished = states !== null && index >= queue.length;

  const grade = useCallback(
    (g: Grade) => {
      if (!current || !currentId) return;
      const next = gradeCard(deck.id, current.id, g);
      setStates((s) => ({ ...s, [current.id]: next }));
      recordAnswer({
        mode: "flashcards",
        ref: `${deck.id}#${current.id}`,
        ok: g === "sei",
        group: deck.areaId ?? deck.disciplineId,
        groupLabel,
        ...(current.kind === "texto" && current.axisId ? { axis: current.axisId } : {}),
      });
      tally.current.total++;
      if (g === "sei") tally.current.correct++;
      setQueue((q) => requeue(q, index, g));
      setIndex((i) => i + 1);
      setFlipped(false);
    },
    [current, currentId, deck.id, deck.areaId, deck.disciplineId, groupLabel, index],
  );

  const go = useCallback(
    (delta: number) => {
      if (queue.length === 0) return;
      setIndex((i) => Math.max(0, Math.min(queue.length - 1, i + delta)));
      setFlipped(false);
    },
    [queue.length],
  );

  // Fecha a sessão no diário uma vez, quando a fila acaba.
  useEffect(() => {
    if (!finished || tally.current.recorded || tally.current.total === 0) return;
    tally.current.recorded = true;
    recordSession({
      mode: "flashcards",
      title: deck.title,
      correct: tally.current.correct,
      total: tally.current.total,
      seconds: Math.round((Date.now() - tally.current.started) / 1000),
    });
  }, [finished, deck.title]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (zoom) {
        if (event.key === "Escape") setZoom(null);
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        setFlipped((f) => !f);
      } else if (event.key === "1") grade("errei");
      else if (event.key === "2") grade("quase");
      else if (event.key === "3") grade("sei");
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [grade, go, zoom]);

  if (states === null) {
    return <p className="text-ink-muted py-16 text-center text-sm">Carregando…</p>;
  }

  const now = new Date();
  const counts = countDeck(
    deck.cards.map((c) => c.id),
    states,
    now,
  );
  const masteredPercent = counts.total ? Math.round((counts.dominados / counts.total) * 100) : 0;

  const jumpTo = (cardId: string) => {
    const at = queue.indexOf(cardId);
    if (at >= 0 && at >= index) {
      setIndex(at);
    } else {
      // Fora da fila atual (ou já passou): abre a fila completa a partir dele.
      const all = deck.cards.map((c) => c.id);
      const start = all.indexOf(cardId);
      setQueue([...all.slice(start), ...all.slice(0, start)]);
      setIndex(0);
    }
    setFlipped(false);
  };

  const restart = (onlyPending: boolean) => {
    const next = { ...options, onlyPending };
    setOptions(next);
    writeOptions(next);
    rebuild(next, states);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="bg-line h-1 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-[width] duration-300"
              style={{ width: `${queue.length ? (Math.min(index, queue.length) / queue.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-ink-muted font-display text-lg tabular-nums">
            {queue.length ? `${String(Math.min(index + 1, queue.length)).padStart(2, "0")} / ${String(queue.length).padStart(2, "0")}` : ""}
          </span>
        </div>

        {finished || !current ? (
          <div className="glass rounded-hero flex min-h-[26rem] flex-col items-center justify-center gap-4 p-8 text-center">
            <Ring percent={masteredPercent} size={96} />
            <h2 className="text-3xl">{queue.length ? "Sessão concluída" : "Nada pendente agora"}</h2>
            <p className="text-ink-muted max-w-md text-sm leading-relaxed text-pretty">
              {queue.length
                ? `${tally.current.correct} de ${tally.current.total} respostas marcadas como "sei". ${counts.dominados} de ${counts.total} cartões dominados neste baralho.`
                : "Nenhum cartão venceu e não há novos. Volte amanhã, ou passe o baralho inteiro."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={() => restart(false)}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Passar o baralho inteiro
              </Button>
              {counts.revisar + counts.novos > 0 ? (
                <Button type="button" variant="secundario" onClick={() => restart(true)}>
                  Só os pendentes ({counts.revisar + counts.novos})
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <CardView
            key={`${current.id}-${index}`}
            card={current}
            deck={deck}
            images={images}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            onZoom={setZoom}
            position={index + 1}
          />
        )}

        {!finished && current ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-[3rem_1fr_1fr_1.3fr_3rem]">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Cartão anterior"
              className="glass hover:glass-strong hidden min-h-12 items-center justify-center rounded-full sm:flex"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <GradeButton tone="errei" onClick={() => grade("errei")} shortcut="1">
              Errei
            </GradeButton>
            <GradeButton tone="quase" onClick={() => grade("quase")} shortcut="2">
              Quase
            </GradeButton>
            <GradeButton tone="sei" onClick={() => grade("sei")} shortcut="3">
              Sei
            </GradeButton>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Próximo cartão"
              className="glass hover:glass-strong hidden min-h-12 items-center justify-center rounded-full sm:flex"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <aside className="space-y-3">
        <section className="glass rounded-panel flex items-center gap-4 p-4">
          <Ring percent={masteredPercent} />
          <dl className="grid flex-1 grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-ink-faint text-[0.6rem] font-semibold tracking-[0.14em] uppercase">
                Dominados
              </dt>
              <dd className="font-display text-xl tabular-nums">{counts.dominados}</dd>
            </div>
            <div>
              <dt className="text-ink-faint text-[0.6rem] font-semibold tracking-[0.14em] uppercase">
                Revisar
              </dt>
              <dd className="font-display text-danger text-xl tabular-nums">{counts.revisar}</dd>
            </div>
            <div>
              <dt className="text-ink-faint text-[0.6rem] font-semibold tracking-[0.14em] uppercase">
                Novos
              </dt>
              <dd className="font-display text-xl tabular-nums">{counts.novos}</dd>
            </div>
          </dl>
        </section>

        <section className="glass rounded-panel p-4">
          <h2 className="text-ink-faint mb-1 text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
            Modo de estudo
          </h2>
          <Toggle pressed={options.shuffle} onClick={() => changeOption("shuffle")}>
            <span className="inline-flex items-center gap-2">
              <Shuffle className="size-3.5" aria-hidden="true" />
              Embaralhar
            </span>
          </Toggle>
          <Toggle pressed={options.onlyPending} onClick={() => changeOption("onlyPending")}>
            Só pendentes
          </Toggle>
          {hasImages ? (
            <Toggle pressed={options.onlyImages} onClick={() => changeOption("onlyImages")}>
              Só cartões com figura
            </Toggle>
          ) : null}
        </section>

        <section className="glass rounded-panel p-4">
          <h2 className="text-ink-faint mb-3 flex justify-between text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
            <span>Mapa dos cartões</span>
            <span className="tabular-nums">{deck.cards.length}</span>
          </h2>
          <ul className="flex max-h-56 flex-wrap gap-1.5 overflow-auto p-0.5">
            {deck.cards.map((card, i) => {
              const status = cardStatus(states[card.id], now);
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(card.id)}
                    aria-label={`Cartão ${i + 1}: ${STATUS_LABELS[status]}`}
                    title={`Cartão ${i + 1}: ${STATUS_LABELS[status]}`}
                    className={cn(
                      "block size-3.5 rounded-[4px] border-[1.5px] transition-transform hover:scale-125",
                      STATUS_STYLES[status],
                      card.id === currentId && "outline-primary outline-2 outline-offset-2",
                    )}
                  />
                </li>
              );
            })}
          </ul>
          <ul className="text-ink-muted mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {(["novo", "aprendendo", "revisar", "dominado"] as const).map((status) => (
              <li key={status} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn("size-2.5 rounded-[3px] border-[1.5px]", STATUS_STYLES[status])}
                />
                {STATUS_LABELS[status]}
              </li>
            ))}
          </ul>
        </section>

        {aside}

        <section className="glass rounded-panel hidden p-4 sm:block">
          <h2 className="text-ink-faint mb-3 text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
            Atalhos
          </h2>
          <dl className="text-ink-muted grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-sm">
            <dt>
              <kbd className="border-line rounded border px-1.5 text-xs">Espaço</kbd>
            </dt>
            <dd>virar o cartão</dd>
            <dt>
              <kbd className="border-line rounded border px-1.5 text-xs">1 · 2 · 3</kbd>
            </dt>
            <dd>errei, quase, sei</dd>
            <dt>
              <kbd className="border-line rounded border px-1.5 text-xs">← →</kbd>
            </dt>
            <dd>navegar</dd>
          </dl>
          {confirmReset ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span>Apagar o progresso deste baralho?</span>
              <Button
                type="button"
                size="sm"
                variant="perigo"
                onClick={() => {
                  resetDeckProgress(deck.id);
                  setStates({});
                  setConfirmReset(false);
                  rebuild(options, {});
                }}
              >
                Apagar
              </Button>
              <Button type="button" size="sm" variant="fantasma" onClick={() => setConfirmReset(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-ink-faint hover:text-ink mt-4 text-xs underline"
            >
              Zerar o progresso deste baralho
            </button>
          )}
        </section>
      </aside>

      <FigureLightbox
        image={zoom}
        box={current?.kind === "oclusao" ? current.box : undefined}
        revealed={flipped}
        onClose={() => setZoom(null)}
      />
    </div>
  );
}

function GradeButton({
  tone,
  onClick,
  shortcut,
  children,
}: {
  tone: Grade;
  onClick: () => void;
  shortcut: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors",
        tone === "errei" && "border-danger text-danger hover:bg-danger border hover:text-white",
        tone === "quase" && "glass hover:glass-strong text-ink",
        tone === "sei" && "bg-ink text-canvas hover:bg-primary hover:text-on-primary",
      )}
    >
      {children}
      <kbd className="hidden rounded border border-current px-1.5 text-[0.65rem] opacity-60 sm:inline">
        {shortcut}
      </kbd>
    </button>
  );
}

function CardView({
  card,
  deck,
  images,
  flipped,
  onFlip,
  onZoom,
  position,
}: {
  card: Flashcard;
  deck: FlashDeck;
  images: Map<string, DeckImage>;
  flipped: boolean;
  onFlip: () => void;
  onZoom: (image: DeckImage) => void;
  position: number;
}) {
  const color = deck.color ?? "var(--primary)";
  const image =
    card.kind === "texto" ? (card.imageId ? images.get(card.imageId) : undefined) : images.get(card.imageId);

  const meta = (label: string, side: string) => (
    <div className="flex items-center justify-between gap-3 text-[0.65rem] font-semibold tracking-[0.2em] uppercase opacity-80">
      <span className="truncate">{label}</span>
      <span>{side}</span>
    </div>
  );

  let front: ReactNode;
  let back: ReactNode;

  if (card.kind === "oclusao" && image) {
    front = (
      <div className="bg-surface border-line flex min-h-[28rem] flex-col gap-3 rounded-hero border p-5 sm:p-6">
        {meta("Image occlusion", image.caption ?? "")}
        <p className="text-ink-muted text-sm">Qual estrutura está marcada com “?”</p>
        <div className="flex flex-1 items-center justify-center">
          <CardFigure image={image} box={card.box} onZoom={onZoom} />
        </div>
      </div>
    );
    back = (
      <div className="bg-surface border-line flex min-h-[28rem] flex-col gap-3 rounded-hero border p-5 sm:p-6">
        {meta(`→ ${String(position).padStart(2, "0")}`, image.caption ?? "")}
        <div className="flex flex-1 flex-col items-center gap-5 md:flex-row">
          <div className="flex flex-1 justify-center">
            <CardFigure image={image} box={card.box} revealed onZoom={onZoom} />
          </div>
          <div className="md:w-2/5">
            <span className="text-danger text-[0.65rem] font-semibold tracking-[0.2em] uppercase">
              Estrutura
            </span>
            <p className="font-display mt-2 text-3xl leading-tight sm:text-4xl">{card.answer}</p>
          </div>
        </div>
      </div>
    );
  } else if (card.kind === "foto" && image) {
    front = (
      <div className="bg-surface border-line flex min-h-[28rem] flex-col gap-3 rounded-hero border p-5 sm:p-6">
        {meta(deck.title, "Foto")}
        <p className="text-ink-muted text-sm">Qual é esta alteração? Diga o nome antes de virar.</p>
        <div className="flex flex-1 items-center justify-center">
          <CardFigure image={image} onZoom={onZoom} />
        </div>
      </div>
    );
    back = (
      <div className="bg-surface border-line flex min-h-[28rem] flex-col gap-3 rounded-hero border p-5 sm:p-6">
        {meta(`→ ${String(position).padStart(2, "0")}`, "Resposta")}
        <PhotoAnswer card={card} />
      </div>
    );
  } else {
    // Texto — ou um cartão de figura cuja imagem não veio, que cai no nome.
    const frontText = card.kind === "texto" ? card.front : "Figura indisponível neste aparelho.";
    const backText = card.kind === "texto" ? card.back : `**${card.answer}**`;
    const tip = card.kind === "texto" ? card.tip : undefined;
    const backImages =
      card.kind === "texto"
        ? (card.backImageIds ?? []).flatMap((id) => {
            const found = images.get(id);
            return found ? [found] : [];
          })
        : [];
    front = (
      <div
        className="relative flex min-h-[28rem] flex-col gap-4 overflow-hidden rounded-hero p-6 text-white sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 70%, #1e1b4b))`,
        }}
      >
        {meta(deck.title, String(position).padStart(2, "0"))}
        <div className="my-auto max-w-2xl">
          <RichText
            text={frontText}
            className={cn(
              "font-display leading-snug text-balance",
              frontText.length > 280 ? "text-lg sm:text-xl" : "text-2xl sm:text-4xl",
            )}
          />
          {image ? (
            <div className="mt-4">
              <CardFigure image={image} onZoom={onZoom} maxHeight="max-h-[34vh]" />
            </div>
          ) : null}
        </div>
        <p className="text-xs text-white/80">Toque no cartão para virar</p>
      </div>
    );
    back = (
      <div className="bg-surface border-line flex min-h-[28rem] flex-col gap-4 rounded-hero border p-6 shadow-[var(--shadow-lift)] sm:p-8">
        {meta(`→ ${String(position).padStart(2, "0")}`, "Resposta")}
        <RichText
          text={backText}
          className={cn(
            "font-display leading-snug [&_strong]:text-primary",
            backText.length > 400 ? "text-base sm:text-lg" : "text-xl sm:text-2xl",
          )}
        />
        {backImages.length > 0 ? (
          <div className={cn("grid gap-3", backImages.length > 1 && "sm:grid-cols-2")}>
            {backImages.map((figure) => (
              <figure key={figure.id} className="m-0">
                <CardFigure
                  image={figure}
                  onZoom={onZoom}
                  maxHeight={backImages.length > 1 ? "max-h-48" : "max-h-72"}
                />
                {figure.caption ? (
                  <figcaption className="text-ink-faint mt-1 text-center text-xs">
                    {figure.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        ) : null}
        {tip ? (
          <div className="bg-surface-sunken border-ink mt-auto rounded-card border-l-2 px-4 py-3 text-sm">
            <strong className="text-danger block text-[0.62rem] tracking-[0.18em] uppercase">
              {tip.label}
            </strong>
            <RichText text={tip.text} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flip-scene">
      <div
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Mostrar a pergunta" : "Mostrar a resposta"}
        aria-pressed={flipped}
        onClick={onFlip}
        onKeyDown={(event) => {
          if (event.key === "Enter") onFlip();
        }}
        className={cn("flip-card cursor-pointer", flipped && "is-flipped")}
      >
        <div className="flip-face flip-front">{front}</div>
        <div className="flip-face flip-back" aria-live="polite">
          {back}
        </div>
      </div>
    </div>
  );
}

export function PhotoAnswer({ card }: { card: Extract<Flashcard, { kind: "foto" }> }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <p className="font-display text-3xl leading-tight">{card.answer}</p>
      {card.note ? <p className="text-sage font-medium">Na foto: {card.note}</p> : null}
      {card.description ? <RichText text={card.description} /> : null}
      {card.howToSpot ? (
        <div className="bg-sage-soft rounded-card px-3 py-2">
          <strong className="text-sage block text-[0.62rem] tracking-[0.16em] uppercase">
            Como identificar
          </strong>
          <RichText text={card.howToSpot} />
        </div>
      ) : null}
      {card.association ? (
        <div className="bg-danger-soft rounded-card px-3 py-2">
          <strong className="text-danger block text-[0.62rem] tracking-[0.16em] uppercase">
            Associação clássica
          </strong>
          {card.association}
        </div>
      ) : null}
      {card.confuseWith?.length ? (
        <div className="bg-accent-soft rounded-card px-3 py-2">
          <strong className="text-accent block text-[0.62rem] tracking-[0.16em] uppercase">
            Não confunda com
          </strong>
          {card.confuseWith.join(" · ")}
        </div>
      ) : null}
    </div>
  );
}

