"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileText, FileWarning, Trash2 } from "lucide-react";
import type { Visibility } from "@/lib/domain/types";
import { formatAuthors } from "@/lib/utils";
import { Notice, ProvenanceFields } from "./fields";
import { Uploader, type UploadedFile } from "./uploader";

export interface AdminBookRow {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly authors: readonly string[];
  readonly disciplines: readonly string[];
  readonly visibility: Visibility;
  readonly hasFile: boolean;
  readonly fileName?: string;
  readonly sizeBytes?: number;
  readonly pending: boolean;
  readonly fromPlan: boolean;
}

type Filter = "todos" | "com_pdf" | "sem_pdf" | "ocultos";

export function BookTable({ rows }: { rows: readonly AdminBookRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");
  const [attaching, setAttaching] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "erro" | "ok"; text: string } | null>(null);

  const visibleRows = rows.filter((row) => {
    if (filter === "com_pdf" && !row.hasFile) return false;
    if (filter === "sem_pdf" && row.hasFile) return false;
    if (filter === "ocultos" && row.visibility !== "oculto") return false;
    if (
      query &&
      !`${row.title} ${row.authors.join(" ")}`.toLowerCase().includes(query.toLowerCase())
    )
      return false;
    return true;
  });

  const call = async (id: string, init: RequestInit, okText: string, query = "") => {
    setBusy(id);
    setMessage(null);
    const response = await fetch(`/api/admin/livros/${id}${query}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setMessage({ tone: "erro", text: body.error ?? "Falha na operação." });
      return false;
    }
    setMessage({ tone: "ok", text: okText });
    router.refresh();
    return true;
  };

  const toggleVisibility = (row: AdminBookRow) =>
    call(
      row.id,
      {
        method: "PATCH",
        body: JSON.stringify({ visibility: row.visibility === "visivel" ? "oculto" : "visivel" }),
      },
      row.visibility === "visivel" ? `“${row.title}” ocultado.` : `“${row.title}” visível.`,
    );

  const deleteRecord = (row: AdminBookRow) => {
    if (!window.confirm(`Excluir o registro “${row.title}” e o PDF? Isso não pode ser desfeito.`))
      return;
    void call(row.id, { method: "DELETE" }, `“${row.title}” excluído.`, "?registro=1");
  };

  const removeFile = (row: AdminBookRow) => {
    if (!window.confirm(`Remover o PDF de “${row.title}”? O registro continua, oculto.`)) return;
    void call(row.id, { method: "DELETE" }, `PDF de “${row.title}” removido.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar por título ou autor…"
          aria-label="Filtrar livros"
          className="border-line bg-surface focus:border-primary min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <div className="flex gap-1" role="group" aria-label="Filtro">
          {(
            [
              ["todos", "Todos"],
              ["com_pdf", "Com PDF"],
              ["sem_pdf", "Sem PDF"],
              ["ocultos", "Ocultos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                filter === value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <p className="text-ink-muted text-sm">
        {visibleRows.length} de {rows.length} registros
      </p>

      <ul className="divide-line border-line divide-y rounded-md border">
        {visibleRows.map((row) => (
          <li key={row.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`/livros/${row.slug}`} className="hover:text-primary font-medium">
                    {row.title}
                  </a>
                  {row.hasFile ? (
                    <span className="text-primary inline-flex items-center gap-1 text-xs">
                      <FileText className="size-3.5" aria-hidden="true" />
                      PDF {row.sizeBytes ? `· ${(row.sizeBytes / 1048576).toFixed(0)} MB` : ""}
                    </span>
                  ) : (
                    <span className="text-ink-faint text-xs">sem PDF</span>
                  )}
                  {row.visibility === "oculto" ? (
                    <span className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 text-xs">
                      oculto
                    </span>
                  ) : null}
                  {row.pending ? (
                    <span className="bg-danger-soft text-danger inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                      <FileWarning className="size-3" aria-hidden="true" />
                      revisar
                    </span>
                  ) : null}
                  {!row.fromPlan ? (
                    <span className="bg-accent-soft text-accent rounded-full px-2 py-0.5 text-xs">
                      acervo da turma
                    </span>
                  ) : null}
                </div>
                <p className="text-ink-muted mt-0.5 text-sm">
                  {formatAuthors(row.authors)} · {row.disciplines.join(", ") || "sem disciplina"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void toggleVisibility(row)}
                  disabled={busy === row.id}
                  className="border-line hover:border-line-strong inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
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
                <button
                  type="button"
                  onClick={() => setAttaching(attaching === row.id ? null : row.id)}
                  className="border-line hover:border-line-strong inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium"
                >
                  <FileText className="size-3.5" aria-hidden="true" />
                  {row.hasFile ? "Substituir PDF" : "Anexar PDF"}
                </button>
                {!row.fromPlan ? (
                  <button
                    type="button"
                    onClick={() => deleteRecord(row)}
                    disabled={busy === row.id}
                    className="border-line text-danger hover:border-danger inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Excluir registro
                  </button>
                ) : null}
                {row.hasFile ? (
                  <button
                    type="button"
                    onClick={() => removeFile(row)}
                    disabled={busy === row.id}
                    className="border-line text-danger hover:border-danger inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Remover PDF
                  </button>
                ) : null}
              </div>
            </div>

            {attaching === row.id ? (
              <AttachPanel
                row={row}
                onDone={(text) => {
                  setAttaching(null);
                  setMessage({ tone: "ok", text });
                  router.refresh();
                }}
                onCancel={() => setAttaching(null)}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AttachPanel({
  row,
  onDone,
  onCancel,
}: {
  row: AdminBookRow;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [provenance, setProvenance] = useState({ origin: "", authorization: "", note: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!file) {
      setError("Envie o PDF primeiro.");
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/admin/livros/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: { fileName: file.fileName, sizeBytes: file.sizeBytes },
        fileMeta: {
          origin: provenance.origin,
          authorization: provenance.authorization,
          note: provenance.note || undefined,
        },
      }),
    });
    setSaving(false);
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Não foi possível anexar.");
      return;
    }
    onDone(`PDF anexado a “${row.title}”. O livro está visível.`);
  };

  return (
    <div className="border-line bg-surface-sunken mt-4 space-y-4 rounded-md border p-4">
      <p className="text-sm font-medium">
        {row.hasFile ? "Substituir o PDF de" : "Anexar PDF a"} “{row.title}”
      </p>
      <Uploader idPrefix={`att-${row.id}`} onUploaded={setFile} onReset={() => setFile(null)} />
      <ProvenanceFields idPrefix={`att-${row.id}`} values={provenance} onChange={setProvenance} />
      {error ? <Notice tone="erro">{error}</Notice> : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !file}
          className="bg-primary text-on-primary rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border-line rounded-md border px-4 py-2 text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
