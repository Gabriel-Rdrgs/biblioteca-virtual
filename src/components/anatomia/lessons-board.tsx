"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Flame, Trophy } from "lucide-react";
import {
  cardStatus,
  lessonMastered,
  TRACKS,
  type Lesson,
  type LessonTrack,
} from "@/lib/domain/anatomy-lessons";
import { useAnatomyProgress } from "@/lib/anatomy-progress";
import { cn } from "@/lib/utils";

/**
 * O quadro das lições, organizado como um curso: cada região do corpo é um
 * módulo, e dentro dele as etapas seguem a ordem de um atlas — ossos,
 * acidentes ósseos, músculos superficiais, músculos profundos.
 *
 * Só um módulo fica aberto de cada vez: o da próxima lição a fazer (ou o que
 * veio no endereço, /anatomia/licoes#coxa). Um filtro no topo mostra uma
 * etapa só, no corpo inteiro — "quero treinar só acidentes".
 */

type Filter = "tudo" | "ossos" | "acidentes" | "musculos";

const FILTERS: readonly { id: Filter; label: string; tracks: readonly LessonTrack[] }[] = [
  { id: "tudo", label: "Tudo", tracks: ["ossos", "acidentes", "superficiais", "profundos"] },
  { id: "ossos", label: "Ossos", tracks: ["ossos"] },
  { id: "acidentes", label: "Acidentes", tracks: ["acidentes"] },
  { id: "musculos", label: "Músculos", tracks: ["superficiais", "profundos"] },
];

const NOUN: Record<Lesson["kind"], [string, string]> = {
  bone: ["osso", "ossos"],
  landmark: ["acidente", "acidentes"],
  muscle: ["músculo", "músculos"],
};

