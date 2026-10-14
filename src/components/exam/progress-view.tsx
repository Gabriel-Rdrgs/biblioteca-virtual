"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Hourglass, PencilRuler, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { formatMark } from "@/lib/domain/exam-scoring";
import {
  formatDuration,
  summariseProgress,
  trendLabel,
  type ProgressSummary,
} from "@/lib/domain/progress";
import { clearHistory, loadHistory, type StoredAttempt } from "@/lib/exam-storage";
import { cn } from "@/lib/utils";
import { StudyLinks } from "./study-links";
import { ButtonLink } from "@/components/ui/primitives";

/**
 * The semester seen through the simulados someone has done.
 *
 * It reads only this device's localStorage, so it renders after mounting
 * and says so plainly: there is no account yet, and a score is nobody
 * else's business. What it is for is the second column — whether the axis
 * you were weak at is still weak.
 */

function Stat({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="glass rounded-panel p-4">
      <p className="font-display text-primary text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      {hint ? <p className="text-ink-faint mt-0.5 text-xs">{hint}</p> : null}
    </div>
  );
}

/** A bar for the latest standing, with a ghost mark where it started. */
function AxisBar({ first, latest }: { first: number; latest: number }) {
  const tone = latest < 60 ? "bg-danger" : latest <= 80 ? "bg-accent" : "bg-sage";
  return (
    <div className="bg-surface-sunken relative mt-2 h-2 overflow-hidden rounded-full">
      <div
        className={cn("h-full rounded-full", tone)}
        style={{ width: `${Math.max(2, latest)}%` }}
      />
      {Math.round(first) !== Math.round(latest) ? (
        <span
          aria-hidden="true"
          className="bg-ink-faint absolute top-0 h-full w-0.5"
          style={{ left: `${Math.min(99, Math.max(0, first))}%` }}
        />
      ) : null}
    </div>
  );
}

function dateLabel(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

export function ProgressView() {
  const [attempts, setAttempts] = useState<StoredAttempt[] | null>(null);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    const history = loadHistory();
    setAttempts(history);
    setSummary(summariseProgress(history));
  }, []);

  if (!attempts || !summary) {
    return <p className="text-ink-muted py-16 text-center text-sm">Carregando…</p>;
  }

  if (summary.attempts === 0) {
    return (
      <div className="glass rounded-hero p-6 sm:p-8">
        <PencilRuler className="text-ink-faint size-8" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold">Nada aqui ainda</h2>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed text-pretty">
          Faça um simulado e corrija: a partir do segundo, esta página mostra se o assunto em que
          você foi mal continua fraco ou já melhorou.
        </p>
        <ButtonLink href="/estudar" className="mt-6">
          Ver os simulados
          <ArrowRight className="size-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    );
  }

  const single = summary.attempts === 1;

  return (
    <div className="space-y-10">
      <section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            value={String(summary.attempts)}
            label={summary.attempts === 1 ? "simulado feito" : "simulados feitos"}
            hint={summary.firstAt ? `desde ${dateLabel(summary.firstAt)}` : undefined}
          />
          <Stat value={String(summary.questionsAnswered)} label="questões respondidas" />
          <Stat
            value={formatDuration(summary.totalSeconds)}
            label="de prova"
            hint="tempo com a página aberta"
          />
          <Stat
            value={String(summary.toRevise.length)}
            label={summary.toRevise.length === 1 ? "eixo fraco" : "eixos fracos"}
            hint="abaixo de 60% na última vez"
          />
        </div>
      </section>

      {summary.toRevise.length > 0 ? (
        <section className="glass rounded-hero p-5 sm:p-6">
          <h2 className="text-lg font-semibold">O que ainda está fraco</h2>
          <p className="text-ink-muted mt-1 text-sm leading-relaxed">
            Pela última vez que cada assunto apareceu em um simulado seu.
          </p>
          <ul className="mt-4 space-y-3">
            {summary.toRevise.slice(0, 5).map((axis) => (
              <li key={axis.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-medium">{axis.label}</span>
                  <span className="text-ink-muted text-sm tabular-nums">
                    {Math.round(axis.latest)}%
                    {axis.attempts > 1 ? (
                      <span
                        className={cn(
                          "ml-2 inline-flex items-center gap-1 text-xs",
                          axis.trend > 0 ? "text-sage" : axis.trend < 0 ? "text-danger" : "",
                        )}
                      >
                        {axis.trend > 0 ? (
                          <TrendingUp className="size-3" aria-hidden="true" />
                        ) : axis.trend < 0 ? (
                          <TrendingDown className="size-3" aria-hidden="true" />
                        ) : null}
                        {trendLabel(axis.trend)}
                      </span>
                    ) : null}
                  </span>
                </div>
                <AxisBar first={axis.first} latest={axis.latest} />
                <StudyLinks axisId={axis.id} className="flex flex-wrap gap-1.5" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold">Todos os eixos</h2>
        <p className="text-ink-muted mt-1 text-sm leading-relaxed">
          {single
            ? "Com um simulado só dá para ver onde você está; faça outro para ver se melhorou."
            : "A barra mostra onde você está hoje; o traço, onde estava na primeira vez."}
        </p>
        <ul className="mt-4 space-y-3">
          {summary.axes.map((axis) => (
            <li key={axis.id} className="glass rounded-panel p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="font-medium">{axis.label}</span>
                <span className="text-ink-muted text-sm tabular-nums">
                  {axis.attempts > 1 ? "última vez: " : ""}
                  {Math.round(axis.latest)}%
                  {axis.attempts > 1 ? (
                    <span className="text-ink-faint">
                      {" · no total "}
                      {formatMark(axis.earned)} de {axis.possible} pontos em {axis.attempts}{" "}
                      simulados
                    </span>
                  ) : null}
                </span>
              </div>
              <AxisBar first={axis.first} latest={axis.latest} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Seus simulados</h2>
        <ul className="mt-4 space-y-2">
          {summary.exams.map((exam) => (
            <li
              key={exam.examId}
              className="glass rounded-panel flex flex-wrap items-center gap-x-4 gap-y-2 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{exam.title}</p>
                <p className="text-ink-faint text-xs tabular-nums">
                  {exam.attempts} {exam.attempts === 1 ? "tentativa" : "tentativas"} · melhor{" "}
                  {formatMark(exam.best)} de {formatMark(exam.scaleMax)}
                </p>
              </div>
              <span className="font-display text-primary text-2xl font-semibold tabular-nums">
                {formatMark(exam.latest)}
              </span>
              {exam.href ? (
                <Link
                  href={exam.href}
                  className="glass-strong hover:text-primary rounded-full px-4 py-2 text-sm font-medium transition-colors"
                >
                  Refazer
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-line/60 border-t pt-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Hourglass className="size-4" aria-hidden="true" />
          Onde isso fica guardado
        </h2>
        <p className="text-ink-muted mt-2 max-w-2xl text-sm leading-relaxed text-pretty">
          Só neste aparelho, no navegador. Não existe conta individual na biblioteca, então nada
          disso vai para o servidor nem é visto por mais ninguém — a contrapartida é que abrir em
          outro celular começa do zero.
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Apagar todos os seus simulados feitos neste aparelho?")) {
              clearHistory();
              setAttempts([]);
              setSummary(summariseProgress([]));
            }
          }}
          className="border-line text-danger hover:border-danger mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Apagar meu histórico
        </button>
      </section>
    </div>
  );
}
