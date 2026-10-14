"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileText, Trash2 } from "lucide-react";
import { periodLabel, type Visibility } from "@/lib/domain/types";
import { Notice } from "@/components/ui/primitives";

export interface AdminDisciplineRow {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly shortName: string;
  readonly period: number;
  readonly semester: string;
  readonly visibility: Visibility;
  readonly origin: "seed" | "admin";
  readonly hasPlan: boolean;
  readonly bookCount: number;
}

export function DisciplineTable({
  rows,
  currentPeriod,
}: {
  rows: readonly AdminDisciplineRow[];
  currentPeriod: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "erro" | "ok"; text: string } | null>(null);

  const call = async (url: string, init: RequestInit, okText: string, key: string) => {
    setBusy(key);
    setMessage(null);
    const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    setMessage(
      response.ok ? { tone: "ok", text: okText } : { tone: "erro", text: body.error ?? "Falha." },
    );
    if (response.ok) router.refresh();
  };

  const periods = [...new Set(rows.map((r) => r.period))].sort((a, b) => b - a);

  return (
    <div className="space-y-5">
      <div className="glass rounded-panel flex flex-wrap items-center gap-3 p-4">
        <label htmlFor="periodo-atual" className="text-sm font-medium">
          Período atual da turma
        </label>
        <select
          id="periodo-atual"
          value={currentPeriod}
          onChange={(e) =>
            void call(
              "/api/admin/materias",
              { method: "PATCH", body: JSON.stringify({ currentPeriod: Number(e.target.value) }) },
              `Período atual: ${periodLabel(Number(e.target.value))}.`,
              "periodo",
            )
          }
          className="border-line bg-surface rounded-full border px-3 py-1.5 text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
            <option key={p} value={p}>
              {periodLabel(p)}
            </option>
          ))}
        </select>
        <span className="text-ink-faint text-xs">
          É o que aparece primeiro na home e na estante.
        </span>
      </div>

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      {periods.map((period) => (
        <section key={period}>
          <h3 className="mb-2 text-sm font-semibold">
            {periodLabel(period)}
            {period === currentPeriod ? (
              <span className="text-primary ml-2 text-xs font-medium">atual</span>
            ) : null}
          </h3>
          <ul className="divide-line border-line rounded-panel divide-y border">
            {rows
              .filter((r) => r.period === period)
              .map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`/disciplinas/${row.slug}`}
                        className="hover:text-primary font-medium"
                      >
                        {row.name}
                      </a>
                      <span className="text-ink-faint text-xs">
                        {row.shortName} · {row.semester} · {row.bookCount}{" "}
                        {row.bookCount === 1 ? "livro" : "livros"}
                      </span>
                      {row.hasPlan ? (
                        <span className="text-primary inline-flex items-center gap-1 text-xs">
                          <FileText className="size-3" aria-hidden="true" /> plano
                        </span>
                      ) : null}
                      {row.visibility === "oculto" ? (
                        <span className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 text-xs">
                          oculta
                        </span>
                      ) : null}
                      {row.origin === "admin" ? (
                        <span className="bg-accent-soft text-accent rounded-full px-2 py-0.5 text-xs">
                          criada no admin
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy === row.id}
                      onClick={() =>
                        void call(
                          `/api/admin/materias/${row.id}`,
                          {
                            method: "PATCH",
                            body: JSON.stringify({
                              visibility: row.visibility === "visivel" ? "oculto" : "visivel",
                            }),
                          },
                          row.visibility === "visivel"
                            ? `“${row.name}” ocultada.`
                            : `“${row.name}” visível.`,
                          row.id,
                        )
                      }
                      className="border-line hover:border-line-strong inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      {row.visibility === "visivel" ? (
                        <>
                          <EyeOff className="size-3.5" aria-hidden="true" /> Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5" aria-hidden="true" /> Mostrar
                        </>
                      )}
                    </button>
                    {row.origin === "admin" ? (
                      <button
                        type="button"
                        disabled={busy === row.id}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Excluir “${row.name}”? Os vínculos com livros e o plano enviado também saem.`,
                            )
                          ) {
                            void call(
                              `/api/admin/materias/${row.id}`,
                              { method: "DELETE" },
                              `“${row.name}” excluída.`,
                              row.id,
                            );
                          }
                        }}
                        className="border-line text-danger hover:border-danger inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" /> Excluir
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