export function LessonsBoard({
  regions,
  lessons,
  names,
}: {
  regions: readonly { readonly id: string; readonly name: string }[];
  lessons: readonly Lesson[];
  /** Nome de cada item treinável, para a linha de contexto de cada lição. */
  names: Readonly<Record<string, string>>;
}) {
  const progress = useAnatomyProgress();
  const [filter, setFilter] = useState<Filter>("tudo");
  const tracks = FILTERS.find((f) => f.id === filter)?.tracks ?? [];
  const visible = lessons.filter((l) => tracks.includes(l.track));

  // A próxima: a primeira lição ainda não dominada, na ordem do curso.
  const next = visible.find((l) => !lessonMastered(progress.lessons[l.id]?.best)) ?? visible[0];
  const [open, setOpen] = useState<string | null>(null);
  const openRegion = open ?? next?.region ?? null;

  // /anatomia/licoes#coxa abre o módulo da coxa.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash && regions.some((r) => r.id === hash)) {
      setOpen(hash);
      document.getElementById(`modulo-${hash}`)?.scrollIntoView({ block: "start" });
    }
  }, [regions]);

  const allItems = useMemo(() => [...new Set(lessons.flatMap((l) => l.itemIds))], [lessons]);
  const stats = useMemo(() => {
    let studied = 0;
    let mastered = 0;
    let seen = 0;
    let correct = 0;
    for (const id of allItems) {
      const card = progress.cards[id];
      if (!card) continue;
      studied++;
      seen += card.seen;
      correct += card.correct;
      if (cardStatus(card) === "mastered") mastered++;
    }
    return { studied, mastered, accuracy: seen ? Math.round((correct / seen) * 100) : null };
  }, [allItems, progress.cards]);

  return (
    <div className="space-y-5">
      {/* --------------------------------------------- filtro e resumo */}
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => {
              setFilter(f.id);
              setOpen(null);
            }}
            className={cn(
              "min-h-10 shrink-0 rounded-full px-4 text-sm font-medium",
              filter === f.id ? "bg-primary text-on-primary" : "glass-strong text-ink-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {stats.studied ? (
        <section aria-label="Resumo" className="grid grid-cols-3 gap-2">
          {[
            { icon: Flame, value: `${stats.studied}/${allItems.length}`, label: "estudados" },
            { icon: Trophy, value: String(stats.mastered), label: "dominados" },
            { icon: Check, value: stats.accuracy === null ? "—" : `${stats.accuracy}%`, label: "de acerto" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="glass flex flex-col gap-1 rounded-2xl p-3">
              <Icon className="text-ink-faint size-4" aria-hidden="true" />
              <span className="text-xl leading-none font-semibold tracking-tight sm:text-2xl">{value}</span>
              <span className="text-ink-muted text-xs leading-tight">{label}</span>
            </div>
          ))}
        </section>
      ) : null}

      {/* --------------------------------------------- módulos */}
      <ol className="space-y-2">
        {regions.map((region) => {
          const mine = visible.filter((l) => l.region === region.id);
          if (mine.length === 0) return null;
          const done = mine.filter((l) => lessonMastered(progress.lessons[l.id]?.best)).length;
          const isOpen = openRegion === region.id;
          return (
            <li key={region.id} id={`modulo-${region.id}`} className="glass scroll-mt-24 overflow-hidden rounded-2xl">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? "" : region.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold">{region.name}</span>
                    <span className="text-ink-faint shrink-0 font-mono text-xs">
                      {done}/{mine.length}
                    </span>
                  </span>
                  <span className="bg-line mt-2 block h-1.5 overflow-hidden rounded-full">
                    <span
                      className={cn("block h-full rounded-full", done === mine.length ? "bg-emerald-500" : "bg-[#ff6a55]")}
                      style={{ width: `${(done / mine.length) * 100}%` }}
                    />
                  </span>
                </span>
                <ChevronDown
                  className={cn("text-ink-faint size-5 shrink-0 transition-transform", !isOpen && "-rotate-90")}
                  aria-hidden="true"
                />
              </button>

              {isOpen ? (
                <div className="space-y-4 px-2 pb-3 sm:px-3">
                  {TRACKS.filter((t) => tracks.includes(t.id)).map((track) => {
                    const steps = mine.filter((l) => l.track === track.id);
                    if (steps.length === 0) return null;
                    return (
                      <section key={track.id}>
                        <header className="px-2">
                          <h3 className="text-sm font-semibold">{track.label}</h3>
                          <p className="text-ink-faint text-xs">{track.hint}</p>
                        </header>
                        <ul className="mt-1.5 space-y-1">
                          {steps.map((lesson) => {
                            const record = progress.lessons[lesson.id];
                            const mastered = lessonMastered(record?.best);
                            const isNext = lesson.id === next?.id;
                            const masteredItems = lesson.itemIds.filter(
                              (id) => cardStatus(progress.cards[id]) === "mastered",
                            ).length;
                            const [one, many] = NOUN[lesson.kind];
                            return (
                              <li key={lesson.id}>
                                <Link
                                  href={`/anatomia/licao/${lesson.id}`}
                                  className={cn(
                                    "flex min-h-14 items-center gap-3 rounded-xl px-2.5 py-2 transition-colors",
                                    isNext ? "bg-primary-soft" : "hover:bg-surface-sunken",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "grid size-9 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold",
                                      mastered
                                        ? "bg-emerald-500/15 text-emerald-600"
                                        : record
                                          ? "bg-amber-400/20 text-amber-700 dark:text-amber-300"
                                          : "bg-surface-sunken text-ink-muted",
                                    )}
                                    aria-label={mastered ? "Dominada" : record ? "Começada" : "Nova"}
                                  >
                                    {mastered ? <Check className="size-4" /> : lesson.number}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                      <span className="truncate text-sm font-medium">{lesson.short}</span>
                                      {isNext ? (
                                        <span className="bg-primary text-on-primary shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">
                                          Próxima
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className="text-ink-faint block truncate text-xs">
                                      {lesson.itemIds.length} {lesson.itemIds.length === 1 ? one : many}
                                      {record ? ` · melhor ${Math.round(record.best * 100)}%` : ""}
                                      {masteredItems ? ` · ${masteredItems} dominados` : ""}
                                      {" · "}
                                      {lesson.itemIds.map((id) => names[id] ?? id).join(", ")}
                                    </span>
                                  </span>
                                  <ChevronRight className="text-ink-faint size-4 shrink-0" aria-hidden="true" />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
