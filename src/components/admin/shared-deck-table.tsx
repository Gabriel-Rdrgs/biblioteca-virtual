"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Badge, Button } from "@/components/ui/primitives";

/**
 * Os baralhos que os alunos publicaram.
 *
 * Ocultar é o gesto normal (um baralho com erro, ou repetido); excluir é
 * para o que não devia ter sido publicado. Quem publicou pode republicar
 * depois de ocultado — ocultar não apaga a cópia do aparelho dele.
 */

export interface AdminSharedDeckRow {
  readonly id: string;
  readonly title: string;
  readonly discipline: string;
  readonly author?: string;
  readonly cards: number;
  readonly updatedAt: string;
  readonly visibility: "visivel" | "oculto";
}

export function SharedDeckTable({ rows }: { readonly rows: readonly AdminSharedDeckRow[] }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);

  if (rows.length === 0) {
    return <p className="text-ink-muted text-sm">Nenhum baralho publicado pela turma ainda.</p>;
  }

  const agir = async (id: string, init: RequestInit) => {
    setOcupado(id);
    setErro(null);
    const response = await fetch(`/api/admin/flashcards/${id}`, init);
    setOcupado(null);
    setConfirmar(null);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setErro(body.error ?? "Não foi possível concluir.");
      return;
    }
    router.refresh();
  };

  return (
    <div>
      {erro ? <p className="text-danger mb-2 text-sm">{erro}</p> : null}
      <ul className="divide-line border-line rounded-card divide-y border">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
            <Badge tom={row.visibility === "visivel" ? "neutro" : "contorno"}>
              {row.visibility === "visivel" ? "visível" : "oculto"}
            </Badge>
            {row.visibility === "visivel" ? (
              <Link
                href={`/flashcards/turma/${row.id}`}
                className="hover:text-primary min-w-0 flex-1 truncate text-sm font-medium"
              >
                {row.title}
              </Link>
            ) : (
              <span className="text-ink-muted min-w-0 flex-1 truncate text-sm font-medium">
                {row.title}
              </span>
            )}
            <span className="text-ink-faint text-xs">{row.discipline}</span>
            <span className="text-ink-faint text-xs">{row.author ?? "sem nome"}</span>
            <span className="text-ink-faint text-xs tabular-nums">{row.cards} cartões</span>
            <time dateTime={row.updatedAt} className="text-ink-faint text-xs tabular-nums">
              {new Date(row.updatedAt).toLocaleDateString("pt-BR")}
            </time>
            <Button
              variant="fantasma"
              size="sm"
              disabled={ocupado === row.id}
              onClick={() =>
                void agir(row.id, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    visibility: row.visibility === "visivel" ? "oculto" : "visivel",
                  }),
                })
              }
            >
              {row.visibility === "visivel" ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
              {row.visibility === "visivel" ? "Ocultar" : "Mostrar"}
            </Button>
            {confirmar === row.id ? (
              <>
                <Button
                  variant="perigo"
                  size="sm"
                  disabled={ocupado === row.id}
                  onClick={() => void agir(row.id, { method: "DELETE" })}
                >
                  Excluir de vez
                </Button>
                <Button variant="fantasma" size="sm" onClick={() => setConfirmar(null)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button variant="perigo" size="sm" onClick={() => setConfirmar(row.id)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Excluir
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
