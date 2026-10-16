"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button, Field, Notice, Select, Textarea, inputClass } from "@/components/ui/primitives";
import { Uploader, type UploadedFile } from "./uploader";

/**
 * Publicar um resumo.
 *
 * O formulário acompanha o tipo: uma aula pede número e data, um problema
 * de tutoria pede número e as datas de abertura e fechamento, um resumo de
 * ciclo pede só para que prova ele é. Mostrar os três conjuntos ao mesmo
 * tempo seria pedir que quem publica adivinhe quais ignorar.
 *
 * Os eixos são o campo que faz o resumo valer mais que um PDF numa pasta:
 * é por eles que um erro no simulado vira "leia este resumo".
 */

export interface SummaryRef {
  readonly id: string;
  readonly name: string;
}

export interface AssessmentRef {
  readonly id: string;
  readonly disciplineId: string;
  readonly label: string;
}

export interface AreaRef {
  readonly id: string;
  readonly label: string;
  readonly axes: readonly { readonly id: string; readonly label: string }[];
}

type Kind = "aula" | "problema" | "ciclo";

const tipos: { readonly value: Kind; readonly label: string; readonly hint: string }[] = [
  { value: "aula", label: "Aula", hint: "Um encontro, com número e data." },
  { value: "problema", label: "Problema", hint: "A unidade das matérias em tutoria." },
  { value: "ciclo", label: "Ciclo", hint: "O apanhado de uma prova inteira." },
];

