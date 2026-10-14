"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Grid3x3, Timer } from "lucide-react";
import { formatMark, isObjective, scoreExam } from "@/lib/domain/exam-scoring";
import type { ExamResult, LoadedExam, OptionLetter, QuestionId } from "@/lib/domain/exam-types";
import { optionLetters } from "@/lib/domain/exam-types";
import {
  loadOpenAttempt,
  newAttempt,
  saveAttempt,
  withChoice,
  withNote,
  withSelfMark,
  type StoredAttempt,
  type StoredResult,
} from "@/lib/exam-storage";
import { cn } from "@/lib/utils";
import { ExamResultView } from "./exam-result";

/**
 * Takes a student through a simulado: one question at a time, the way the
 * printed sheet is worked through, with the answers kept on the device so
 * a closed tab never costs an afternoon of work.
 *
 * Correcting has two steps, because a written answer cannot be marked by a
 * machine: the objective questions are scored against the key, and then the
 * student compares what they wrote with the marking scheme and ticks what
 * is there. Honest self-assessment is the skill the real exam rewards.
 */

type Phase = "prova" | "autoavaliacao" | "resultado";

/**
 * Condenses a result into what the progress page needs, so that page can
 * read the history without the question bank or the answer key.
 */
function summarise(loaded: LoadedExam, result: ExamResult): StoredResult {
  return {
    total: result.total,
    possible: result.possible,
    scaled: result.scaled,
    scaleMax: loaded.exam.scaleMax,
    objectiveEarned: result.objectiveEarned,
    objectivePossible: result.objectivePossible,
    axes: result.axes.map((a) => ({
      id: a.axis.id,
      label: a.axis.label,
      earned: a.earned,
      possible: a.possible,
    })),
    areas: result.areas.map((a) => ({
      id: a.area.id,
      label: a.area.label,
      earned: a.earned,
      possible: a.possible,
    })),
  };
}

