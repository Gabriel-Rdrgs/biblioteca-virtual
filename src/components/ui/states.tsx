import { SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Os estados que não são "deu tudo certo".
 *
 * O app tinha um único `loading.tsx` e nenhum `error.tsx`: uma falha de
 * leitura derrubava a rota sem desenho nenhum. Estes três blocos existem
 * para que vazio, erro e carregando tenham a mesma cara em toda parte.
 */

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = SearchX,
}: {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
  readonly icon?: typeof SearchX;
}) {
  return (
    <div className="border-line-strong bg-surface-sunken rounded-card flex flex-col items-center justify-center border border-dashed px-6 py-16 text-center">
      <Icon className="text-ink-faint size-9" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-ink-muted mt-2 max-w-md text-sm leading-relaxed text-pretty">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/** Bloco cinza que ocupa o lugar do conteúdo enquanto ele não chega. */
export function Skeleton({ className }: { readonly className?: string }) {
  return <div className={cn("bg-surface-sunken animate-pulse rounded", className)} />;
}

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

export function BookGridSkeleton({ count = 10 }: { readonly count?: number }) {
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

/** Linhas genéricas, para listas que não são de livros. */
export function ListSkeleton({ rows = 4 }: { readonly rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">Carregando…</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="rounded-card h-24 w-full" />
      ))}
    </div>
  );
}
