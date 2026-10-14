import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { periodLabel, type Discipline } from "@/lib/domain/types";
import { MotifArtwork, motifPalettes, seedOf } from "@/components/book/cover-motifs";
import { cn } from "@/lib/utils";

/**
 * A discipline tile. The motif artwork and colour come from the discipline
 * itself, so each one is recognisable before the title is read.
 */
export function DisciplineCard({
  discipline,
  bookCount,
  className,
}: {
  discipline: Discipline;
  bookCount: number;
  className?: string;
}) {
  const palette = motifPalettes[discipline.motif];

  return (
    <article
      className={cn(
        "group glass rounded-hero relative flex flex-col overflow-hidden",
        "transition-shadow hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div
        className="relative h-28 overflow-hidden"
        style={{ backgroundColor: discipline.color }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 300 450"
          className="absolute inset-0 h-full w-full opacity-60"
          preserveAspectRatio="xMidYMid slice"
        >
          <g style={{ color: palette.art }}>
            <MotifArtwork motif={discipline.motif} seed={seedOf(discipline.id)} />
          </g>
        </svg>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="text-ink-faint flex items-center gap-2 text-xs">
          <span className="font-medium">{discipline.shortName}</span>
          <span>· {periodLabel(discipline.period)}</span>
          <span>· {discipline.semester}</span>
          {discipline.workload ? <span>· {discipline.workload}</span> : null}
        </div>

        <h3 className="mt-1.5 text-lg leading-snug font-semibold text-pretty">
          <Link
            href={`/disciplinas/${discipline.slug}`}
            className="hover:text-primary after:absolute after:inset-0 after:content-['']"
          >
            {discipline.name}
          </Link>
        </h3>

        <p className="text-ink-muted mt-2 line-clamp-3 text-sm leading-relaxed">
          {discipline.description}
        </p>

        <div className="mt-4 flex items-center justify-between pt-1 text-sm">
          <span className="text-ink-muted">
            {bookCount} {bookCount === 1 ? "título" : "títulos"}
          </span>
          <span className="text-primary inline-flex items-center gap-1 font-medium">
            Ver disciplina
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
