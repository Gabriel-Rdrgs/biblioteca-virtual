"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  assessmentLabel,
  countdownLabel,
  daysUntil,
  formatAssessmentDate,
  type Assessment,
} from "@/lib/domain/assessment-types";
import { Field, Notice, inputClass } from "./fields";

/**
 * The exam calendar, managed by hand.
 *
 * Dates are not in the teaching plans and they move during the term, so
 * this is the one part of the library that only a person can fill in. The
 * form stays small on purpose: date, matéria and what it covers are what
 * the class actually needs; everything else is optional.
 */

export interface AdminExamOption {
  readonly id: string;
  readonly title: string;
  readonly disciplineId: string;
}

export interface AdminDisciplineOption {
  readonly id: string;
  readonly name: string;
}

const KINDS = ["N1", "N2", "N3", "final", "substitutiva"] as const;

export function AssessmentManager({
  assessments,
  disciplines,
  exams,
}: {
  assessments: readonly Assessment[];
  disciplines: readonly AdminDisciplineOption[];
  exams: readonly AdminExamOption[];
}) {
  const router = useRouter();
  const [disciplineId, setDisciplineId] = useState(disciplines[0]?.id ?? "");
  const [kind, setKind] = useState<string>("N1");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [room, setRoom] = useState("");
  const [weight, setWeight] = useState("");
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [examIds, setExamIds] = useState<string[]>([]);
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
    return response.ok;
  };

  const submit = async () => {
    const ok = await call(
      "/api/admin/provas",
      {
        method: "POST",
        body: JSON.stringify({
          disciplineId,
          kind,
          date,
          time: time || undefined,
          room: room || undefined,
          weight: weight || undefined,
          content: content
            .split("\n")
            .map((line) => line.replace(/^[-•*]\s*/, "").trim())
            .filter(Boolean),
          examIds,
          note: note || undefined,
        }),
      },
      "Data cadastrada.",
      "nova",
    );
    if (ok) {
      setDate("");
      setTime("");
      setRoom("");
      setContent("");
      setNote("");
      setExamIds([]);
    }
  };

  const forDiscipline = exams.filter((exam) => exam.disciplineId === disciplineId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <form
        className="glass space-y-4 rounded-3xl p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <h3 className="text-sm font-semibold">Nova data de prova</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Matéria" htmlFor="pr-mat" required>
            <select
              id="pr-mat"
              className={inputClass}
              value={disciplineId}
              onChange={(event) => {
                setDisciplineId(event.target.value);
                setExamIds([]);
              }}
            >
              {disciplines.map((discipline) => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Avaliação" htmlFor="pr-kind" required>
            <select
              id="pr-kind"
              className={inputClass}
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Data" htmlFor="pr-date" required>
            <input
              id="pr-date"
              type="date"
              className={inputClass}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </Field>
          <Field label="Horário" htmlFor="pr-time" hint="Opcional">
            <input
              id="pr-time"
              type="time"
              className={inputClass}
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </Field>
          <Field label="Sala" htmlFor="pr-room" hint="Opcional">
            <input
              id="pr-room"
              className={inputClass}
              value={room}
              onChange={(event) => setRoom(event.target.value)}
            />
          </Field>
          <Field label="Quanto vale" htmlFor="pr-weight" hint="Ex.: 6,0">
            <input
              id="pr-weight"
              className={inputClass}
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </Field>
        </div>

        <Field label="O que cai" htmlFor="pr-content" hint="Um assunto por linha.">
          <textarea
            id="pr-content"
            rows={4}
            className={inputClass}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={"Anatomia: crânio e coluna\nParasitologia: protozoários"}
          />
        </Field>

        {forDiscipline.length > 0 ? (
          <fieldset>
            <legend className="text-sm font-medium">Simulados para treinar</legend>
            <ul className="mt-2 space-y-1.5">
              {forDiscipline.map((exam) => (
                <li key={exam.id}>
                  <label className="flex gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      className="accent-primary mt-0.5 size-4"
                      checked={examIds.includes(exam.id)}
                      onChange={(event) =>
                        setExamIds((current) =>
                          event.target.checked
                            ? [...current, exam.id]
                            : current.filter((id) => id !== exam.id),
                        )
                      }
                    />
                    <span>{exam.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}

        <Field label="Observação" htmlFor="pr-note" hint="Opcional">
          <input
            id="pr-note"
            className={inputClass}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>

        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

        <button
          type="submit"
          disabled={busy === "nova" || !date}
          className="bg-primary text-on-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <CalendarPlus className="size-4" aria-hidden="true" />
          {busy === "nova" ? "Salvando…" : "Cadastrar data"}
        </button>
      </form>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Datas do semestre</h3>
        <p className="text-ink-muted mb-3 text-xs leading-relaxed">
          As marcadas como “do plano” vieram dos cronogramas dos planos de ensino. Elas podem ser
          ocultadas, mas não excluídas — o plano continua dizendo o que diz.
        </p>
        {assessments.length === 0 ? (
          <p className="text-ink-muted glass rounded-2xl p-4 text-sm">Nenhuma data.</p>
        ) : (
          <ul className="divide-line border-line divide-y rounded-2xl border">
            {assessments.map((assessment) => {
              const left = daysUntil(assessment.date);
              return (
                <li
                  key={assessment.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <strong className="font-medium">{assessmentLabel(assessment)}</strong>
                      <span className="text-ink-muted">
                        {disciplines.find((d) => d.id === assessment.disciplineId)?.name ??
                          assessment.disciplineId}
                      </span>
                      <span className="text-ink-faint text-xs">
                        {formatAssessmentDate(assessment.date, true)} · {countdownLabel(left)}
                      </span>
                      {assessment.origin === "seed" ? (
                        <span className="glass-strong text-ink-muted rounded-full px-2 py-0.5 text-xs">
                          do plano
                        </span>
                      ) : null}
                      {assessment.visibility === "oculto" ? (
                        <span className="bg-surface-sunken text-ink-muted rounded-full px-2 py-0.5 text-xs">
                          oculta
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy === assessment.id}
                      onClick={() =>
                        void call(
                          `/api/admin/provas/${assessment.id}`,
                          {
                            method: "PATCH",
                            body: JSON.stringify({
                              visibility:
                                assessment.visibility === "visivel" ? "oculto" : "visivel",
                            }),
                          },
                          assessment.visibility === "visivel" ? "Data ocultada." : "Data visível.",
                          assessment.id,
                        )
                      }
                      className="border-line hover:border-line-strong inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      {assessment.visibility === "visivel" ? (
                        <>
                          <EyeOff className="size-3.5" aria-hidden="true" /> Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5" aria-hidden="true" /> Mostrar
                        </>
                      )}
                    </button>
                    {assessment.origin === "admin" ? (
                      <button
                        type="button"
                        disabled={busy === assessment.id}
                        onClick={() => {
                          if (window.confirm(`Excluir a data de ${assessmentLabel(assessment)}?`)) {
                            void call(
                              `/api/admin/provas/${assessment.id}`,
                              { method: "DELETE" },
                              "Data excluída.",
                              assessment.id,
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
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
