import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Porta de entrada única da camada de interface.
 *
 * Os componentes moram em arquivos próprios (botão, superfície, etiqueta,
 * campo, estados); aqui ficam só os blocos de página e a reexportação, para
 * que uma tela importe de um lugar só.
 */

export { Button, ButtonLink, ButtonAnchor, IconButton, ToggleChip } from "./button";
export { Card, CardLink } from "./card";
export { Badge } from "./badge";
export { Field, Input, Select, Textarea, Notice, inputClass } from "./field";
export { EmptyState, Skeleton, BookCardSkeleton, BookGridSkeleton, ListSkeleton } from "./states";
export { ErrorState } from "./error-state";

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
          <p className="text-ink-muted text-body-sm mt-2 leading-relaxed text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {action}
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
    <div className="border-line bg-surface rounded-card border p-5">
      <p className="font-display text-primary text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      {hint ? <p className="text-ink-faint mt-1 text-xs leading-relaxed">{hint}</p> : null}
    </div>
  );
}
