"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Badge, Button } from "@/components/ui/primitives";

/**
 * O que já está publicado, com as duas ações que o painel precisa ter.
 *
 * Um resumo vindo das sementes só se oculta: ele está no código, e apagá-lo
 * do manifesto o traria de volta na próxima publicação. O botão diz isso em
 * vez de falhar depois de clicado.
 */

export interface AdminSummaryRow {
  readonly id: string;
  readonly slug: string;
  readonly label: string;
  readonly title: string;
  readonly discipline: string;
  readonly pages: number;
  readonly visibility: "visivel" | "oculto";
  readonly origin: "seed" | "admin";
}

export function SummaryTable({ rows }: { readonly rows: readonly AdminSummaryRow[] }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (rows.length === 0) {
    return <p className="text-ink-muted text-sm">Nenhum resumo publicado ainda.</p>;
  }

  const agir = async (id: string, init: RequestInit) => {
    setOcupado(id);
    setErro(null);
    const response = await fetch(`/api/admin/resumos/${id}`, init);
    setOcupado(null);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setErro(body.error ?? "Não foi possível concluir.");
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">Resumos publicados</h3>
        <span className="text-ink-faint text-xs tabular-nums">{rows.length}</span>
      </div>
      {erro ? <p className="text-danger mb-2 text-sm">{erro}</p> : null}
      <ul className="divide-line border-line rounded-card divide-y border">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
            <Badge tom={row.visibility === "visivel" ? "neutro" : "contorno"}>{row.label}</Badge>
            <Link
              href={`/resumos/${row.slug}`}
              className="hover:text-primary min-w-0 flex-1 truncate text-sm font-medium"
            >
              {row.title}
            </Link>
            <span className="text-ink-faint text-xs">{row.discipline}</span>
            <span className="text-ink-faint text-xs tabular-nums">{row.pages} p.</span>
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
            {row.origin === "admin" ? (
              <Button
                variant="perigo"
                size="sm"
                disabled={ocupado === row.id}
                onClick={() => void agir(row.id, { method: "DELETE" })}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Excluir
              </Button>
            ) : (
              <span className="text-ink-faint text-xs">das sementes</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
