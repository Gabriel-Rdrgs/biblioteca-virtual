"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CornerDownLeft, RotateCcw, X } from "lucide-react";
import type {
  ExamFigure,
  ObjectiveQuestion,
  OptionLetter,
  QuestionArea,
} from "@/lib/domain/exam-types";
import { optionLetters } from "@/lib/domain/exam-types";
import { recordAnswer, recordSession, updateErrorQueue } from "@/lib/study-log";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/primitives";

/**
 * Modo rápido: uma objetiva por vez, corrigida na hora.
 *
 * O simulado completo segura o gabarito até o fim, como a prova real; aqui
 * é o contrário, porque o objetivo é aprender com o erro enquanto a dúvida
 * ainda está quente. A explicação aparece logo depois da resposta, e o que
 * se errou vai para a fila de erros.
 *
 * Teclado: 1–4 (ou A–D) marcam a alternativa, Enter segue.
 */

type Feedback = "entrou" | "continua" | "saiu" | null;

interface Answer {
  readonly choice: OptionLetter;
  readonly ok: boolean;
  readonly queue: Feedback;
}

export function QuickRunner({
  questions,
  areas,
  figures,
  title,
  fromQueue = false,
}: {
  questions: readonly ObjectiveQuestion[];
  areas: readonly QuestionArea[];
  figures: readonly ExamFigure[];
  title: string;
  fromQueue?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const started = useRef(Date.now());
  const recorded = useRef(false);

  const areaById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas]);
  const figureById = useMemo(() => new Map(figures.map((f) => [f.id, f])), [figures]);

  const finished = index >= questions.length;
  const question = questions[index];
  const answer = question ? answers[question.id] : undefined;

  const choose = useCallback(
    (letter: OptionLetter) => {
      if (!question || answers[question.id]) return;
      const ok = letter === question.answer;
      const area = areaById.get(question.areaId);
      const axis = area?.axes.find((a) => a.id === question.axisId);
      recordAnswer({
        mode: "rapido",
        ref: question.id,
        ok,
        group: question.areaId,
        groupLabel: area?.label ?? question.areaId,
        axis: question.axisId,
        axisLabel: axis?.label ?? question.axisId,
      });
      const queue = updateErrorQueue(question, ok);
      setAnswers((a) => ({ ...a, [question.id]: { choice: letter, ok, queue } }));
    },
    [question, answers, areaById],
  );

  const next = useCallback(() => {
    if (!question || !answers[question.id]) return;
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [question, answers]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const key = event.key.toLowerCase();
      const byNumber = ["1", "2", "3", "4"].indexOf(key);
      const byLetter = (optionLetters as readonly string[]).indexOf(key);
      const pick = byNumber >= 0 ? byNumber : byLetter;
      if (pick >= 0 && optionLetters[pick]) {
        choose(optionLetters[pick]!);
      } else if (event.key === "Enter" && !(target && /^(BUTTON|A)$/.test(target.tagName))) {
        // Em botão ou link o Enter já clica sozinho; aqui seria a segunda vez.
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, next]);

  const results = questions.map((q) => ({ q, a: answers[q.id] }));
  const correct = results.filter((r) => r.a?.ok).length;
  const wrong = results.filter((r) => r.a && !r.a.ok).map((r) => r.q);

  useEffect(() => {
    if (!finished || recorded.current || questions.length === 0) return;
    recorded.current = true;
    recordSession({
      mode: "rapido",
      title,
      correct,
      total: questions.length,
      seconds: Math.round((Date.now() - started.current) / 1000),
    });
  }, [finished, correct, questions.length, title]);

  if (questions.length === 0) {
    return (
      <div className="glass rounded-hero p-8 text-center">
        <h2 className="text-xl font-semibold">Nenhuma questão para esse filtro</h2>
        <p className="text-ink-muted mt-2 text-sm">
          {fromQueue ? "Sua fila de erros está vazia. Bom sinal." : "Tente outras áreas ou eixos."}
        </p>
        <ButtonLink href="/estudar/rapido" className="mt-6">
          Montar outra rodada
        </ButtonLink>
      </div>
    );
  }

  if (finished) {
    const percent = Math.round((correct / questions.length) * 100);
    const byAxis = new Map<string, { label: string; ok: number; n: number }>();
    for (const { q, a } of results) {
      const label =
        areaById.get(q.areaId)?.axes.find((x) => x.id === q.axisId)?.label ?? q.topic;
      const entry = byAxis.get(q.axisId) ?? { label, ok: 0, n: 0 };
      entry.n++;
      if (a?.ok) entry.ok++;
      byAxis.set(q.axisId, entry);
    }
    return (
      <div className="space-y-6">
        <div className="glass rounded-hero p-8 text-center">
          <p className="text-ink-faint text-xs font-semibold tracking-[0.18em] uppercase">
            Resultado
          </p>
          <p className="font-display text-primary mt-2 text-6xl tabular-nums">
            {correct}/{questions.length}
          </p>
          <p className="text-ink-muted mt-1">{percent}% de acerto</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {wrong.length > 0 ? (
              <ButtonLink href={`/estudar/rapido?questoes=${wrong.map((q) => q.id).join(",")}`}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Refazer as {wrong.length} erradas
              </ButtonLink>
            ) : null}
            <ButtonLink href="/estudar/rapido" variant="secundario">
              Nova rodada
            </ButtonLink>
            <ButtonLink href="/progresso" variant="fantasma">
              Ver desempenho
            </ButtonLink>
          </div>
        </div>

        <section className="glass rounded-panel p-5">
          <h2 className="text-base font-semibold">Por assunto</h2>
          <ul className="mt-3 space-y-2">
            {[...byAxis.entries()]
              .sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n)
              .map(([id, entry]) => {
                const p = Math.round((entry.ok / entry.n) * 100);
                return (
                  <li key={id} className="grid grid-cols-[minmax(0,1fr)_6rem_3.5rem] items-center gap-3 text-sm">
                    <span className="truncate">{entry.label}</span>
                    <span className="bg-line h-2 overflow-hidden rounded-full">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          p >= 80 ? "bg-sage" : p >= 60 ? "bg-accent" : "bg-danger",
                        )}
                        style={{ width: `${p}%` }}
                      />
                    </span>
                    <span className="text-ink-muted text-right tabular-nums">
                      {entry.ok}/{entry.n}
                    </span>
                  </li>
                );
              })}
          </ul>
        </section>

        {wrong.length > 0 ? (
          <p className="text-ink-muted text-center text-sm">
            As erradas foram para a{" "}
            <Link href="/estudar/erros" className="text-primary font-medium hover:underline">
              fila de erros
            </Link>
            : saem quando você acertar duas vezes seguidas.
          </p>
        ) : null}
      </div>
    );
  }

  const q = question!;
  const figure = q.figureId ? figureById.get(q.figureId) : undefined;
  const area = areaById.get(q.areaId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-line h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-[width] duration-300"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-ink-muted text-sm tabular-nums">
          {index + 1} / {questions.length}
        </span>
        <span className="text-sage text-sm font-medium tabular-nums" aria-label="Acertos até agora">
          <Check className="inline size-3.5" aria-hidden="true" /> {correct}
        </span>
      </div>

      <article className="glass rounded-hero p-5 sm:p-7">
        <p className="text-ink-faint text-xs font-semibold tracking-[0.14em] uppercase">
          {area?.shortLabel ?? q.areaId} · {q.topic}
        </p>
        <p className="mt-3 leading-relaxed text-pretty">{q.stem}</p>
        {figure ? (
          <div className="mt-4">
            <Image
              src={`/api/simulados/${figure.path}`}
              alt={figure.caption}
              width={figure.width}
              height={figure.height}
              className="rounded-panel mx-auto h-auto w-full max-w-md"
              unoptimized
            />
            <p className="text-ink-faint mt-1 text-center text-xs">
              Figura {figure.number} · {figure.source}
            </p>
          </div>
        ) : null}
        {q.statements?.length ? (
          <ol className="mt-4 space-y-1.5 text-sm leading-relaxed">
            {q.statements.map((statement, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-ink-faint font-semibold">
                  {["I", "II", "III", "IV", "V", "VI"][i]}.
                </span>
                {statement}
              </li>
            ))}
          </ol>
        ) : null}
        <p className="mt-4 font-medium">{q.command}</p>

        <ul className="mt-4 grid gap-2.5">
          {optionLetters.map((letter, i) => {
            const isChoice = answer?.choice === letter;
            const isRight = letter === q.answer;
            return (
              <li key={letter}>
                <button
                  type="button"
                  onClick={() => choose(letter)}
                  disabled={Boolean(answer)}
                  className={cn(
                    "rounded-panel flex w-full items-start gap-3 border-2 px-4 py-3 text-left text-sm leading-relaxed transition-colors",
                    !answer && "border-line bg-surface hover:border-primary",
                    answer && isRight && "border-sage bg-sage-soft",
                    answer && isChoice && !isRight && "border-danger bg-danger-soft",
                    answer && !isChoice && !isRight && "border-line bg-surface opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold uppercase",
                      answer && isRight
                        ? "bg-sage text-white"
                        : answer && isChoice
                          ? "bg-danger text-white"
                          : "bg-primary-soft text-primary",
                    )}
                    aria-hidden="true"
                  >
                    {answer && isRight ? (
                      <Check className="size-4" />
                    ) : answer && isChoice ? (
                      <X className="size-4" />
                    ) : (
                      letter
                    )}
                  </span>
                  <span>
                    <span className="sr-only">
                      Alternativa {letter.toUpperCase()}
                      {answer && isRight ? ", correta" : answer && isChoice ? ", sua resposta" : ""}
                      :{" "}
                    </span>
                    {q.options[letter]}
                  </span>
                  <kbd className="text-ink-faint ml-auto hidden text-[0.65rem] sm:inline">
                    {i + 1}
                  </kbd>
                </button>
              </li>
            );
          })}
        </ul>

        {answer ? (
          <div
            role="status"
            className={cn(
              "rounded-panel mt-5 border p-4 text-sm leading-relaxed",
              answer.ok ? "border-sage/40 bg-sage-soft" : "border-danger/30 bg-danger-soft",
            )}
          >
            <p className={cn("font-semibold", answer.ok ? "text-sage" : "text-danger")}>
              {answer.ok ? "Certo." : `Errado — a resposta é a ${q.answer.toUpperCase()}.`}
              {answer.queue === "entrou" ? " Foi para a fila de erros." : null}
              {answer.queue === "saiu" ? " Saiu da fila de erros." : null}
              {answer.queue === "continua" && answer.ok
                ? " Mais um acerto e sai da fila de erros."
                : null}
            </p>
            <p className="text-ink mt-1.5">{q.explanation}</p>
          </div>
        ) : null}
      </article>

      <div className="flex justify-end">
        <Button type="button" onClick={next} disabled={!answer} size="lg">
          {index + 1 === questions.length ? "Ver resultado" : "Próxima"}
          {answer ? (
            <CornerDownLeft className="size-4 opacity-70" aria-hidden="true" />
          ) : (
            <ArrowRight className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
