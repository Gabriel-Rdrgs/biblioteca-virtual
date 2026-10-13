"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import {
  axisBand,
  formatMark,
  isObjective,
  revisionOrder,
  scoreQuestion,
} from "@/lib/domain/exam-scoring";
import type { ExamAttempt, ExamResult, LoadedExam } from "@/lib/domain/exam-types";
import { optionLetters } from "@/lib/domain/exam-types";
import { cn } from "@/lib/utils";

/**
 * What the student sees after correcting.
 *
 * The score is the smallest part. The point is the axis map: which themes
 * came out weak, what to do about each, and the chance to reread exactly
 * the questions that went wrong — which is the work the printed sheet asks
 * them to do by hand.
 */

const bandStyles = {
  fraco: { bar: "bg-danger", chip: "bg-danger-soft text-danger", label: "revisar" },
  medio: { bar: "bg-accent", chip: "bg-accent-soft text-accent", label: "quase lá" },
  forte: { bar: "bg-sage", chip: "bg-sage-soft text-sage", label: "firme" },
} as const;

function Stat({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="font-display text-primary text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      {hint ? <p className="text-ink-faint mt-0.5 text-xs">{hint}</p> : null}
    </div>
  );
}

export function ExamResultView({
  loaded,
  attempt,
  result,
  onRetryWrong,
  onRestart,
}: {
  loaded: LoadedExam;
  attempt: ExamAttempt;
  result: ExamResult;
  onRetryWrong?: (ids: readonly string[]) => void;
  onRestart?: () => void;
}) {
  const [review, setReview] = useState<"erradas" | "todas" | null>("erradas");
  const order = revisionOrder(result);
  const weak = order.filter((axis) => axis.percent < 60);
  // Three is a plan; nine is the whole exam again, which helps nobody.
  const weakest = weak.slice(0, 3);
  const missed = [...result.wrongIds, ...result.blankIds];

  const shown = loaded.questions.filter(({ question }) => {
    if (!review) return false;
    if (review === "todas") return true;
    return missed.includes(question.id) || scoreQuestion(question, attempt) < question.points;
  });

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-semibold">Resultado</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            value={`${formatMark(result.objectiveEarned)}`}
            label="objetivas"
            hint={`de ${result.objectivePossible}`}
          />
          <Stat
            value={`${formatMark(result.discursiveEarned)}`}
            label="discursivas"
            hint={`de ${result.discursivePossible} · autoavaliação`}
          />
          <Stat
            value={`${formatMark(result.total)}`}
            label="total"
            hint={`de ${result.possible} pontos`}
          />
          <Stat
            value={formatMark(result.scaled)}
            label={`na escala ${formatMark(loaded.exam.scaleMax)}`}
            hint="como entraria no boletim"
          />
        </div>
      </section>

      {result.areas.length > 1 ? (
        <section>
          <h3 className="text-lg font-semibold">Por área</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {result.areas.map((area) => (
              <li key={area.area.id} className="glass rounded-2xl p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{area.area.label}</span>
                  <span className="text-ink-muted text-sm tabular-nums">
                    {formatMark(area.earned)} / {area.possible}
                  </span>
                </div>
                <div className="bg-surface-sunken mt-2 h-2 overflow-hidden rounded-full">
                  <div
                    className={bandStyles[axisBand(area.percent)].bar + " h-full rounded-full"}
                    style={{ width: `${Math.max(2, area.percent)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="text-lg font-semibold">Mapa por eixo</h3>
        <p className="text-ink-muted mt-1 text-sm">
          Some seus pontos por eixo para decidir o que revisar primeiro.
        </p>
        <ul className="mt-4 space-y-2">
          {order.map((axis) => {
            const band = bandStyles[axisBand(axis.percent)];
            return (
              <li key={axis.axis.id} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-medium">{axis.axis.label}</span>
                  <span className="flex items-center gap-2 text-sm tabular-nums">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", band.chip)}>
                      {band.label}
                    </span>
                    <span className="text-ink-muted">
                      {formatMark(axis.earned)} / {axis.possible} · {Math.round(axis.percent)}%
                    </span>
                  </span>
                </div>
                <div className="bg-surface-sunken mt-2 h-2 overflow-hidden rounded-full">
                  <div
                    className={cn("h-full rounded-full", band.bar)}
                    style={{ width: `${Math.max(2, axis.percent)}%` }}
                  />
                </div>
                {axis.percent < 80 && axis.axis.remedy ? (
                  <p className="text-ink-muted mt-2 text-sm leading-relaxed">{axis.axis.remedy}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {weakest.length > 0 ? (
        <section className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold">Comece por aqui</h3>
          <p className="text-ink-muted mt-1 text-sm leading-relaxed">
            {weak.length === 1
              ? "Um eixo ficou abaixo de 60%."
              : `${weak.length} eixos ficaram abaixo de 60%${
                  weak.length > weakest.length ? `; comece pelos ${weakest.length} piores` : ""
                }.`}{" "}
            Reveja o conteúdo e refaça só essas questões.
          </p>
          <ol className="mt-4 space-y-2">
            {weakest.map((axis, i) => (
              <li key={axis.axis.id} className="flex gap-3 text-sm">
                <span className="text-ink-faint font-display w-5 shrink-0 text-right">{i + 1}</span>
                <span>
                  <strong className="font-medium">{axis.axis.label}</strong>
                  {axis.axis.remedy ? (
                    <span className="text-ink-muted"> — {axis.axis.remedy}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            {onRetryWrong && missed.length > 0 ? (
              <button
                type="button"
                onClick={() => onRetryWrong(missed)}
                className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Refazer as {missed.length} que errei
              </button>
            ) : null}
            <Link
              href={`/disciplinas`}
              className="glass hover:glass-strong inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Ver os livros da matéria
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Revisão das questões</h3>
          <div className="flex gap-1.5">
            {(
              [
                ["erradas", `Só o que perdi (${shown.length || missed.length})`],
                ["todas", "Todas"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setReview(review === value ? null : value)}
                aria-pressed={review === value}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  review === value ? "bg-primary text-on-primary" : "glass hover:glass-strong",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {review ? (
          <ol className="mt-4 space-y-4">
            {shown.map(({ number, question }) => {
              const earned = scoreQuestion(question, attempt);
              const right = earned === question.points;
              return (
                <li key={question.id} className="glass rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-semibold">{number}</span>
                    <span className="text-ink-faint text-xs">{question.topic}</span>
                    <span
                      className={cn(
                        "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                        right ? "bg-sage-soft text-sage" : "bg-danger-soft text-danger",
                      )}
                    >
                      {formatMark(earned)} / {formatMark(question.points)}
                    </span>
                  </div>

                  {isObjective(question) ? (
                    <>
                      <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                        {question.command}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {optionLetters.map((letter) => {
                          const chosen = attempt.choices[question.id] === letter;
                          const correct = question.answer === letter;
                          if (!chosen && !correct) return null;
                          return (
                            <li
                              key={letter}
                              className={cn(
                                "flex gap-2 rounded-xl px-3 py-2 text-sm",
                                correct ? "bg-sage-soft" : "bg-danger-soft",
                              )}
                            >
                              {correct ? (
                                <Check
                                  className="text-sage mt-0.5 size-4 shrink-0"
                                  aria-hidden="true"
                                />
                              ) : (
                                <X
                                  className="text-danger mt-0.5 size-4 shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                              <span>
                                <strong className="font-semibold uppercase">{letter})</strong>{" "}
                                {question.options[letter]}
                                {chosen ? (
                                  <em className="text-ink-faint not-italic"> — sua resposta</em>
                                ) : null}
                              </span>
                            </li>
                          );
                        })}
                        {!attempt.choices[question.id] ? (
                          <li className="text-ink-faint text-sm">Você deixou em branco.</li>
                        ) : null}
                      </ul>
                      <p className="border-line/60 text-ink-muted mt-3 border-t pt-3 text-sm leading-relaxed">
                        {question.explanation}
                      </p>
                    </>
                  ) : (
                    <ul className="mt-2 space-y-3">
                      {question.items.map((item) => (
                        <li key={item.label}>
                          <p className="text-sm font-medium">
                            <span className="font-display">{item.label})</span> {item.prompt}
                          </p>
                          <ul className="text-ink-muted mt-1.5 space-y-1 text-sm">
                            {item.expected.map((line, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-ink-faint">·</span>
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        ) : null}
      </section>

      {onRestart ? (
        <div className="border-line/60 border-t pt-6">
          <button
            type="button"
            onClick={onRestart}
            className="glass hover:glass-strong inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Refazer do zero
          </button>
        </div>
      ) : null}
    </div>
  );
}
