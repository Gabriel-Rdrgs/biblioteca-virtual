/**
 * Os números do painel de desempenho, a partir do diário de estudo.
 *
 * Puro de propósito: o diário entra, os números saem, e o teste não precisa
 * de navegador. Os tipos de evento são repetidos aqui (em vez de importados
 * de study-log) para este arquivo não depender de nada do cliente.
 */

export interface StatEvent {
  readonly t: number;
  readonly mode: string;
  readonly ref: string;
  readonly ok: boolean;
  readonly group?: string;
  readonly groupLabel?: string;
  readonly axis?: string;
  readonly axisLabel?: string;
}

export interface Rate {
  readonly id: string;
  readonly label: string;
  readonly answered: number;
  readonly correct: number;
  readonly percent: number;
}

export interface DayBar {
  /** AAAA-MM-DD, no fuso de quem estuda. */
  readonly key: string;
  readonly label: string;
  readonly answered: number;
  readonly correct: number;
}

export interface StudyStats {
  readonly answered: number;
  readonly correct: number;
  readonly percent: number;
  /** Dias seguidos com algum estudo, terminando hoje (ou ontem). */
  readonly streak: number;
  readonly activeDays: number;
  readonly byMode: readonly Rate[];
  readonly byGroup: readonly Rate[];
  /** Eixos com ao menos três respostas, do pior para o melhor. */
  readonly weakest: readonly Rate[];
  readonly days: readonly DayBar[];
}

const MODE_LABELS: Record<string, string> = {
  rapido: "Modo rápido",
  imagem: "Simulado de imagem",
  flashcards: "Flashcards",
  simulado: "Simulado completo",
  anatomia: "Anatomia 3D",
};

export function modeLabel(mode: string): string {
  return MODE_LABELS[mode] ?? mode;
}

export function dayKey(t: number | Date): string {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function percent(correct: number, answered: number): number {
  return answered > 0 ? Math.round((correct / answered) * 100) : 0;
}

function tally(
  events: readonly StatEvent[],
  key: (e: StatEvent) => { id: string; label: string } | null,
): Rate[] {
  const map = new Map<string, { label: string; answered: number; correct: number }>();
  for (const event of events) {
    const k = key(event);
    if (!k) continue;
    const entry = map.get(k.id) ?? { label: k.label, answered: 0, correct: 0 };
    entry.answered++;
    if (event.ok) entry.correct++;
    map.set(k.id, entry);
  }
  return [...map.entries()].map(([id, v]) => ({
    id,
    label: v.label,
    answered: v.answered,
    correct: v.correct,
    percent: percent(v.correct, v.answered),
  }));
}

export function summariseStudy(
  events: readonly StatEvent[],
  now: Date,
  windowDays = 14,
): StudyStats {
  const correct = events.filter((e) => e.ok).length;

  const byMode = tally(events, (e) => ({ id: e.mode, label: modeLabel(e.mode) })).sort(
    (a, b) => b.answered - a.answered,
  );
  const byGroup = tally(events, (e) =>
    e.group ? { id: e.group, label: e.groupLabel ?? e.group } : null,
  ).sort((a, b) => b.answered - a.answered);

  // Uma resposta só sobre um eixo não diz nada; três já começam a dizer.
  const weakest = tally(events, (e) =>
    e.axis ? { id: e.axis, label: e.axisLabel ?? e.axis } : null,
  )
    .filter((r) => r.answered >= 3)
    .sort((a, b) => a.percent - b.percent || b.answered - a.answered);

  const perDay = new Map<string, { answered: number; correct: number }>();
  for (const event of events) {
    const key = dayKey(event.t);
    const entry = perDay.get(key) ?? { answered: 0, correct: 0 };
    entry.answered++;
    if (event.ok) entry.correct++;
    perDay.set(key, entry);
  }

  const days: DayBar[] = [];
  for (let back = windowDays - 1; back >= 0; back--) {
    const d = new Date(now);
    d.setDate(d.getDate() - back);
    const key = dayKey(d);
    const entry = perDay.get(key) ?? { answered: 0, correct: 0 };
    days.push({
      key,
      label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      ...entry,
    });
  }

  // A sequência pode terminar ontem: quem ainda não estudou hoje não a perde.
  let streak = 0;
  const cursor = new Date(now);
  if (!perDay.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (perDay.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    answered: events.length,
    correct,
    percent: percent(correct, events.length),
    streak,
    activeDays: perDay.size,
    byMode,
    byGroup,
    weakest,
    days,
  };
}
