import Link from "next/link";
import { ChevronRight, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Breadcrumbs({ trail }: { trail: readonly { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-6">
      <ol className="text-ink-muted flex flex-wrap items-center gap-1 text-sm">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="text-ink-faint size-3.5" aria-hidden="true" />
              ) : null}
              {crumb.href && !last ? (
                <Link href={crumb.href} className="hover:text-primary hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn(last && "text-ink font-medium")}
                  aria-current={last ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  numeral,
  as: Tag = "h2",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Small uppercase kicker above the title. */
  numeral?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="max-w-2xl">
        {numeral ? (
          <span className="text-ink-faint block text-xs font-medium tracking-[0.18em] uppercase">
            {numeral}
          </span>
        ) : null}
        <Tag className="mt-1 text-2xl font-semibold sm:text-[1.75rem]">{title}</Tag>
        {description ? (
          <p className="text-ink-muted mt-2 text-[0.95rem] leading-relaxed text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-line-strong bg-surface-sunken flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed px-6 py-16 text-center">
      <SearchX className="text-ink-faint size-9" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-ink-muted mt-2 max-w-md text-sm leading-relaxed text-pretty">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function StatsCard({
  value,
  label,
  hint,
}: {
  value: number | string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="border-line bg-surface rounded-[var(--radius-card)] border p-5">
      <p className="font-display text-primary text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      {hint ? <p className="text-ink-faint mt-1 text-xs leading-relaxed">{hint}</p> : null}
    </div>
  );
}

/** Shimmer placeholder matching the shape of a book card. */
export function BookCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3" aria-hidden="true">
      <div className="bg-surface-sunken aspect-[2/3] w-full rounded-[4px]" />
      <div className="space-y-2">
        <div className="bg-surface-sunken h-3.5 w-11/12 rounded" />
        <div className="bg-surface-sunken h-3 w-2/3 rounded" />
        <div className="bg-surface-sunken h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function BookGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <span className="sr-only">Carregando livros…</span>
      {Array.from({ length: count }, (_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}
