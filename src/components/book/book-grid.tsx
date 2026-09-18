import type { CatalogEntry } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { BookCard } from "./book-card";

interface BookGridProps {
  readonly entries: readonly CatalogEntry[];
  readonly query?: string;
  readonly hideDisciplines?: boolean;
  readonly className?: string;
  /** Labels the grid for assistive tech, e.g. "Resultados da busca". */
  readonly label?: string;
}

export function BookGrid({ entries, query, hideDisciplines, className, label }: BookGridProps) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        className,
      )}
    >
      {entries.map((entry) => (
        <li key={entry.book.id} className="min-w-0">
          <BookCard entry={entry} query={query} hideDisciplines={hideDisciplines} />
        </li>
      ))}
    </ul>
  );
}
