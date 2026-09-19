import Link from "next/link";
import { FileText } from "lucide-react";
import type { CatalogEntry } from "@/lib/domain/types";
import { cn, formatAuthors } from "@/lib/utils";
import { highlightSegments } from "@/lib/domain/search";
import { BookCover } from "./book-cover";
import { BibliographyBadge, ReviewBadge } from "./book-badge";

/** Renders text with query matches marked, without dangerouslySetInnerHTML. */
function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  return (
    <>
      {highlightSegments(text, query).map((segment, i) =>
        segment.match ? (
          <mark key={i} className="bg-accent-soft text-accent rounded-[2px]">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </>
  );
}

interface BookCardProps {
  readonly entry: CatalogEntry;
  readonly query?: string;
  /** Hides the discipline chips on pages that already scope by discipline. */
  readonly hideDisciplines?: boolean;
  readonly className?: string;
}

/**
 * A cover with a caption. Kept quiet on purpose: title, author, one badge
 * for the bibliography type and a small PDF mark. The review badge only
 * exists on rows an admin is looking at — public rows never carry it.
 */
export function BookCard({ entry, query = "", hideDisciplines, className }: BookCardProps) {
  const { book, links } = entry;
  const primary = links[0];

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl p-2 transition-colors",
        "hover:glass",
        className,
      )}
    >
      <div className="relative transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transform-none">
        <BookCover book={book} size="md" decorative />
        {book.provenance.reviewStatus === "pendente" ? (
          <ReviewBadge className="absolute top-2 right-2 shadow-[var(--shadow-raise)]" />
        ) : null}
        {book.file ? (
          <span className="glass-strong text-primary absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold backdrop-blur">
            <FileText className="size-3" aria-hidden="true" />
            PDF
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-1 px-1">
        <h3 className="text-[0.95rem] leading-snug font-semibold text-pretty">
          <Link
            href={`/livros/${book.slug}`}
            className="hover:text-primary after:absolute after:inset-0 after:content-['']"
          >
            <Highlighted text={book.title} query={query} />
          </Link>
        </h3>

        <p className="text-ink-muted text-sm">
          <Highlighted text={formatAuthors(book.authors)} query={query} />
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {primary ? <BibliographyBadge type={primary.bibliographyType} /> : null}
          {links.length > 1 ? (
            <span className="text-ink-faint text-xs">{links.length} matérias</span>
          ) : null}
        </div>

        {!hideDisciplines && links.length > 0 ? (
          <p className="text-ink-faint text-xs leading-relaxed">
            {links.map((link) => link.discipline.shortName).join(" · ")}
          </p>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Dense horizontal variant for sidebars and "related" rails, where a full
 * cover grid would crowd the page.
 */
export function BookCardCompact({ entry, className }: { entry: CatalogEntry; className?: string }) {
  const { book, links } = entry;

  return (
    <article
      className={cn(
        "group hover:glass relative flex items-start gap-3 rounded-2xl p-2 transition-colors",
        className,
      )}
    >
      <div className="w-14 shrink-0">
        <BookCover book={book} size="sm" decorative />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm leading-snug font-semibold text-pretty">
          <Link
            href={`/livros/${book.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {book.title}
          </Link>
        </h3>
        <p className="text-ink-muted mt-0.5 truncate text-xs">{formatAuthors(book.authors, 1)}</p>
        <p className="text-ink-faint mt-1 text-xs">
          {links.map((link) => link.discipline.shortName).join(" · ")}
        </p>
      </div>
    </article>
  );
}
