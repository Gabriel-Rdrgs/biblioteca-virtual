"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { fold } from "@/lib/domain/anatomy-types";
import { cn } from "@/lib/utils";

/**
 * A busca da página do atlas: qualquer músculo, osso ou estrutura, pelo
 * nome em português, inglês ou latim. Escolher abre o atlas 3D já nela.
 */

export interface SearchEntry {
  readonly id: string;
  readonly namePt: string;
  /** "Osso · Coxa", "Músculo · Ombro"… */
  readonly hint: string;
  /** Todos os nomes, já sem acento, separados por "|". */
  readonly names: string;
}

export function AtlasSearch({ entries }: { entries: readonly SearchEntry[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = fold(query);
    if (q.length < 2) return [];
    // Primeiro o que começa com o que foi digitado, depois o que contém.
    const starts = entries.filter((e) => fold(e.namePt).startsWith(q));
    const contains = entries.filter((e) => !starts.includes(e) && e.names.includes(q));
    return [...starts, ...contains].slice(0, 8);
  }, [entries, query]);

  const href = (id: string) => `/anatomia/atlas?estrutura=${id}`;

  return (
    <div className="relative">
      <label className="relative block">
        <span className="sr-only">Buscar no atlas</span>
        <Search
          className="text-ink-faint pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) router.push(href(results[0].id));
          }}
          placeholder="Buscar músculo ou osso — português, inglês ou latim"
          className="glass-strong focus:border-primary border-line min-h-13 w-full rounded-full border py-3 pr-4 pl-12 text-base outline-none"
        />
      </label>
      {results.length ? (
        <ul className="glass-strong rounded-panel absolute inset-x-0 top-full z-30 mt-2 overflow-hidden p-1.5 shadow-xl">
          {results.map((r, i) => (
            <li key={r.id}>
              <Link
                href={href(r.id)}
                className={cn(
                  "hover:bg-primary-soft flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2",
                  i === 0 && "bg-primary-soft/60",
                )}
              >
                <span className="truncate font-medium">{r.namePt}</span>
                <span className="text-ink-faint shrink-0 text-xs">{r.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : query.trim().length >= 2 ? (
        <p className="text-ink-muted mt-2 px-4 text-sm">Nada com esse nome no atlas.</p>
      ) : null}
    </div>
  );
}