function useElapsed(attempt: StoredAttempt, running: boolean) {
  const [seconds, setSeconds] = useState(attempt.seconds ?? 0);
  const base = useRef({ at: Date.now(), from: attempt.seconds ?? 0 });

  useEffect(() => {
    base.current = { at: Date.now(), from: seconds };
    // Only restart the clock when the attempt itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt.startedAt]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds(base.current.from + Math.round((Date.now() - base.current.at) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  return seconds;
}

function clock(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function ExamRunner({ loaded }: { loaded: LoadedExam }) {
  const [attempt, setAttempt] = useState<StoredAttempt | null>(null);
  const [phase, setPhase] = useState<Phase>("prova");
  const [index, setIndex] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  // Resume whatever was left open on this device, or start fresh.
  useEffect(() => {
    const open = loadOpenAttempt(loaded.exam.id);
    setAttempt(
      open ??
        newAttempt(loaded.exam.id, {
          title: loaded.exam.title,
          disciplineId: loaded.exam.disciplineId,
          questionIds: loaded.exam.questionIds,
          href:
            loaded.exam.assessment === "treino"
              ? `/simulados/treino?materia=${loaded.exam.disciplineId}&questoes=${loaded.exam.questionIds.join(",")}`
              : `/simulados/${loaded.exam.slug}`,
        }),
    );
  }, [loaded.exam]);

  const seconds = useElapsed(
    attempt ?? newAttempt(loaded.exam.id),
    Boolean(attempt) && phase === "prova",
  );

  const update = useCallback((next: StoredAttempt) => {
    setAttempt(next);
    saveAttempt(next);
  }, []);

  const figures = useMemo(
    () => new Map(loaded.figures.map((figure) => [figure.id, figure])),
    [loaded.figures],
  );

  const result = useMemo(() => (attempt ? scoreExam(loaded, attempt) : null), [loaded, attempt]);

  if (!attempt) {
    return <p className="text-ink-muted py-16 text-center text-sm">Carregando…</p>;
  }

  const placed = loaded.questions[index];
  const answeredCount = loaded.questions.filter(({ question }) =>
    isObjective(question)
      ? Boolean(attempt.choices[question.id])
      : question.items.some((item) => (attempt.notes?.[question.id]?.[item.label] ?? "").trim()),
  ).length;

  const goTo = (next: number) => {
    setIndex(Math.max(0, Math.min(loaded.questions.length - 1, next)));
    setPaletteOpen(false);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const finish = () => {
    const hasDiscursive = loaded.questions.some((p) => p.question.kind === "discursiva");
    setPhase(hasDiscursive ? "autoavaliacao" : "resultado");
    if (!hasDiscursive && result) {
      update({
        ...attempt,
        finishedAt: new Date().toISOString(),
        seconds,
        result: summarise(loaded, result),
      });
    }
    top.current?.scrollIntoView({ block: "start" });
  };

  const discursivas = loaded.questions.filter((p) => p.question.kind === "discursiva");

  return (
    <div ref={top} className="scroll-mt-24">
      {/* ------------------------------------------------------- barra */}
      <div className="glass sticky top-20 z-30 mb-6 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{loaded.exam.title}</p>
          <p className="text-ink-faint text-xs tabular-nums">
            {phase === "prova"
              ? `${answeredCount} de ${loaded.questions.length} respondidas`
              : phase === "autoavaliacao"
                ? "Autoavaliação das discursivas"
                : `${formatMark(result?.total ?? 0)} de ${result?.possible ?? 0} pontos`}
          </p>
        </div>

        <span className="text-ink-muted inline-flex items-center gap-1.5 text-sm tabular-nums">
          <Timer className="size-4" aria-hidden="true" />
          {clock(seconds)}
        </span>

        {phase === "prova" ? (
          <>
            <button
              type="button"
              onClick={() => setPaletteOpen((open) => !open)}
              aria-expanded={paletteOpen}
              className="glass-strong hover:text-primary inline-flex size-9 items-center justify-center rounded-full transition-colors"
              aria-label="Ver todas as questões"
            >
              <Grid3x3 className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={finish}
              className="bg-primary text-on-primary hover:bg-primary-hover rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            >
              Corrigir
            </button>
          </>
        ) : null}
      </div>

      {paletteOpen && phase === "prova" ? (
        <div className="glass mb-6 rounded-2xl p-4">
          <p className="text-ink-muted mb-3 text-xs">
            Discursivas 1–{discursivas.length}, objetivas a seguir. Verde: respondida.
          </p>
          <ul className="grid grid-cols-8 gap-1.5 sm:grid-cols-12 lg:grid-cols-15">
            {loaded.questions.map(({ number, question }, i) => {
              const done = isObjective(question)
                ? Boolean(attempt.choices[question.id])
                : question.items.some((item) =>
                    (attempt.notes?.[question.id]?.[item.label] ?? "").trim(),
                  );
              return (
                <li key={question.id}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={i === index ? "true" : undefined}
                    className={cn(
                      "w-full rounded-lg py-1.5 text-sm font-medium tabular-nums transition-colors",
                      i === index && "ring-primary ring-2",
                      done ? "bg-sage-soft text-sage" : "bg-surface-sunken text-ink-muted",
                    )}
                  >
                    {number}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* -------------------------------------------------------- prova */}
      {phase === "prova" && placed ? (
        <article className="glass rounded-3xl p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-primary text-2xl font-semibold">
              {placed.number}
            </span>
            <span className="text-ink-faint text-xs tracking-[0.1em] uppercase">
              {placed.question.topic}
            </span>
            <span className="text-ink-faint ml-auto text-xs">
              {placed.question.kind === "objetiva" ? "objetiva" : "discursiva"} ·{" "}
              {formatMark(placed.question.points)}{" "}
              {placed.question.points === 1 ? "ponto" : "pontos"}
            </span>
          </div>

          <p className="mt-4 leading-relaxed text-pretty">{placed.question.stem}</p>

          {placed.question.figureId && figures.get(placed.question.figureId) ? (
            <figure className="mt-5">
              <div className="bg-surface overflow-hidden rounded-2xl p-2">
                <Image
                  src={`/api/simulados/${figures.get(placed.question.figureId)!.path}`}
                  alt={figures.get(placed.question.figureId)!.caption}
                  width={figures.get(placed.question.figureId)!.width}
                  height={figures.get(placed.question.figureId)!.height}
                  className="mx-auto h-auto w-full max-w-md rounded-xl"
                  unoptimized
                />
              </div>
              <figcaption className="text-ink-faint mt-2 text-xs leading-relaxed">
                <strong className="text-ink-muted font-semibold">
                  Figura {figures.get(placed.question.figureId)!.number}
                </strong>{" "}
                {figures.get(placed.question.figureId)!.caption} ·{" "}
                {figures.get(placed.question.figureId)!.source}
              </figcaption>
            </figure>
          ) : null}

          {isObjective(placed.question) ? (
            <>
              {placed.question.statements ? (
                <ol className="bg-surface-sunken mt-5 space-y-2 rounded-2xl p-4">
                  {placed.question.statements.map((statement, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="font-display text-ink-faint shrink-0">
                        {["I", "II", "III", "IV", "V"][i]}
                      </span>
                      <span>{statement}</span>
                    </li>
                  ))}
                </ol>
              ) : null}

              <p className="mt-5 font-semibold">{placed.question.command}</p>

              <ul className="mt-3 space-y-2">
                {optionLetters.map((letter) => {
                  const chosen = attempt.choices[placed.question.id] === letter;
                  return (
                    <li key={letter}>
                      <button
                        type="button"
                        onClick={() =>
                          update(withChoice(attempt, placed.question.id, letter as OptionLetter))
                        }
                        aria-pressed={chosen}
                        className={cn(
                          "flex w-full gap-3 rounded-2xl px-4 py-3 text-left text-sm leading-relaxed transition-colors",
                          chosen
                            ? "bg-primary text-on-primary"
                            : "bg-surface-sunken hover:bg-surface",
                        )}
                      >
                        <span
                          className={cn(
                            "font-display grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold uppercase",
                            chosen ? "border-current" : "border-line-strong",
                          )}
                        >
                          {letter}
                        </span>
                        <span>
                          {(placed.question as { options: Record<string, string> }).options[letter]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="mt-5 space-y-5">
              <p className="text-sm font-semibold">Com base no caso, responda aos itens:</p>
              {placed.question.items.map((item) => (
                <div key={item.label}>
                  <label
                    htmlFor={`${placed.question.id}-${item.label}`}
                    className="block text-sm leading-relaxed"
                  >
                    <span className="font-display text-primary font-semibold">{item.label})</span>{" "}
                    <span className="text-ink-faint text-xs">({formatMark(item.points)})</span>{" "}
                    {item.prompt}
                  </label>
                  <textarea
                    id={`${placed.question.id}-${item.label}`}
                    rows={5}
                    value={attempt.notes?.[placed.question.id]?.[item.label] ?? ""}
                    onChange={(event) =>
                      update(withNote(attempt, placed.question.id, item.label, event.target.value))
                    }
                    placeholder="Escreva aqui. Na prova o espaço é curto: diga o essencial primeiro."
                    className="glass-strong placeholder:text-ink-faint focus:border-primary mt-2 w-full rounded-2xl border border-transparent px-4 py-3 text-sm leading-relaxed outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="border-line/60 mt-7 flex items-center justify-between gap-3 border-t pt-5">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="glass hover:glass-strong inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Anterior
            </button>
            <span className="text-ink-faint text-xs tabular-nums">
              {index + 1} / {loaded.questions.length}
            </span>
            {index === loaded.questions.length - 1 ? (
              <button
                type="button"
                onClick={finish}
                className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              >
                Corrigir
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                className="glass hover:glass-strong inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
              >
                Próxima
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </article>
      ) : null}

      {/* ----------------------------------------------- autoavaliação */}
      {phase === "autoavaliacao" ? (
        <div className="space-y-6">
          <div className="glass rounded-3xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Corrija suas discursivas</h2>
            <p className="text-ink-muted mt-2 text-sm leading-relaxed text-pretty">
              As objetivas já foram corrigidas. Agora compare o que você escreveu com o padrão de
              resposta e marque o que realmente está lá. Seja duro: a nota só serve se for honesta.
            </p>
          </div>

          {discursivas.map(({ number, question }) => {
            if (question.kind !== "discursiva") return null;
            return (
              <article key={question.id} className="glass rounded-3xl p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="font-display text-primary text-xl font-semibold">{number}</span>
                  <span className="text-ink-faint text-xs tracking-[0.1em] uppercase">
                    {question.topic}
                  </span>
                </div>

                {question.items.map((item) => {
                  const written = attempt.notes?.[question.id]?.[item.label] ?? "";
                  const ticked = attempt.selfMarks[question.id]?.[`${item.label}:ticks`] ?? 0;
                  const marks = attempt.selfMarks[question.id]?.[item.label] ?? 0;
                  return (
                    <div key={item.label} className="border-line/60 mt-5 border-t pt-5">
                      <p className="text-sm leading-relaxed">
                        <span className="font-display text-primary font-semibold">
                          {item.label})
                        </span>{" "}
                        {item.prompt}
                      </p>

                      <div className="bg-surface-sunken mt-3 rounded-2xl p-3">
                        <p className="text-ink-faint mb-1 text-xs font-medium">
                          O que você escreveu
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {written.trim() || (
                            <span className="text-ink-faint italic">Deixou em branco.</span>
                          )}
                        </p>
                      </div>

                      <p className="mt-4 text-xs font-medium tracking-[0.08em] uppercase">
                        Padrão de resposta — marque o que você disse
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {item.expected.map((line, i) => {
                          const id = `${question.id}-${item.label}-${i}`;
                          const checked = Boolean(
                            attempt.selfMarks[question.id]?.[`${item.label}:${i}`],
                          );
                          return (
                            <li key={i}>
                              <label
                                htmlFor={id}
                                className="hover:bg-surface-sunken flex cursor-pointer gap-3 rounded-xl p-2 text-sm leading-relaxed"
                              >
                                <input
                                  id={id}
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) => {
                                    const nextTicks = event.target.checked
                                      ? ticked + 1
                                      : ticked - 1;
                                    const share =
                                      (item.points * Math.max(0, nextTicks)) / item.expected.length;
                                    let next = withSelfMark(
                                      attempt,
                                      question.id,
                                      `${item.label}:${i}`,
                                      event.target.checked ? 1 : 0,
                                    );
                                    next = withSelfMark(
                                      next,
                                      question.id,
                                      `${item.label}:ticks`,
                                      Math.max(0, nextTicks),
                                    );
                                    next = withSelfMark(
                                      next,
                                      question.id,
                                      item.label,
                                      Math.round(share * 100) / 100,
                                    );
                                    update(next);
                                  }}
                                  className="accent-primary mt-0.5 size-4 shrink-0"
                                />
                                <span>{line}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="text-ink-muted mt-2 text-right text-sm tabular-nums">
                        {formatMark(marks)} / {formatMark(item.points)}
                      </p>
                    </div>
                  );
                })}
              </article>
            );
          })}

          <button
            type="button"
            onClick={() => {
              update({
                ...attempt,
                finishedAt: new Date().toISOString(),
                seconds,
                ...(result ? { result: summarise(loaded, result) } : {}),
              });
              setPhase("resultado");
              top.current?.scrollIntoView({ block: "start" });
            }}
            className="bg-primary text-on-primary hover:bg-primary-hover w-full rounded-full px-5 py-3 text-sm font-semibold transition-colors"
          >
            Ver o resultado
          </button>
        </div>
      ) : null}

      {/* ----------------------------------------------------- resultado */}
      {phase === "resultado" && result ? (
        <ExamResultView
          loaded={loaded}
          attempt={attempt}
          result={result}
          onRetryWrong={(ids: readonly QuestionId[]) => {
            const query = new URLSearchParams({
              materia: loaded.exam.disciplineId,
              questoes: ids.join(","),
            });
            window.location.href = `/simulados/treino?${query.toString()}`;
          }}
          onRestart={() => {
            const fresh = newAttempt(loaded.exam.id, {
              title: loaded.exam.title,
              disciplineId: loaded.exam.disciplineId,
              questionIds: loaded.exam.questionIds,
            });
            setAttempt(fresh);
            saveAttempt(fresh);
            setIndex(0);
            setPhase("prova");
          }}
        />
      ) : null}
    </div>
  );
}
