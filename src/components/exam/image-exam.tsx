"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, RotateCcw, Timer } from "lucide-react";
import type { DeckImage, OcclusionCard, PhotoCard } from "@/lib/domain/flashcard-types";
import { recordAnswer, recordSession } from "@/lib/study-log";
import { cn } from "@/lib/utils";
import { Button, ButtonLink, Select, ToggleChip } from "@/components/ui/primitives";
import { CardFigure, FigureLightbox } from "@/components/flashcards/card-figure";
import { PhotoAnswer } from "@/components/flashcards/flashcard-session";

/**
 * O simulado de imagem — o formato da TV da prova prática.
 *
 * Uma figura por vez, sem legenda, com o relógio correndo. A pessoa escreve
 * o nome no papel, revela, e diz se acertou: a máquina não corrige porque
 * "fácies cushingoide" e "de lua cheia" são a mesma resposta, e nenhuma
 * comparação de texto sabe disso. O que conta é a honestidade, como na
 * autoavaliação das discursivas.
 */

export interface ImageDeck {
  readonly id: string;
  readonly disciplineId?: string;
  readonly title: string;
  readonly collection: string;
  readonly color?: string;
  readonly cards: readonly (OcclusionCard | PhotoCard)[];
  readonly images: readonly DeckImage[];
}

interface Item {
  readonly key: string;
  readonly deck: ImageDeck;
  readonly card: OcclusionCard | PhotoCard;
  readonly image: DeckImage;
}

const MISSED_KEY = "atlas:imagem-erros:v1";

