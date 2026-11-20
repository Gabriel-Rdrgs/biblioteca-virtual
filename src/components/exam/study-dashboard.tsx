"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Flame, Layers, ListChecks, Target, TriangleAlert } from "lucide-react";
import { MASTERED_BOX } from "@/lib/domain/flashcard-review";
import { modeLabel, summariseStudy, type Rate, type StudyStats } from "@/lib/domain/study-stats";
import { loadAllReviews } from "@/lib/flashcard-storage";
import {
  clearStudyLog,
  loadErrorQueue,
  loadStudyLog,
  type StudySession,
} from "@/lib/study-log";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/primitives";

/**
 * O painel de desempenho: tudo o que foi respondido em qualquer modo.
 *
 * O histórico de simulados completos continua logo abaixo (ProgressView),
 * com a evolução por eixo de prova em prova. Aqui a pergunta é outra: estou
 * estudando todo dia, e onde estou errando agora?
 */

function band(percent: number): string {
  if (percent >= 80) return "bg-sage";
  if (percent >= 60) return "bg-accent";
  return "bg-danger";
}

function Kpi({
  icon,
  value,
  label,
  hint,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="glass rounded-panel p-4">
      <div className="text-ink-faint flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase">
        {icon}
        {label}
      </div>
      <p className="font-display mt-1 text-3xl tabular-nums">{value}</p>
      {hint ? <p className="text-ink-faint text-xs">{hint}</p> : null}
    </div>
  );
}

