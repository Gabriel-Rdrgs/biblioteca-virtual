"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motifPalettes } from "@/components/book/cover-motifs";
import type { CoverMotif } from "@/lib/domain/types";
import { Button, ButtonAnchor, Field, Notice, inputClass } from "@/components/ui/primitives";
import { Uploader, type UploadedFile } from "./uploader";

/**
 * Creates a discipline. The syllabus is typed as plain text — one unit per
 * paragraph, first line the unit title, following lines its items — and
 * parsed here, which is friendlier than a dozen dynamic inputs.
 */

const motifs = Object.keys(motifPalettes) as CoverMotif[];

const suggestedColors: { color: string; soft: string; label: string }[] = [
  { color: "#0f5563", soft: "#e0eef1", label: "petróleo" },
  { color: "#1f5f8b", soft: "#e2eef5", label: "azul" },
  { color: "#4a7a54", soft: "#e6efe8", label: "verde" },
  { color: "#5b4b8a", soft: "#eae6f4", label: "violeta" },
  { color: "#8a5a1e", soft: "#f6ecdf", label: "ocre" },
  { color: "#9c4a35", soft: "#f6e6e1", label: "terracota" },
  { color: "#7b3f62", soft: "#f2e5ed", label: "ameixa" },
  { color: "#2f6b6d", soft: "#e1efef", label: "verde-água" },
];

export function parseSyllabus(text: string): { title: string; items: string[] }[] {
  return text
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0)
    .map(([title, ...items]) => ({ title: title ?? "", items }));
}

export function DisciplineForm({ defaultSemester }: { defaultSemester: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [code, setCode] = useState("");
  const [period, setPeriod] = useState("2");
  const [semester, setSemester] = useState(defaultSemester);
  const [workload, setWorkload] = useState("");
  const [weekly, setWeekly] = useState("");
  const [description, setDescription] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [teachers, setTeachers] = useState("");
  const [palette, setPalette] = useState(0);
  const [motif, setMotif] = useState<CoverMotif>("anatomia");
  const [plan, setPlan] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "enviando" }
    | { kind: "erro"; message: string }
    | { kind: "ok"; slug: string }
  >({ kind: "idle" });

  const submit = async () => {
    setStatus({ kind: "enviando" });
    const chosen = suggestedColors[palette] ?? suggestedColors[0]!;
    const response = await fetch("/api/admin/materias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        shortName,
        code: code || undefined,
        period: Number(period),
        semester,
        workload: workload || undefined,
        weeklyWorkload: weekly || undefined,
        description,
        syllabus: parseSyllabus(syllabus),
        teachers: teachers
          .split(/;|\n/)
          .map((t) => t.trim())
          .filter(Boolean),
        color: chosen.color,
        colorSoft: chosen.soft,
        motif,
        plan: plan
          ? { fileName: plan.fileName, sizeBytes: plan.sizeBytes, originalName: plan.originalName }
          : undefined,
      }),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string; slug?: string };
    if (!response.ok) {
      setStatus({ kind: "erro", message: body.error ?? "Não foi possível salvar." });
      return;
    }
    setStatus({ kind: "ok", slug: body.slug ?? "" });
    router.refresh();
  };

  if (status.kind === "ok") {
    return (
      <div className="space-y-4">
        <Notice tone="ok">Matéria criada. Já aparece para a turma.</Notice>
        <div className="flex gap-3">
          <ButtonAnchor href={`/disciplinas/${status.slug}`} size="sm">
            Abrir a matéria
          </ButtonAnchor>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="glass rounded-full px-4 py-2 text-sm font-medium"
          >
            Cadastrar outra
          </button>
        </div>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="md-name" required className="sm:col-span-2">
          <input
            id="md-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
          />
        </Field>
        <Field label="Sigla" htmlFor="md-short" required hint="Ex.: MAC II">
          <input
            id="md-short"
            className={inputClass}
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            required
            minLength={2}
          />
        </Field>
        <Field label="Código da turma" htmlFor="md-code">
          <input
            id="md-code"
            className={inputClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </Field>
        <Field label="Período" htmlFor="md-period" required>
          <select
            id="md-period"
            className={inputClass}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                {p}º período
              </option>
            ))}
          </select>
        </Field>
        <Field label="Semestre letivo" htmlFor="md-semester" required hint="Formato 2027.1">
          <input
            id="md-semester"
            className={inputClass}
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
            pattern="\d{4}\.[12]"
          />
        </Field>
        <Field label="Carga horária total" htmlFor="md-workload" hint="Ex.: 80h">
          <input
            id="md-workload"
            className={inputClass}
            value={workload}
            onChange={(e) => setWorkload(e.target.value)}
          />
        </Field>
        <Field label="Carga semanal" htmlFor="md-weekly" hint="Ex.: 4h">
          <input
            id="md-weekly"
            className={inputClass}
            value={weekly}
            onChange={(e) => setWeekly(e.target.value)}
          />
        </Field>
        <Field label="Ementa" htmlFor="md-desc" required className="sm:col-span-2">
          <textarea
            id="md-desc"
            className={inputClass}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={20}
          />
        </Field>
        <Field
          label="Conteúdos"
          htmlFor="md-syllabus"
          hint="Um bloco por unidade, separado por linha em branco: primeira linha é o título da unidade, as seguintes são os itens."
          className="sm:col-span-2"
        >
          <textarea
            id="md-syllabus"
            className={inputClass}
            rows={8}
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            placeholder={
              "Unidade I — Sistema cardiovascular\nAnatomia do coração\nCiclo cardíaco\n\nUnidade II — Sistema respiratório\nVias aéreas\nMecânica ventilatória"
            }
          />
        </Field>
        <Field
          label="Docentes"
          htmlFor="md-teachers"
          hint="Um por linha ou separados por ponto e vírgula."
          className="sm:col-span-2"
        >
          <textarea
            id="md-teachers"
            className={inputClass}
            rows={2}
            value={teachers}
            onChange={(e) => setTeachers(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-medium">Cor</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedColors.map((c, i) => (
              <button
                key={c.color}
                type="button"
                onClick={() => setPalette(i)}
                aria-pressed={palette === i}
                aria-label={c.label}
                title={c.label}
                className={`size-8 rounded-full border-2 transition-transform ${palette === i ? "border-ink scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        </fieldset>
        <Field
          label="Ilustração das capas"
          htmlFor="md-motif"
          hint="Família visual usada nas capas geradas."
        >
          <select
            id="md-motif"
            className={inputClass}
            value={motif}
            onChange={(e) => setMotif(e.target.value as CoverMotif)}
          >
            {motifs.map((m) => (
              <option key={m} value={m}>
                {motifPalettes[m].label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Plano de ensino (PDF, opcional)</p>
        <Uploader
          idPrefix="md-plano"
          folder="planos"
          label="Escolher o plano de ensino"
          onUploaded={setPlan}
          onReset={() => setPlan(null)}
        />
      </div>

      {status.kind === "erro" ? <Notice tone="erro">{status.message}</Notice> : null}

      <Button type="submit" disabled={status.kind === "enviando"}>
        {status.kind === "enviando" ? "Salvando…" : "Criar matéria"}
      </Button>
    </form>
  );
}