function readMissed(): string[] {
  try {
    const raw = window.localStorage.getItem(MISSED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeMissed(keys: readonly string[]): void {
  try {
    window.localStorage.setItem(MISSED_KEY, JSON.stringify(keys));
  } catch {
    // Sem armazenamento, "só as que errei" fica vazio; o resto funciona.
  }
}

function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

interface Run {
  readonly items: readonly Item[];
  readonly seconds: number;
  index: number;
  revealed: boolean;
  correct: number;
  missed: Item[];
  readonly started: number;
}

export function ImageExam({
  decks,
  initialSelected,
}: {
  decks: readonly ImageDeck[];
  /** Baralhos já marcados — a página da prova manda os da matéria dela. */
  initialSelected?: readonly string[];
}) {
  const allItems = useMemo<Item[]>(
    () =>
      decks.flatMap((deck) => {
        const images = new Map(deck.images.map((i) => [i.id, i]));
        return deck.cards.flatMap((card) => {
          const image = images.get(card.imageId);
          return image ? [{ key: `${deck.id}#${card.id}`, deck, card, image }] : [];
        });
      }),
    [decks],
  );

  const collections = useMemo(() => [...new Set(decks.map((d) => d.collection))], [decks]);
  const [selected, setSelected] = useState<string[]>(() =>
    initialSelected && initialSelected.length > 0
      ? [...initialSelected]
      : decks.filter((d) => d.collection === collections[0]).map((d) => d.id),
  );
  const [perPhoto, setPerPhoto] = useState(30);
  const [amount, setAmount] = useState(20);
  const [missedKeys, setMissedKeys] = useState<string[]>([]);
  const [run, setRun] = useState<Run | null>(null);
  const [left, setLeft] = useState(0);
  const [zoom, setZoom] = useState<DeckImage | null>(null);
  const recorded = useRef(false);

  useEffect(() => setMissedKeys(readMissed()), []);

  const pool = allItems.filter((item) => selected.includes(item.deck.id));
  const missedItems = allItems.filter((item) => missedKeys.includes(item.key));

  const start = (onlyMissed: boolean) => {
    const base = onlyMissed ? missedItems : pool;
    const items = shuffled(base).slice(0, onlyMissed || amount === 0 ? undefined : amount);
    if (items.length === 0) return;
    recorded.current = false;
    setRun({ items, seconds: perPhoto, index: 0, revealed: false, correct: 0, missed: [], started: Date.now() });
    setLeft(perPhoto);
    window.scrollTo({ top: 0 });
  };

  const current = run && run.index < run.items.length ? run.items[run.index] : undefined;
  const finished = Boolean(run && run.index >= run.items.length);

  // O relógio de cada figura; para ao revelar.
  useEffect(() => {
    if (!run || !current || run.revealed || run.seconds === 0) return;
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [run, current]);

  const reveal = useCallback(() => {
    setRun((r) => (r && !r.revealed && r.index < r.items.length ? { ...r, revealed: true } : r));
  }, []);

  const mark = useCallback(
    (ok: boolean) => {
      if (!run || !current || !run.revealed) return;
      recordAnswer({
        mode: "imagem",
        ref: current.key,
        ok,
        group: current.deck.collection,
        groupLabel: current.deck.collection,
        axis: current.deck.id,
        axisLabel: current.deck.title,
      });
      const keys = new Set(readMissed());
      if (ok) keys.delete(current.key);
      else keys.add(current.key);
      writeMissed([...keys]);
      setMissedKeys([...keys]);
      setRun({
        ...run,
        index: run.index + 1,
        revealed: false,
        correct: run.correct + (ok ? 1 : 0),
        missed: ok ? run.missed : [...run.missed, current],
      });
      setLeft(run.seconds);
    },
    [run, current],
  );

  useEffect(() => {
    if (!run || !finished || recorded.current) return;
    recorded.current = true;
    recordSession({
      mode: "imagem",
      title: [...new Set(run.items.map((i) => i.deck.collection))].join(", "),
      correct: run.correct,
      total: run.items.length,
      seconds: Math.round((Date.now() - run.started) / 1000),
    });
  }, [run, finished]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!run || !current) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (zoom) {
        if (event.key === "Escape") setZoom(null);
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        reveal();
      } else if (event.key === "1") mark(true);
      else if (event.key === "2") mark(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, current, reveal, mark, zoom]);

  /* ---------------- configuração ---------------- */
  if (!run) {
    return (
      <div className="glass rounded-hero space-y-6 p-5 sm:p-6">
        {collections.map((collection) => (
          <fieldset key={collection}>
            <legend className="text-sm font-semibold">{collection}</legend>
            <ul className="mt-2 flex flex-wrap gap-2">
              {decks
                .filter((d) => d.collection === collection)
                .map((deck) => (
                  <li key={deck.id}>
                    <ToggleChip
                      pressed={selected.includes(deck.id)}
                      onClick={() =>
                        setSelected((s) =>
                          s.includes(deck.id) ? s.filter((x) => x !== deck.id) : [...s, deck.id],
                        )
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="inline-block size-2.5 rounded-full"
                        style={{ background: deck.color ?? "currentColor" }}
                      />
                      {deck.title}
                      <span className="opacity-70 tabular-nums">{deck.cards.length}</span>
                    </ToggleChip>
                  </li>
                ))}
            </ul>
          </fieldset>
        ))}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold">Tempo por figura</span>
            <Select value={perPhoto} onChange={(e) => setPerPhoto(Number(e.target.value))} className="mt-1.5">
              <option value={0}>Sem limite</option>
              <option value={20}>20 segundos</option>
              <option value={30}>30 segundos</option>
              <option value={45}>45 segundos</option>
              <option value={60}>1 minuto</option>
            </Select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Quantidade</span>
            <Select value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-1.5">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={0}>Todas ({pool.length})</option>
            </Select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="lg" onClick={() => start(false)} disabled={pool.length === 0}>
            Começar simulado
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secundario"
            onClick={() => start(true)}
            disabled={missedItems.length === 0}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Só as que errei ({missedItems.length})
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------- resultado ---------------- */
  if (finished || !current) {
    const n = run.items.length;
    const missedNames = [...new Map(run.missed.map((m) => [m.card.answer, m])).values()];
    return (
      <div className="glass rounded-hero space-y-5 p-8 text-center">
        <p className="text-ink-faint text-xs font-semibold tracking-[0.18em] uppercase">Resultado</p>
        <p className="font-display text-primary text-6xl tabular-nums">
          {run.correct}/{n}
        </p>
        <p className="text-ink-muted">{Math.round((run.correct / n) * 100)}% de acerto</p>
        {missedNames.length > 0 ? (
          <div>
            <p className="text-ink-faint text-xs font-semibold tracking-[0.18em] uppercase">
              Revisar
            </p>
            <ul className="mt-2 flex flex-wrap justify-center gap-2">
              {missedNames.map((m) => (
                <li
                  key={m.key}
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ background: m.deck.color ?? "var(--danger)" }}
                >
                  {m.card.answer}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Sem erros. Excelente!</p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => setRun(null)}>
            Novo simulado
          </Button>
          {run.missed.length > 0 ? (
            <Button type="button" variant="secundario" onClick={() => start(true)}>
              Refazer as erradas
            </Button>
          ) : null}
          <ButtonLink href="/progresso" variant="fantasma">
            Ver desempenho
          </ButtonLink>
        </div>
      </div>
    );
  }

  /* ---------------- figura ---------------- */
  const n = run.items.length;
  const timeUp = run.seconds > 0 && left === 0;

  return (
    <div className="space-y-4">
      <div className="bg-line h-1.5 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full transition-[width] duration-300"
          style={{ width: `${(run.index / n) * 100}%` }}
        />
      </div>

      <div className="glass rounded-hero p-4 sm:p-5">
        <div className="text-ink-muted mb-3 flex items-center justify-between text-xs font-semibold tracking-[0.12em] uppercase">
          <span>
            Questão {run.index + 1} / {n}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 tabular-nums",
              run.seconds > 0 && left <= 5 && !run.revealed && "text-danger",
            )}
            aria-live="off"
          >
            <Timer className="size-3.5" aria-hidden="true" />
            {run.seconds === 0 ? "—" : timeUp ? "Tempo!" : `${left} s`}
          </span>
        </div>
        <div className="flex justify-center">
          <CardFigure
            image={current.image}
            {...(current.card.kind === "oclusao" ? { box: current.card.box } : {})}
            revealed={run.revealed}
            onZoom={setZoom}
            maxHeight="max-h-[60vh]"
          />
        </div>
        {current.card.kind === "oclusao" && !run.revealed ? (
          <p className="text-ink-muted mt-3 text-center text-sm">Qual estrutura está marcada com “?”</p>
        ) : null}
      </div>

      {run.revealed ? (
        <div className="glass rounded-hero space-y-4 p-5 sm:p-6" role="status">
          {current.card.kind === "foto" ? (
            <PhotoAnswer card={current.card} />
          ) : (
            <div>
              <p className="text-danger text-xs font-semibold tracking-[0.18em] uppercase">
                Estrutura
              </p>
              <p className="font-display mt-1 text-3xl leading-tight">{current.card.answer}</p>
              <p className="text-ink-faint mt-1 text-xs">
                {current.deck.title} · {current.image.caption}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 sm:max-w-md">
            <Button type="button" size="lg" onClick={() => mark(true)} className="bg-sage hover:bg-sage text-white">
              Acertei <kbd className="text-xs opacity-70">1</kbd>
            </Button>
            <Button type="button" size="lg" variant="perigo" onClick={() => mark(false)}>
              Errei <kbd className="text-xs opacity-70">2</kbd>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button type="button" size="lg" onClick={reveal}>
            <Eye className="size-4" aria-hidden="true" />
            Revelar resposta
            <kbd className="hidden text-xs opacity-70 sm:inline">espaço</kbd>
          </Button>
          <p className="text-ink-faint text-xs">Escreva o nome no papel antes de revelar.</p>
        </div>
      )}

      <FigureLightbox
        image={zoom}
        {...(current.card.kind === "oclusao" ? { box: current.card.box } : {})}
        revealed={run.revealed}
        onClose={() => setZoom(null)}
      />
    </div>
  );
}
