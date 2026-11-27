"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Clock, RotateCcw, X } from "lucide-react";
import {
  AREA_LABELS,
  buildExam,
  scoreByTopic,
  shuffled,
  timings,
  weakTopics,
  type ExamAnswer,
  type PracticeData,
  type PracticeQuestion,
  type PracticeStation,
} from "@/lib/domain/practice";
import { RichText } from "@/components/flashcards/rich-text";
import {
  savePracticeRun,
  setPracticeFast,
  usePracticeState,
} from "@/lib/practice-storage";
import { recordAnswer, recordSession } from "@/lib/study-log";
import { cn } from "@/lib/utils";
import { PracticeFigure } from "./practice-figure";

/**
 * O simulado da prova prática, no formato da N2: dez estações, duas
 * questões cada. Em cada questão:
 *
 * 1. **Leitura** — a figura e a pergunta aparecem, mas não dá para responder;
 * 2. **Resposta** — o relógio recomeça e as alternativas destravam;
 * 3. **Gabarito** — certo ou errado, a explicação e a resposta-modelo.
 *
 * Na discursiva, a pessoa escreve, vê a resposta-modelo e marca se acertou.
 * Acabou o tempo sem confirmar, conta como erro — como na prova.
 */

type Phase = "read" | "answer" | "feedback";

interface Run {
  readonly exam: readonly PracticeStation[];
  readonly si: number;
  readonly qi: number;
  readonly phase: Phase;
  readonly endsAt: number;
  /** Ordem embaralhada das alternativas da questão atual. */
  readonly order: readonly number[];
  readonly selected: number | null;
  readonly text: string;
  readonly answers: readonly ExamAnswer[];
  readonly startedAt: number;
  readonly done: boolean;
}