function RateBars({ rows, link }: { rows: readonly Rate[]; link?: (row: Rate) => string | null }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => {
        const href = link?.(row) ?? null;
        return (
          <li
            key={row.id}
            className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_5rem]"
          >
            {href ? (
              <Link href={href} className="hover:text-primary truncate hover:underline" title={row.label}>
                {row.label}
              </Link>
            ) : (
              <span className="truncate" title={row.label}>
                {row.label}
              </span>
            )}
            <span className="bg-line h-2.5 overflow-hidden rounded-full">
              <span
                className={cn("block h-full rounded-full transition-[width]", band(row.percent))}
                style={{ width: `${row.percent}%` }}
              />
            </span>
            <span className="text-right tabular-nums">
              <span className="font-semibold">{row.percent}%</span>
              <span className="text-ink-faint block text-[0.65rem]">
                {row.correct}/{row.answered}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function weakLink(row: Rate): string {
  // Eixo de figura (o id é o do baralho) volta ao simulado de imagem.
  return row.id.startsWith("oficial:") ? "/estudar/imagem" : `/estudar/rapido?eixos=${row.id}`;
}

export function StudyDashboard() {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [mastered, setMastered] = useState(0);
  const [queued, setQueued] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(() => {
    const log = loadStudyLog();
    setStats(summariseStudy(log.events, new Date()));
    setSessions([...log.sessions].reverse().slice(0, 8));
    const reviews = loadAllReviews();
    setMastered(
      Object.values(reviews).reduce(
        (n, deck) => n + Object.values(deck).filter((r) => r.box >= MASTERED_BOX).length,
        0,
      ),
    );
    setQueued(loadErrorQueue().length);
  }, []);

  useEffect(() => load(), [load]);

  if (!stats) return <p className="text-ink-muted py-10 text-center text-sm">Carregando…</p>;

  if (stats.answered === 0) {
    return (
      <section className="glass rounded-hero p-6 sm:p-8">
        <h2 className="text-lg font-semibold">O painel começa na primeira resposta</h2>
        <p className="text-ink-muted mt-2 max-w-xl text-sm leading-relaxed text-pretty">
          Modo rápido, simulado de imagem, flashcards e simulados corrigidos alimentam este painel:
          acerto por área, os assuntos mais fracos e os dias em que você estudou.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink href="/estudar/rapido">Modo rápido</ButtonLink>
          <ButtonLink href="/flashcards" variant="secundario">
            Flashcards
          </ButtonLink>
        </div>
      </section>
    );
  }

  const maxDay = Math.max(1, ...stats.days.map((d) => d.answered));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi
          icon={<ListChecks className="size-3.5" aria-hidden="true" />}
          value={String(stats.answered)}
          label="Respostas"
          hint={`em ${stats.activeDays} ${stats.activeDays === 1 ? "dia" : "dias"}`}
        />
        <Kpi
          icon={<Target className="size-3.5" aria-hidden="true" />}
          value={`${stats.percent}%`}
          label="Acerto"
          hint={`${stats.correct} certas`}
        />
        <Kpi
          icon={<Flame className="size-3.5" aria-hidden="true" />}
          value={String(stats.streak)}
          label="Sequência"
          hint={stats.streak === 1 ? "dia seguido" : "dias seguidos"}
        />
        <Kpi
          icon={<Layers className="size-3.5" aria-hidden="true" />}
          value={String(mastered)}
          label="Cartões"
          hint="dominados"
        />
        <Link href="/estudar/erros" className="col-span-2 lg:col-span-1">
          <Kpi
            icon={<TriangleAlert className="size-3.5" aria-hidden="true" />}
            value={String(queued)}
            label="Fila de erros"
            hint={queued ? "revisar agora →" : "vazia"}
          />
        </Link>
      </div>

      <section className="glass rounded-hero p-5 sm:p-6">
        <h2 className="text-base font-semibold">Últimos 14 dias</h2>
        <p className="text-ink-faint text-xs">Altura: respostas no dia. Verde: certas.</p>
        <ol className="mt-4 flex h-40 items-end gap-1.5" aria-label="Respostas por dia">
          {stats.days.map((day) => {
            const height = (day.answered / maxDay) * 100;
            const okShare = day.answered ? (day.correct / day.answered) * 100 : 0;
            return (
              <li
                key={day.key}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                aria-label={`${day.label}: ${day.answered} respostas, ${day.correct} certas`}
              >
                {day.answered > 0 ? (
                  <span className="text-ink-muted text-[0.6rem] tabular-nums">{day.answered}</span>
                ) : null}
                <span
                  className="bg-danger-soft flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-md"
                  style={{ height: `${Math.max(height, day.answered ? 4 : 2)}%` }}
                >
                  <span className="bg-sage block w-full" style={{ height: `${okShare}%` }} />
                </span>
                <span className="text-ink-faint text-[0.6rem] tabular-nums">{day.label.slice(0, 2)}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-hero p-5 sm:p-6">
          <h2 className="text-base font-semibold">Por área</h2>
          <div className="mt-4">
            <RateBars rows={stats.byGroup} />
          </div>
        </section>
        <section className="glass rounded-hero p-5 sm:p-6">
          <h2 className="text-base font-semibold">Por modo</h2>
          <div className="mt-4">
            <RateBars rows={stats.byMode} />
          </div>
        </section>
      </div>

      {stats.weakest.length > 0 ? (
        <section className="glass rounded-hero p-5 sm:p-6">
          <h2 className="text-base font-semibold">Revise primeiro</h2>
          <p className="text-ink-faint text-xs">
            Assuntos com pelo menos três respostas, do pior para o melhor. Toque para treinar só ele.
          </p>
          <div className="mt-4">
            <RateBars rows={stats.weakest.slice(0, 8)} link={weakLink} />
          </div>
        </section>
      ) : null}

      {sessions.length > 0 ? (
        <section className="glass rounded-hero p-5 sm:p-6">
          <h2 className="text-base font-semibold">Sessões recentes</h2>
          <ul className="divide-line mt-3 divide-y">
            {sessions.map((s) => {
              const p = s.total ? Math.round((s.correct / s.total) * 100) : 0;
              const d = new Date(s.t);
              return (
                <li key={s.t} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-2.5 text-sm sm:grid-cols-[8.5rem_minmax(0,1fr)_6rem_4.5rem]">
                  <span className="text-ink-muted text-xs">{modeLabel(s.mode)}</span>
                  <span className="truncate font-medium">{s.title}</span>
                  <time dateTime={d.toISOString()} className="text-ink-faint text-xs tabular-nums">
                    {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}{" "}
                    {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </time>
                  <span className="text-right font-semibold tabular-nums">
                    {s.correct}/{s.total}
                    <span className={cn("ml-1.5 inline-block size-2 rounded-full", band(p))} aria-hidden="true" />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <ButtonLink href="/estudar/rapido" size="sm">
          Treinar agora
          <ArrowRight className="size-4" aria-hidden="true" />
        </ButtonLink>
        {confirmClear ? (
          <>
            <span>Apagar o painel e a fila de erros deste aparelho?</span>
            <Button
              type="button"
              size="sm"
              variant="perigo"
              onClick={() => {
                clearStudyLog();
                setConfirmClear(false);
                load();
              }}
            >
              Apagar
            </Button>
            <Button type="button" size="sm" variant="fantasma" onClick={() => setConfirmClear(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="text-ink-faint hover:text-ink text-xs underline"
          >
            Zerar o painel
          </button>
        )}
      </div>
    </div>
  );
}
