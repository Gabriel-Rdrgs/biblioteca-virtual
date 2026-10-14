"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DisciplineRef } from "@/lib/domain/types";
import { bibliographyLabels } from "@/components/book/book-badge";
import { ProvenanceFields } from "./fields";
import { Button, ButtonAnchor, Field, Notice, inputClass } from "@/components/ui/primitives";
import { Uploader, type UploadedFile } from "./uploader";

/**
 * Publishes a new book: PDF first, then the record. Validation happens on
 * the server (Zod); this form only keeps the obvious mistakes from a round
 * trip and shows whatever the server answers.
 */

const bibliographyTypes = [
  "acervo_da_turma",
  "basica",
  "basica_virtual",
  "complementar",
  "outras_referencias",
] as const;

const defaultProvenance = {
  origin: "",
  authorization: "",
  note: "",
};

export function NewBookForm({ disciplines }: { disciplines: readonly DisciplineRef[] }) {
  const router = useRouter();
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [publisher, setPublisher] = useState("");
  const [year, setYear] = useState("");
  const [edition, setEdition] = useState("");
  const [isbn, setIsbn] = useState("");
  const [topics, setTopics] = useState("");
  const [disciplineIds, setDisciplineIds] = useState<string[]>([]);
  const [bibliographyType, setBibliographyType] =
    useState<(typeof bibliographyTypes)[number]>("acervo_da_turma");
  const [provenance, setProvenance] = useState(defaultProvenance);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "enviando" }
    | { kind: "erro"; message: string; needsConfirmation?: boolean }
    | { kind: "ok"; slug: string }
  >({ kind: "idle" });

  const splitList = (value: string) =>
    value
      .split(/;|\n/)
      .map((s) => s.trim())
      .filter(Boolean);

  const submit = async (confirmDuplicate = false) => {
    if (!file) {
      setStatus({ kind: "erro", message: "Envie o PDF antes de salvar." });
      return;
    }
    setStatus({ kind: "enviando" });

    const response = await fetch("/api/admin/livros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        subtitle: subtitle || undefined,
        authors: splitList(authors),
        publisher: publisher || undefined,
        publicationYear: year ? Number(year) : undefined,
        edition: edition || undefined,
        isbn: isbn || undefined,
        topics: splitList(topics.replace(/,/g, ";")),
        disciplineIds,
        bibliographyType,
        file: { fileName: file.fileName, sizeBytes: file.sizeBytes },
        fileMeta: {
          origin: provenance.origin,
          authorization: provenance.authorization,
          note: provenance.note || undefined,
        },
        confirmDuplicate,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      slug?: string;
      needsConfirmation?: boolean;
    };

    if (!response.ok) {
      setStatus({
        kind: "erro",
        message: body.error ?? "Não foi possível salvar.",
        needsConfirmation: body.needsConfirmation,
      });
      return;
    }

    setStatus({ kind: "ok", slug: body.slug ?? "" });
    router.refresh();
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setSubtitle("");
    setAuthors("");
    setPublisher("");
    setYear("");
    setEdition("");
    setIsbn("");
    setTopics("");
    setDisciplineIds([]);
    setBibliographyType("acervo_da_turma");
    setProvenance(defaultProvenance);
    setStatus({ kind: "idle" });
  };

  if (status.kind === "ok") {
    return (
      <div className="space-y-4">
        <Notice tone="ok">Livro publicado. Já aparece no catálogo da turma.</Notice>
        <div className="flex gap-3">
          <ButtonAnchor href={`/livros/${status.slug}`} size="sm">
            Abrir a página do livro
          </ButtonAnchor>
          <button
            type="button"
            onClick={reset}
            className="border-line rounded-control border px-4 py-2 text-sm font-medium"
          >
            Cadastrar outro
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(false);
      }}
    >
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">1. Arquivo</h3>
        <Uploader idPrefix="novo" onUploaded={setFile} onReset={() => setFile(null)} />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">2. Ficha do livro</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" htmlFor="nb-title" required className="sm:col-span-2">
            <input
              id="nb-title"
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
            />
          </Field>
          <Field label="Subtítulo" htmlFor="nb-subtitle" className="sm:col-span-2">
            <input
              id="nb-subtitle"
              className={inputClass}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </Field>
          <Field
            label="Autores"
            htmlFor="nb-authors"
            required
            hint="Um por linha ou separados por ponto e vírgula. Formato: SOBRENOME, Nome."
            className="sm:col-span-2"
          >
            <textarea
              id="nb-authors"
              className={inputClass}
              rows={2}
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              required
            />
          </Field>
          <Field label="Editora" htmlFor="nb-publisher">
            <input
              id="nb-publisher"
              className={inputClass}
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
          </Field>
          <Field label="Ano" htmlFor="nb-year">
            <input
              id="nb-year"
              className={inputClass}
              type="number"
              min={1800}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </Field>
          <Field label="Edição" htmlFor="nb-edition" hint="Ex.: 9. ed.">
            <input
              id="nb-edition"
              className={inputClass}
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
            />
          </Field>
          <Field label="ISBN" htmlFor="nb-isbn" hint="Evita cadastrar o mesmo livro duas vezes.">
            <input
              id="nb-isbn"
              className={inputClass}
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
            />
          </Field>
          <Field
            label="Temas"
            htmlFor="nb-topics"
            hint="Separados por vírgula. Ex.: anatomia, atlas"
            className="sm:col-span-2"
          >
            <input
              id="nb-topics"
              className={inputClass}
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">3. Disciplinas</h3>
        <fieldset>
          <legend className="sr-only">Disciplinas que usam este livro</legend>
          <ul className="grid gap-2 sm:grid-cols-2">
            {disciplines.map((discipline) => (
              <li key={discipline.id} className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id={`nb-disc-${discipline.id}`}
                  checked={disciplineIds.includes(discipline.id)}
                  onChange={(e) =>
                    setDisciplineIds((ids) =>
                      e.target.checked
                        ? [...ids, discipline.id]
                        : ids.filter((x) => x !== discipline.id),
                    )
                  }
                  className="size-4 accent-[var(--primary)]"
                />
                <label
                  htmlFor={`nb-disc-${discipline.id}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: discipline.color }}
                    aria-hidden="true"
                  />
                  {discipline.name}
                  <span className="text-ink-faint">· {discipline.period}º</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <Field
          label="Tipo de bibliografia"
          htmlFor="nb-type"
          hint="“Acervo da turma” para livros que não estão no plano de ensino."
        >
          <select
            id="nb-type"
            className={inputClass}
            value={bibliographyType}
            onChange={(e) => setBibliographyType(e.target.value as typeof bibliographyType)}
          >
            {bibliographyTypes.map((type) => (
              <option key={type} value={type}>
                {bibliographyLabels[type]}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">4. Origem e autorização</h3>
        <ProvenanceFields idPrefix="nb" values={provenance} onChange={setProvenance} />
      </section>

      {status.kind === "erro" ? (
        <div className="space-y-2">
          <Notice tone={status.needsConfirmation ? "aviso" : "erro"}>{status.message}</Notice>
          {status.needsConfirmation ? (
            <button
              type="button"
              onClick={() => void submit(true)}
              className="border-accent text-accent rounded-control border px-4 py-2 text-sm font-medium"
            >
              Cadastrar mesmo assim
            </button>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" disabled={status.kind === "enviando" || !file}>
        {status.kind === "enviando" ? "Salvando…" : "Publicar livro"}
      </Button>
    </form>
  );
}
