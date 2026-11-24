"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Flame, Images, PlayCircle, TriangleAlert, WalletCards, Zap } from "lucide-react";
import { summariseStudy } from "@/lib/domain/study-stats";
import { loadOpenAttempts, type StoredAttempt } from "@/lib/exam-storage";
import { loadAllReviews } from "@/lib/flashcard-storage";
import { loadErrorQueue, loadStudyLog } from "@/lib/study-log";
import { cn } from "@/lib/utils";

/**
 * "O que me espera hoje" — a faixa que responde antes de qualquer clique.
 *
 * Tudo aqui vem do aparelho (localStorage), por isso só aparece depois de
 * montar. Quem nunca estudou pelo Atlas vê três portas de entrada em vez de
 * três zeros: um painel de zeros diz "você está atrasado"; uma sugestão diz
 * "comece por aqui".
 */

interface Today {
  readonly dueCards: number;
  readonly queued: number;
  readonly open?: StoredAttempt;
  readonly streak: number;
  readonly answeredToday: number;
  readonly fresh: boolean;
}

function read(): Today {
  const now = new Date();
  const iso = now.toISOString();
  let dueCards = 0;
  let anyReview = false;
  for (const deck of Object.values(loadAllReviews())) {
    for (const state of Object.values(deck)) {
      anyReview = true;
      if (state.due <= iso) dueCards++;
    }
  }
  const queued = loadErrorQueue().length;
  const open = loadOpenAttempts()[0];
  const log = loadStudyLog();
  const stats = summariseStudy(log.events, now, 1);
  return {
    dueCards,
    queued,
    ...(open ? { open } : {}),
    streak: stats.streak,
    answeredToday: stats.days[0]?.answered ?? 0,
    fresh: !anyReview && queued === 0 && !open && log.events.length === 0,
  };
}

function Tile({
  href,
  icon,
  value,
  label,
  hint,
  tone = "neutro",
}: {
  href: string;
  icon: ReactNode;
  value: string;
  label: string;
  hint: string;
  tone?: "neutro" | "alerta" | "destaque";
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "rounded-panel group flex h-full items-center gap-4 p-4 transition-transform hover:-translate-y-0.5",
          tone === "alerta" && "bg-danger-soft",
          tone === "destaque" && "bg-primary-soft",
          tone === "neutro" && "glass hover:glass-strong",
        )}
      >
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full",
            tone === "alerta" ? "bg-danger text-white" : "bg-surface text-primary",
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="min-w-0">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-2xl leading-none tabular-nums">{value}</span>
            <span className="text-sm font-semibold">{label}</span>
          </span>
          <span className="text-ink-muted mt-1 block text-xs leading-snug">{hint}</span>
        </span>
      </Link>
    </li>
  );
}

export function TodayPanel({ totalCards }: { totalCards: number }) {
  const [today, setToday] = useState<Today | null>(null);

  useEffect(() => setToday(read()), []);

  // Antes de ler o aparelho, reserva o espaço para a página não pular.
  if (!today) return <div className="min-h-24" aria-hidden="true" />;

  if (today.fresh) {
    return (
      <div>
        <h2 className="text-ink-faint text-micro mb-3 font-semibold tracking-[0.14em] uppercase">
          Comece por aqui
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          <Tile
            href="/estudar/rapido"
            icon={<Zap className="size-5" />}
            value="10"
            label="questões rápidas"
            hint="Corrigidas na hora, com o comentário. Dois minutos."
            tone="destaque"
          />
          <Tile
            href="/flashcards"
            icon={<WalletCards className="size-5" />}
            value={String(totalCards)}
            label="flashcards"
            hint="Vire, diga se sabia — o Atlas decide quando volta."
          />
          <Tile
            href="/estudar/imagem"
            icon={<Images className="size-5" />}
            value="TV"
            label="da prova prática"
            hint="Uma figura sem legenda e o relógio correndo."
          />
        </ul>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-ink-faint text-micro font-semibold tracking-[0.14em] uppercase">
          Hoje
        </h2>
        {today.streak > 0 ? (
          <span className="text-ink-muted inline-flex items-center gap-1.5 text-xs">
            <Flame className="text-accent size-3.5" aria-hidden="true" />
            {today.streak} {today.streak === 1 ? "dia seguido" : "dias seguidos"} de estudo
            {today.answeredToday > 0 ? ` · ${today.answeredToday} respostas hoje` : ""}
          </span>
        ) : null}
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        <Tile
          href="/flashcards"
          icon={<WalletCards className="size-5" />}
          value={String(today.dueCards)}
          label={today.dueCards === 1 ? "cartão vence" : "cartões vencem"}
          hint={today.dueCards ? "Revise antes que esfriem." : "Nada vencido. Que tal um baralho novo?"}
          tone={today.dueCards ? "destaque" : "neutro"}
        />
        <Tile
          href="/estudar/erros"
          icon={<TriangleAlert className="size-5" />}
          value={String(today.queued)}
          label={today.queued === 1 ? "erro na fila" : "erros na fila"}
          hint={
            today.queued
              ? "Saem com dois acertos seguidos."
              : "Fila vazia. O que você errar aparece aqui."
          }
          tone={today.queued ? "alerta" : "neutro"}
        />
        {today.open ? (
          <Tile
            href={today.open.href ?? `/simulados/${today.open.examId}/fazer`}
            icon={<PlayCircle className="size-5" />}
            value="↺"
            label="continuar"
            hint={today.open.title ?? "Simulado pela metade"}
            tone="destaque"
          />
        ) : (
          <Tile
            href="/estudar/rapido"
            icon={<Zap className="size-5" />}
            value="10"
            label="questões rápidas"
            hint="Corrigidas na hora, com o comentário."
          />
        )}
      </ul>
    </div>
  );
}