export function SummaryForm({
  disciplines,
  assessments,
  areas,
}: {
  readonly disciplines: readonly SummaryRef[];
  readonly assessments: readonly AssessmentRef[];
  readonly areas: readonly AreaRef[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [kind, setKind] = useState<Kind>("aula");
  const [disciplineId, setDisciplineId] = useState(disciplines[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [topics, setTopics] = useState("");
  const [pages, setPages] = useState("");
  const [source, setSource] = useState("");
  const [lesson, setLesson] = useState("");
  const [date, setDate] = useState("");
  const [meeting, setMeeting] = useState("");
  const [problem, setProblem] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [cycleLabel, setCycleLabel] = useState("");
  const [axisIds, setAxisIds] = useState<string[]>([]);
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const [assessmentIds, setAssessmentIds] = useState<string[]>([]);
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "enviando" } | { kind: "erro"; message: string } | { kind: "ok" }
  >({ kind: "idle" });

  const daMateria = assessments.filter((a) => a.disciplineId === disciplineId);

  const alternar = (lista: string[], valor: string, set: (next: string[]) => void) =>
    set(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);

  const submit = async () => {
    if (!file) {
      setStatus({ kind: "erro", message: "Envie o PDF antes de salvar." });
      return;
    }
    setStatus({ kind: "enviando" });

    const response = await fetch("/api/admin/resumos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        disciplineId,
        title,
        topics: topics
          .split("\n")
          .map((linha) => linha.trim())
          .filter(Boolean),
        areaIds,
        axisIds,
        assessmentIds,
        file: { fileName: file.fileName, sizeBytes: file.sizeBytes },
        pages: Number(pages),
        source: source || undefined,
        ...(kind === "aula"
          ? { lesson: Number(lesson), date, meeting: meeting ? Number(meeting) : undefined }
          : {}),
        ...(kind === "problema"
          ? {
              problem: Number(problem),
              opensAt: opensAt || undefined,
              closesAt: closesAt || undefined,
            }
          : {}),
        ...(kind === "ciclo" ? { cycleLabel } : {}),
      }),
    });

    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setStatus({ kind: "erro", message: body.error ?? "Não foi possível salvar." });
      return;
    }

    setStatus({ kind: "ok" });
    router.refresh();
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setTopics("");
    setPages("");
    setSource("");
    setLesson("");
    setDate("");
    setMeeting("");
    setProblem("");
    setOpensAt("");
    setClosesAt("");
    setCycleLabel("");
    setAxisIds([]);
    setAreaIds([]);
    setAssessmentIds([]);
    setStatus({ kind: "idle" });
  };

  if (status.kind === "ok") {
    return (
      <div className="space-y-4">
        <Notice tone="ok">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Resumo publicado. A turma já o vê em /resumos.
          </span>
        </Notice>
        <Button variant="secundario" size="sm" onClick={reset}>
          Publicar outro
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Uploader
        idPrefix="resumo"
        folder="resumos"
        label="Escolher o PDF do resumo"
        onUploaded={setFile}
        onReset={() => setFile(null)}
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Tipo de resumo</legend>
        <div className="flex flex-wrap gap-2">
          {tipos.map((tipo) => (
            <label
              key={tipo.value}
              className={`rounded-control cursor-pointer border px-3 py-2 text-sm ${
                kind === tipo.value ? "border-primary bg-primary/10" : "border-line"
              }`}
            >
              <input
                type="radio"
                name="tipo-de-resumo"
                className="sr-only"
                checked={kind === tipo.value}
                onChange={() => setKind(tipo.value)}
              />
              <span className="font-medium">{tipo.label}</span>
              <span className="text-ink-faint block text-xs">{tipo.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Matéria" htmlFor="resumo-materia" required>
          <Select
            id="resumo-materia"
            value={disciplineId}
            onChange={(e) => {
              setDisciplineId(e.target.value);
              setAssessmentIds([]);
            }}
          >
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Páginas do PDF" htmlFor="resumo-paginas" required>
          <input
            id="resumo-paginas"
            className={inputClass}
            inputMode="numeric"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="7"
          />
        </Field>
      </div>

      <Field label="Título" htmlFor="resumo-titulo" required>
        <input
          id="resumo-titulo"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tecido nervoso I + Músculos do MI"
        />
      </Field>

      {kind === "aula" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Número da aula" htmlFor="resumo-aula" required>
            <input
              id="resumo-aula"
              className={inputClass}
              inputMode="numeric"
              value={lesson}
              onChange={(e) => setLesson(e.target.value)}
            />
          </Field>
          <Field label="Data da aula" htmlFor="resumo-data" required>
            <input
              id="resumo-data"
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field
            label="Encontro"
            htmlFor="resumo-encontro"
            hint="Opcional — quando o cronograma numera os encontros à parte."
          >
            <input
              id="resumo-encontro"
              className={inputClass}
              inputMode="numeric"
              value={meeting}
              onChange={(e) => setMeeting(e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {kind === "problema" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Número do problema" htmlFor="resumo-problema" required>
            <input
              id="resumo-problema"
              className={inputClass}
              inputMode="numeric"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            />
          </Field>
          <Field label="Abertura da tutoria" htmlFor="resumo-abertura" hint="Opcional.">
            <input
              id="resumo-abertura"
              type="date"
              className={inputClass}
              value={opensAt}
              onChange={(e) => setOpensAt(e.target.value)}
            />
          </Field>
          <Field label="Fechamento" htmlFor="resumo-fechamento" hint="Opcional.">
            <input
              id="resumo-fechamento"
              type="date"
              className={inputClass}
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {kind === "ciclo" ? (
        <Field
          label="Para que avaliação"
          htmlFor="resumo-ciclo"
          required
          hint="Como a turma chama: N1, N2, ARA."
        >
          <input
            id="resumo-ciclo"
            className={inputClass}
            value={cycleLabel}
            onChange={(e) => setCycleLabel(e.target.value)}
            placeholder="N2"
          />
        </Field>
      ) : null}

      <Field
        label="O que o resumo cobre"
        htmlFor="resumo-topicos"
        hint="Um tema por linha, como o próprio resumo se divide."
      >
        <Textarea
          id="resumo-topicos"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          rows={5}
          placeholder={
            "Histologia: tecido nervoso — neurônio, glia, cérebro e cerebelo.\nAnatomia clínica: miologia do membro inferior I."
          }
        />
      </Field>

      {daMateria.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-medium">Cai em quais avaliações</legend>
          <p className="text-ink-faint mt-0.5 mb-2 text-xs">
            O cartão da prova no calendário leva ao resumo escrito para ela.
          </p>
          <div className="flex flex-wrap gap-2">
            {daMateria.map((a) => (
              <Marca
                key={a.id}
                label={a.label}
                checked={assessmentIds.includes(a.id)}
                onChange={() => alternar(assessmentIds, a.id, setAssessmentIds)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="text-sm font-medium">Eixos do banco de questões</legend>
        <p className="text-ink-faint mt-0.5 mb-2 text-xs">
          É por aqui que um erro no simulado passa a apontar para este resumo. Marque só o que ele
          realmente explica.
        </p>
        <div className="space-y-3">
          {areas.map((area) => (
            <div key={area.id}>
              <Marca
                label={`Área: ${area.label}`}
                checked={areaIds.includes(area.id)}
                onChange={() => alternar(areaIds, area.id, setAreaIds)}
              />
              <div className="mt-2 ml-4 flex flex-wrap gap-2">
                {area.axes.map((axis) => (
                  <Marca
                    key={axis.id}
                    label={axis.label}
                    checked={axisIds.includes(axis.id)}
                    onChange={() => alternar(axisIds, axis.id, setAxisIds)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <Field
        label="Procedência"
        htmlFor="resumo-origem"
        hint="De onde veio o conteúdo — a aula, a tutoria, os livros consultados."
      >
        <input
          id="resumo-origem"
          className={inputClass}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Resumo da turma, a partir da aula de 18/11/2026 (encontro 30)."
        />
      </Field>

      {status.kind === "erro" ? <Notice tone="erro">{status.message}</Notice> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={status.kind === "enviando"}>
          {status.kind === "enviando" ? "Publicando…" : "Publicar resumo"}
        </Button>
        <Button type="button" variant="fantasma" onClick={reset}>
          Limpar
        </Button>
      </div>
    </form>
  );
}

function Marca({
  label,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: () => void;
}) {
  return (
    <label
      className={`rounded-control inline-flex cursor-pointer items-center gap-2 border px-2.5 py-1.5 text-xs ${
        checked ? "border-primary bg-primary/10" : "border-line text-ink-muted"
      }`}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
