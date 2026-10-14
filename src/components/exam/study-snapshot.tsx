"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LineChart, PlayCircle, Target } from "lucide-react";
import { formatDuration, summariseProgress, type ProgressSummary } from "@/lib/domain/progress";
import { loadHistory, loadOpenAttempts, type StoredAttempt } from "@/lib/exam-storage";
import { Badge, ButtonLink, Card, CardLink } from "@/components/ui/primitives";

/**
 * Onde você parou e o que ainda está fraco.
 *
 * Lê só o localStorage deste aparelho, então só renderiza depois de montar —
 * antes disso o servidor não tem como saber de nada, e fingir que sabe daria
 * diferença de hidratação. Enquanto não houver conta, é esta a verdade
 * disponível.
 */

type Variante = "painel" | "pagina";

interface Estado {
  readonly aberta?: StoredAttempt;
  readonly resumo: ProgressSummary;
}

function ler(): Estado {
  const abertas = loadOpenAttempts();
  return {
    ...(abertas[0] ? { aberta: abertas[0] } : {}),
    resumo: summariseProgress(loadHistory()),
  };
}

export function StudySnapshot({ variante = "pagina" }: { readonly variante?: Variante }) {
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    setEstado(ler());
  }, []);

  if (!estado) return null;

  const { aberta, resumo } = estado;
  const revisar = resumo.toRevise.slice(0, 3);
  const nunca = resumo.attempts === 0 && !aberta;

  // No painel da home, silêncio é melhor que um card vazio dizendo nada.
  if (variante === "painel" && nunca) return null;

  if (variante === "painel") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {aberta ? (
          <CardLink
            href={aberta.href ?? `/simulados/${aberta.examId}/fazer`}
            respiro="sm"
            className="flex items-center gap-3"
          >
            <PlayCircle className="text-primary size-6 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="text-ink-faint text-micro block tracking-[0.1em] uppercase">
                Continuar
              </span>
              <span className="mt-0.5 block truncate font-semibold">
                {aberta.title ?? "Simulado em andamento"}
              </span>
            </span>
            <ArrowRight className="text-ink-faint size-4 shrink-0" aria-hidden="true" />
          </CardLink>
        ) : null}

        {revisar.length > 0 ? (
          <CardLink href="/progresso" respiro="sm" className="flex items-center gap-3">
            <Target className="text-accent size-6 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="text-ink-faint text-micro block tracking-[0.1em] uppercase">
                Revisar primeiro
              </span>
              <span className="mt-0.5 block truncate font-semibold">{revisar[0]?.label}</span>
            </span>
            <Badge tom={revisar[0] && revisar[0].latest < 60 ? "perigo" : "acento"}>
              {Math.round(revisar[0]?.latest ?? 0)}%
            </Badge>
          </CardLink>
        ) : null}
      </div>
    );
  }

  if (nunca) {
    return (
      <Card material="papel" raio="card" respiro="md" className="flex flex-wrap items-center gap-4">
        <LineChart className="text-ink-faint size-6 shrink-0" aria-hidden="true" />
        <p className="text-ink-muted min-w-0 flex-1 text-sm leading-relaxed text-pretty">
          Faça um simulado e corrija: a partir daí esta página passa a dizer em que assunto você
          está fraco e se ele melhorou.
        </p>
      </Card>
    );
  }

  return (
    <Card raio="hero" respiro="md">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="text-lg font-semibold">Onde você está</h2>
        <ButtonLink href="/progresso" variant="fantasma" size="sm">
          Meu progresso
          <ArrowRight className="size-4" aria-hidden="true" />
        </ButtonLink>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <dt className="text-ink-faint text-xs">Simulados</dt>
          <dd className="font-display text-primary text-2xl font-semibold tabular-nums">
            {resumo.attempts}
          </dd>
        </div>
        <div>
          <dt className="text-ink-faint text-xs">Questões</dt>
          <dd className="font-display text-primary text-2xl font-semibold tabular-nums">
            {resumo.questionsAnswered}
          </dd>
        </div>
        <div>
          <dt className="text-ink-faint text-xs">Tempo</dt>
          <dd className="font-display text-primary text-2xl font-semibold tabular-nums">
            {formatDuration(resumo.totalSeconds)}
          </dd>
        </div>
      </dl>

      {aberta ? (
        <CardLink
          href={aberta.href ?? `/simulados/${aberta.examId}/fazer`}
          material="fundo"
          raio="card"
          respiro="sm"
          className="mt-5 flex items-center gap-3"
        >
          <PlayCircle className="text-primary size-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            Continuar: {aberta.title ?? "simulado em andamento"}
          </span>
          <ArrowRight className="text-ink-faint size-4 shrink-0" aria-hidden="true" />
        </CardLink>
      ) : null}

      {revisar.length > 0 ? (
        <div className="mt-5">
          <p className="text-ink-faint text-micro tracking-[0.1em] uppercase">Revisar primeiro</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {revisar.map((eixo) => (
              <li key={eixo.id}>
                <Badge tom={eixo.latest < 60 ? "perigo" : "acento"}>
                  {eixo.label}
                  <span className="tabular-nums">{Math.round(eixo.latest)}%</span>
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
