import Link from "next/link";
import { ChevronDown, Download } from "lucide-react";
import { bySequence, summaryDate, summaryLabel, lessonDayLabel, type Summary } from "@/lib/domain/summary-types";
import { cn } from "@/lib/utils";

/**
 * Os resumos de uma matéria em ordem: agrupados pela avaliação em que caem
 * (N1, N2…), e dentro de cada grupo o apanhado do ciclo primeiro e depois as
 * aulas na sequência em que aconteceram.
 *
 * Antes eram cartões grandes lado a lado, ou uma nuvem de pílulas — 26 aulas
 * viravam um mural. Uma linha por resumo, numerada, é como um índice de
 * apostila: dá para achar a aula de ontem e ver o que falta ler.
 */

export interface SummaryCycle {
  readonly id: string;
  /** "N1", "N2 — prova teórica"… */
  readonly label: string;
  readonly date?: string;
}

interface Group {
  readonly key: string;
  readonly label: string;
  readonly date?: string;
  readonly items: Summary[];
}

function groupSummaries(summaries: readonly Summary[], cycles: readonly SummaryCycle[]): Group[] {
  const byId = new Map(cycles.map((c) => [c.id, c]));
  const groups = new Map<string, Group>();
  for (const summary of summaries) {
    // A primeira avaliação conhecida decide o grupo; o rótulo encurta
    // "N1 — prova teórica" para "N1", que é como a turma fala.
    const cycle = summary.assessmentIds.map((id) => byId.get(id)).find(Boolean);
    const label = cycle ? (cycle.label.split(" — ")[0] ?? cycle.label) : "Sem avaliação marcada";
    const key = label;
    const group = groups.get(key) ?? {
      key,
      label,
      ...(cycle?.date ? { date: cycle.date } : {}),
      items: [],
    };
    group.items.push(summary);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, items: [...g.items].sort((a, b) => {
      // Ciclo (o apanhado da véspera) abre o grupo; depois, a sequência.
      if (a.kind === "ciclo" && b.kind !== "ciclo") return -1;
      if (b.kind === "ciclo" && a.kind !== "ciclo") return 1;
      return bySequence(a, b);
    }) }))
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
}

export function SummaryTimeline({
  summaries,
  cycles,
  openKey,
  color,
}: {
  summaries: readonly Summary[];
  cycles: readonly SummaryCycle[];
  /** Grupo que começa aberto (o da próxima prova). Sem ele, abre o primeiro. */
  openKey?: string;
  color?: string;
}) {
  const groups = groupSummaries(summaries, cycles);
  const open = openKey && groups.some((g) => g.key === openKey) ? openKey : groups[0]?.key;

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <details
          key={group.key}
          open={group.key === open}
          className="glass rounded-panel group/details overflow-hidden"
        >
          <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
            <span
              className="rounded-full px-2.5 py-0.5 text-sm font-semibold text-white"
              style={{ background: color ?? "var(--primary)" }}
            >
              {group.label}
            </span>
            <span className="text-ink-muted text-sm">
              {group.items.length} {group.items.length === 1 ? "resumo" : "resumos"}
              {group.date ? ` · prova em ${lessonDayLabel(group.date)}` : ""}
            </span>
            <ChevronDown
              className="text-ink-faint ml-auto size-4 transition-transform group-open/details:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <ol className="divide-line border-line divide-y border-t">
            {group.items.map((summary) => {
              const date = summaryDate(summary);
              return (
                <li key={summary.id} className="flex items-start gap-4 px-5 py-3.5">
                  <span
                    className={cn(
                      "text-micro mt-0.5 w-20 shrink-0 rounded-full px-2 py-1 text-center font-semibold",
                      summary.kind === "ciclo" ? "bg-accent-soft text-accent" : "bg-primary-soft text-primary",
                    )}
                  >
                    {summaryLabel(summary)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/resumos/${summary.slug}`}
                      className="hover:text-primary font-medium leading-snug"
                    >
                      {summary.title}
                    </Link>
                    {summary.topics.length > 0 ? (
                      <span className="text-ink-muted mt-0.5 line-clamp-2 block text-sm leading-relaxed">
                        {summary.topics.join(" · ")}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {date ? (
                      <span className="text-ink-faint text-xs tabular-nums">{lessonDayLabel(date)}</span>
                    ) : null}
                    <a
                      href={`/api/resumos/${summary.pdfPath}?baixar=1`}
                      className="text-ink-faint hover:text-primary inline-flex items-center gap-1 text-xs"
                      aria-label={`Baixar ${summaryLabel(summary)}: ${summary.title}`}
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      {summary.pages} p.
                    </a>
                  </span>
                </li>
              );
            })}
          </ol>
        </details>
      ))}
    </div>
  );
}