const fmt = (s: number) => {
  const t = Math.max(0, Math.ceil(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

function questionOf(run: Run): { station: PracticeStation; question: PracticeQuestion } | null {
  const station = run.exam[run.si];
  const question = station?.questions[run.qi];
  return station && question ? { station, question } : null;
}

function orderFor(q: PracticeQuestion | undefined): number[] {
  return q?.type === "mc" ? shuffled(q.options.map((_, i) => i)) : [];
}

/** Só o que o simulado precisa: as estações, as figuras e o nome de cada tema. */
export type ExamData = Pick<PracticeData, "stations" | "figures"> & {
  readonly topics: readonly { readonly id: string; readonly title: string; readonly trap: string }[];
};

export function PracticeExam({ data }: { data: ExamData }) {
  const prefs = usePracticeState();
  const topicTitle = useMemo(() => new Map(data.topics.map((t) => [t.id, t.title])), [data.topics]);
  const topicTrap = useMemo(() => new Map(data.topics.map((t) => [t.id, t.trap])), [data.topics]);
  const [run, setRun] = useState<Run | null>(null);
  const runRef = useRef(run);
  runRef.current = run;
  const [now, setNow] = useState(() => Date.now());
  const savedRef = useRef(false);

  const { read, answer } = timings(prefs.fast);

  const commit = useCallback((next: Run | null) => {
    runRef.current = next;
    setRun(next);
  }, []);

  const start = () => {
    const exam = buildExam(data.stations);
    savedRef.current = false;
    commit({
      exam,
      si: 0,
      qi: 0,
      phase: "read",
      endsAt: Date.now() + read * 1000,
      order: orderFor(exam[0]?.questions[0]),
      selected: null,
      text: "",
      answers: [],
      startedAt: Date.now(),
      done: false,
    });
  };

  const record = useCallback(
    (station: PracticeStation, q: PracticeQuestion, ok: boolean) => {
      recordAnswer({
        mode: "pratica",
        ref: `pratica:${station.id}:${q.q}`,
        ok,
        group: station.area,
        groupLabel: `Prova prática · ${AREA_LABELS[station.area]}`,
        axis: `pratica:${station.topic}`,
        axisLabel: `Prova prática · ${topicTitle.get(station.topic) ?? station.topic}`,
      });
    },
    [topicTitle],
  );

  const submit = useCallback(() => {
    const r = runRef.current;
    if (!r || r.phase === "feedback") return;
    const cur = questionOf(r);
    if (!cur) return;
    const { station, question } = cur;
    const ok = question.type === "mc" ? r.selected === question.answer : null;
    if (ok !== null) record(station, question, ok);
    commit({
      ...r,
      phase: "feedback",
      answers: [
        ...r.answers,
        {
          stationId: station.id,
          topic: station.topic,
          area: station.area,
          q: question.q,
          answer: question.type === "mc" ? (question.options[question.answer] ?? "") : question.model,
          ok,
          figure: question.figure ?? station.figure,
        },
      ],
    });
  }, [commit, record]);

  const selfAssess = (ok: boolean) => {
    const r = runRef.current;
    const cur = r && questionOf(r);
    if (!r || !cur) return;
    record(cur.station, cur.question, ok);
    const answers = [...r.answers];
    const last = answers[answers.length - 1];
    if (last) answers[answers.length - 1] = { ...last, ok };
    commit({ ...r, answers });
  };

  const next = useCallback(() => {
    const r = runRef.current;
    if (!r || r.phase !== "feedback") return;
    const last = r.answers[r.answers.length - 1];
    if (last && last.ok === null) return; // falta a autoavaliação
    const atLastQuestion = r.qi + 1 >= (r.exam[r.si]?.questions.length ?? 0);
    const si = atLastQuestion ? r.si + 1 : r.si;
    const qi = atLastQuestion ? 0 : r.qi + 1;
    if (si >= r.exam.length) return commit({ ...r, done: true });
    commit({
      ...r,
      si,
      qi,
      phase: "read",
      endsAt: Date.now() + read * 1000,
      order: orderFor(r.exam[si]?.questions[qi]),
      selected: null,
      text: "",
    });
  }, [commit, read]);

  // O relógio: leitura vira resposta; resposta sem confirmar vira erro.
  useEffect(() => {
    if (!run || run.done || run.phase === "feedback") return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const r = runRef.current;
      if (!r || r.done || r.phase === "feedback" || t < r.endsAt) return;
      if (r.phase === "read") commit({ ...r, phase: "answer", endsAt: t + answer * 1000 });
      else submit();
    }, 250);
    return () => clearInterval(timer);
  }, [run, answer, commit, submit]);

  // Teclado: 1–4 escolhem, Enter confirma ou segue.
  useEffect(() => {
    if (!run || run.done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      const r = runRef.current;
      if (!r) return;
      if (r.phase === "answer" && /^[1-9]$/.test(e.key)) {
        const idx = r.order[Number(e.key) - 1];
        if (idx !== undefined) commit({ ...r, selected: idx });
      } else if (e.key === "Enter") {
        if (r.phase === "answer") submit();
        else if (r.phase === "feedback") next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, commit, submit, next]);

  // Terminou: guarda o histórico uma vez só.
  useEffect(() => {
    if (!run?.done || savedRef.current) return;
    savedRef.current = true;
    const graded = run.answers.map((a) => ({ ...a, ok: !!a.ok }));
    const correct = graded.filter((a) => a.ok).length;
    savePracticeRun(
      { at: Date.now(), correct, total: graded.length, fast: prefs.fast },
      graded.filter((a) => !a.ok).map((a) => a.topic),
    );
    recordSession({
      mode: "pratica",
      title: "Simulado da prova prática",
      correct,
      total: graded.length,
      seconds: Math.round((Date.now() - run.startedAt) / 1000),
    });
  }, [run, prefs.fast]);

  /* ------------------------------------------------------- início */
  if (!run) {
    return (
      <div className="space-y-5">
        <div className="glass rounded-2xl p-5">
          <ul className="text-ink-muted space-y-1.5 text-sm leading-relaxed">
            <li>
              <b className="text-ink">10 estações</b>, alternando Anatomia com Embriologia/Histologia, duas
              questões cada.
            </li>
            <li>
              Em cada questão, primeiro a <b className="text-ink">leitura</b> (não dá para responder), depois
              o tempo de <b className="text-ink">resposta</b>. Acabou o tempo, conta como erro.
            </li>
            <li>Depois de cada resposta, o gabarito comentado; no fim, o relatório por tema.</li>
          </ul>
          <label className="border-line mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-3">
            <input
              type="checkbox"
              checked={prefs.fast}
              onChange={(e) => setPracticeFast(e.target.checked)}
              className="mt-0.5 size-5 accent-[var(--primary)]"
            />
            <span className="text-sm">
              <b>Treino rápido</b> — 0:30 de leitura + 1:00 de resposta. Desligado, é o tempo real da
              prova: 1:30 + 1:30 por questão (cerca de 1 hora).
            </span>
          </label>
        </div>
        <button
          type="button"
          onClick={start}
          className="bg-primary text-on-primary inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 font-semibold sm:w-auto"
        >
          Começar o simulado <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  /* ------------------------------------------------------- relatório */
  if (run.done) {
    const graded = run.answers.map((a) => ({ ...a, ok: !!a.ok }));
    const correct = graded.filter((a) => a.ok).length;
    const pct = graded.length ? Math.round((correct / graded.length) * 100) : 0;
    const weak = weakTopics(graded);
    const frequent = Object.entries(prefs.errors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return (
      <div className="space-y-8">
        <section>
          <p className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">Relatório</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight">
            {correct}/{graded.length}
          </p>
          <p className="text-ink-muted mt-1 text-sm">questões certas ({pct}%)</p>
          <div className="bg-line mt-3 h-2 max-w-md overflow-hidden rounded-full">
            <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">Por tema</h2>
          <ul className="divide-line glass divide-y rounded-2xl">
            {scoreByTopic(graded).map((t) => (
              <li key={t.topic} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <Link href={`/estudar/pratica/tema/${t.topic}`} className="hover:text-primary min-w-0 truncate">
                  {topicTitle.get(t.topic) ?? t.topic}
                </Link>
                <span
                  className={cn(
                    "shrink-0 font-mono text-xs",
                    t.correct === t.total ? "text-emerald-600" : t.correct / t.total < 0.7 ? "text-danger" : "",
                  )}
                >
                  {t.correct}/{t.total}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">Erros deste simulado</h2>
          {graded.some((a) => !a.ok) ? (
            <ul className="space-y-3">
              {graded
                .filter((a) => !a.ok)
                .map((a, i) => {
                  const fig = data.figures[a.figure];
                  return (
                    <li key={`${a.stationId}-${i}`} className="glass flex gap-3 rounded-2xl p-3">
                      {fig ? (
                        // eslint-disable-next-line @next/next/no-img-element -- miniatura privada
                        <img
                          src={`/api/flashcards/figuras/${fig.file}`}
                          alt=""
                          className="h-20 w-16 shrink-0 rounded-lg bg-white object-contain"
                        />
                      ) : null}
                      <div className="min-w-0 text-sm">
                        <p className="font-medium">{topicTitle.get(a.topic)}</p>
                        <p className="text-ink-muted">{a.q}</p>
                        <p className="mt-1">
                          <span className="text-ink-faint">Gabarito: </span>
                          <RichText text={a.answer} className="inline [&>p]:inline" />
                        </p>
                        {topicTrap.get(a.topic) ? (
                          <p className="text-ink-faint mt-1 text-xs">
                            Pegadinha do tema: <RichText text={topicTrap.get(a.topic) ?? ""} className="inline [&>p]:inline" />
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="text-ink-muted text-sm">Nenhum erro. Excelente!</p>
          )}
        </section>

        {frequent.length ? (
          <section>
            <h2 className="mb-2 text-lg font-semibold">Seus erros mais frequentes</h2>
            <ul className="text-sm">
              {frequent.map(([topic, n]) => (
                <li key={topic}>
                  <b>{topicTitle.get(topic) ?? topic}</b> — {n} erro{n > 1 ? "s" : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 text-lg font-semibold">O que revisar</h2>
          {weak.length ? (
            <div className="flex flex-wrap gap-2">
              {weak.map((t) => (
                <Link
                  key={t}
                  href={`/estudar/pratica/tema/${t}`}
                  className="glass-strong inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium"
                >
                  Estudar: {topicTitle.get(t) ?? t}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-ink-muted text-sm">Nenhum tema abaixo de 70% neste simulado.</p>
          )}
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={start}
            className="bg-primary text-on-primary inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-semibold"
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Novo simulado
          </button>
          <Link href="/estudar/pratica" className="glass-strong inline-flex min-h-11 items-center rounded-full px-5 font-medium">
            Voltar à prova prática
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------- estação */
  const cur = questionOf(run);
  if (!cur) return null;
  const { station, question } = cur;
  const figure = data.figures[question.figure ?? station.figure];
  const total = run.phase === "read" ? read : answer;
  const left = (run.endsAt - now) / 1000;
  const last = run.answers[run.answers.length - 1];
  const isLastQuestion =
    run.si === run.exam.length - 1 && run.qi === station.questions.length - 1;

  return (
    <div className="space-y-4">
      {/* Cabeçalho e relógio: presos no topo no celular. */}
      <div className="bg-canvas/90 sticky top-[4.25rem] z-20 -mx-4 space-y-2 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <span className="bg-primary-soft text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
              {AREA_LABELS[station.area]}
            </span>
            <b>
              Estação {run.si + 1}/{run.exam.length} · Questão {run.qi + 1}/{station.questions.length}
            </b>
          </span>
          <span className="flex gap-1" aria-hidden="true">
            {run.exam.map((s, i) => (
              <i
                key={s.id}
                className={cn(
                  "h-1.5 w-4 rounded-full",
                  i < run.si ? "bg-ink" : i === run.si ? "bg-primary" : "bg-line",
                )}
              />
            ))}
          </span>
        </div>
        {run.phase !== "feedback" ? (
          <div
            className={cn(
              "border-line flex items-center gap-3 rounded-xl border px-3 py-2",
              run.phase === "answer" ? "bg-primary-soft" : "bg-surface",
            )}
            role="timer"
            aria-live="off"
          >
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            <span className="w-20 shrink-0 text-sm font-semibold">
              {run.phase === "read" ? "Leitura" : "Resposta"}
            </span>
            <span className="bg-line h-2 flex-1 overflow-hidden rounded-full">
              <span
                className={cn("block h-full rounded-full", run.phase === "read" ? "bg-ink" : "bg-primary")}
                style={{ width: `${Math.max(0, Math.min(100, (left / total) * 100))}%` }}
              />
            </span>
            <span className="w-12 shrink-0 text-right font-mono text-lg font-semibold tabular-nums">
              {fmt(left)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
        <div>
          {figure ? (
            <PracticeFigure
              figure={figure}
              src={`/api/flashcards/figuras/${figure.file}`}
              box={question.type === "mc" ? question.box : undefined}
              points={station.points}
              maxHeight="52vh"
            />
          ) : null}
          <p className="text-ink-muted mt-2 text-xs">{station.context}</p>
        </div>

        <div className={cn(run.phase === "read" && "opacity-70")}>
          <h2 className="text-lg font-semibold sm:text-xl">{question.q}</h2>

          {question.type === "mc" ? (
            <ul className="mt-3 space-y-2">
              {run.order.map((i, pos) => {
                const opt = question.options[i] ?? "";
                const fb = run.phase === "feedback";
                const right = fb && i === question.answer;
                const wrong = fb && i === run.selected && i !== question.answer;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      disabled={run.phase !== "answer"}
                      onClick={() => commit({ ...run, selected: i })}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-colors",
                        right
                          ? "border-emerald-500 bg-emerald-500/10"
                          : wrong
                            ? "border-danger bg-danger-soft"
                            : run.selected === i
                              ? "border-primary bg-primary-soft font-semibold"
                              : "border-line bg-surface",
                        run.phase === "answer" && "hover:border-primary",
                      )}
                    >
                      <span className="text-ink-faint w-4 shrink-0 font-mono text-xs">{pos + 1}</span>
                      <span className="min-w-0 flex-1">{opt}</span>
                      {right ? <Check className="size-4 shrink-0 text-emerald-600" aria-hidden="true" /> : null}
                      {wrong ? <X className="text-danger size-4 shrink-0" aria-hidden="true" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <textarea
              value={run.text}
              onChange={(e) => commit({ ...run, text: e.target.value })}
              disabled={run.phase !== "answer"}
              placeholder="Escreva sua resposta curta…"
              className="bg-surface border-line focus:border-primary mt-3 min-h-28 w-full rounded-xl border-2 p-3 text-base outline-none"
            />
          )}

          {run.phase === "read" ? (
            <p className="text-ink-muted mt-3 text-sm">Leia a figura e a pergunta. As respostas destravam no fim da leitura.</p>
          ) : null}
          {run.phase === "answer" ? (
            <button
              type="button"
              onClick={submit}
              className="bg-primary text-on-primary mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 font-semibold sm:w-auto"
            >
              Confirmar resposta
            </button>
          ) : null}

          {run.phase === "feedback" && last ? (
            <div
              className={cn(
                "mt-3 rounded-2xl border p-4 text-sm leading-relaxed",
                last.ok === null
                  ? "border-line bg-surface"
                  : last.ok
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-danger/40 bg-danger-soft",
              )}
              role="status"
            >
              {question.type === "mc" ? (
                <>
                  <p className="font-semibold">
                    {last.ok ? "Correto." : run.selected === null ? "Tempo esgotado." : "Incorreto."} Resposta:{" "}
                    {question.options[question.answer]}.
                  </p>
                  {question.why ? <RichText text={question.why} className="mt-1" /> : null}
                  {question.model ? (
                    <p className="mt-2">
                      <b>Resposta-modelo:</b> {question.model}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="font-semibold">Resposta-modelo</p>
                  <RichText text={question.model} className="mt-1" />
                  {last.ok === null ? (
                    <>
                      <p className="mt-3 font-medium">Compare com o que você escreveu:</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => selfAssess(true)}
                          className="min-h-11 rounded-full border-2 border-emerald-500 font-semibold text-emerald-700 dark:text-emerald-300"
                        >
                          Acertei
                        </button>
                        <button
                          type="button"
                          onClick={() => selfAssess(false)}
                          className="border-danger text-danger min-h-11 rounded-full border-2 font-semibold"
                        >
                          Errei
                        </button>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {run.phase === "feedback" && last && last.ok !== null ? (
            <button
              type="button"
              onClick={next}
              className="bg-ink text-canvas mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 font-semibold sm:w-auto"
            >
              {isLastQuestion ? "Ver relatório" : "Próxima"} <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          const r = runRef.current;
          if (!r) return;
          if (r.answers.length) commit({ ...r, done: true });
          else commit(null);
        }}
        className="text-ink-muted mt-4 text-sm underline"
      >
        Encerrar o simulado
      </button>
    </div>
  );
}
