import type { Book } from "@/lib/domain/types";
import { cn, surnameOf } from "@/lib/utils";
import { MotifArtwork, motifPalettes, seedOf } from "./cover-motifs";

/**
 * A book's cover.
 *
 * When no authorised artwork exists — which is every title today — this
 * draws an editorial placeholder from the book's own metadata. It is never
 * dressed up as the publisher's real cover: the design is deliberately
 * typographic, and `coverSource` travels with the record so the detail page
 * can say so plainly.
 */

const sizes = {
  sm: { wrapper: "text-[0.5rem]", title: "text-[0.68rem]", pad: "p-2.5" },
  md: { wrapper: "text-[0.55rem]", title: "text-[0.9rem]", pad: "p-3.5" },
  lg: { wrapper: "text-[0.62rem]", title: "text-[1.15rem]", pad: "p-5" },
} as const;

export type CoverSize = keyof typeof sizes;

interface BookCoverProps {
  readonly book: Book;
  readonly size?: CoverSize;
  readonly className?: string;
  /** Set on decorative repeats so screen readers hear the title only once. */
  readonly decorative?: boolean;
}

export function BookCover({ book, size = "md", className, decorative = false }: BookCoverProps) {
  const palette = motifPalettes[book.coverMotif];
  const scale = sizes[size];
  const seed = seedOf(book.id);
  const leadAuthor = book.authors[0] ? surnameOf(book.authors[0]) : "Autoria não informada";

  const label = decorative
    ? undefined
    : `Capa ilustrativa gerada para ${book.title}, de ${leadAuthor}`;

  return (
    <div
      className={cn(
        "relative isolate aspect-[2/3] w-full overflow-hidden rounded-l-[2px] rounded-r-[4px]",
        "shadow-[var(--shadow-book)] ring-1 ring-black/10",
        className,
      )}
      style={{ backgroundColor: palette.base, color: palette.text }}
      role={decorative ? "presentation" : "img"}
      aria-label={label}
      aria-hidden={decorative || undefined}
    >
      {/* Artwork sits behind the type. */}
      <svg
        viewBox="0 0 300 450"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={`cv-${book.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.base} />
            <stop offset="100%" stopColor={palette.deep} />
          </linearGradient>
        </defs>
        <rect width="300" height="450" fill={`url(#cv-${book.id})`} />
        <g style={{ color: palette.art }}>
          <MotifArtwork motif={book.coverMotif} seed={seed} />
        </g>
      </svg>

      {/* Spine shading along the binding edge. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[7%]"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.12) 45%, rgba(255,255,255,0.08) 100%)",
        }}
      />

      <div
        className={cn(
          "relative flex h-full flex-col justify-between gap-2",
          scale.pad,
          scale.wrapper,
        )}
      >
        <span
          className="font-sans font-semibold tracking-[0.18em] uppercase opacity-70"
          style={{ color: palette.text }}
        >
          {palette.label}
        </span>

        <div className="min-h-0">
          <p
            className={cn(
              "font-display leading-[1.18] font-semibold text-pretty",
              scale.title,
              size === "sm" ? "line-clamp-4" : "line-clamp-5",
            )}
          >
            {book.title}
          </p>
          <p className="mt-1.5 font-sans tracking-[0.12em] uppercase opacity-75">{leadAuthor}</p>
        </div>

        <div className="flex items-end justify-between gap-2">
          <span className="font-sans tracking-wide opacity-65">
            {book.edition ? book.edition.replace(/\s*ed\.?$/i, " ed.") : ""}
          </span>
          <span className="font-sans tracking-wide opacity-65">{book.publicationYear ?? ""}</span>
        </div>
      </div>
    </div>
  );
}
