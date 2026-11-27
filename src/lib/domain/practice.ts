/**
 * A prova prática de MAC I (N2): estações com uma figura — peça do Netter,
 * esquema do Moore, lâmina do Gartner ou o modelo do laboratório — e duas
 * questões cada.
 *
 * O simulado segue o formato da prova: dez estações, alternando Anatomia com
 * Embriologia/Histologia; em cada questão, primeiro a leitura (não dá para
 * responder) e depois o tempo de resposta. Errou ou acabou o tempo, aparece
 * o gabarito comentado.
 *
 * Os dados vieram do simulador que a turma usava (um artifact), extraídos
 * para o Atlas; ver scripts/pratica.
 */

export type PracticeArea = "anatomia" | "embriologia" | "histologia";

export const AREA_LABELS: Record<PracticeArea, string> = {
  anatomia: "Anatomia",
  embriologia: "Embriologia",
  histologia: "Histologia",
};

export interface PracticeFigure {
  /** Arquivo em storage/flashcards, servido atrás da senha. */
  readonly file: string;
  readonly width: number;
  readonly height: number;
  readonly source: string;
  readonly ref: string;
  readonly caption: string;
  readonly topics: readonly string[];
  /** Gabarito dos números impressos na figura, na ordem. */
  readonly key: readonly string[];
  /** Figura com seta: a lâmina original de onde ela foi tirada. */
  readonly arrowOf?: string;
  /** Foto do modelo: pontos numerados sobrepostos (em % da largura e da altura). */
  readonly points?: Readonly<Record<string, { readonly x: number; readonly y: number; readonly label: string }>>;
}

export interface ChoiceQuestion {
  readonly type: "mc";
  readonly q: string;
  readonly options: readonly string[];
  /** Índice da certa em `options`. */
  readonly answer: number;
  readonly why?: string | null;
  readonly model?: string | null;
  /** Outra figura para esta questão (a lâmina com a seta). */
  readonly figure?: string;
  /** Onde está o número perguntado, para circular: [x, y, largura, altura] em %. */
  readonly box?: readonly number[];
}

export interface OpenQuestion {
  readonly type: "open";
  readonly q: string;
  /** Resposta-modelo: a pessoa compara e marca se acertou. */
  readonly model: string;
  readonly figure?: string;
}

export type PracticeQuestion = ChoiceQuestion | OpenQuestion;

export interface PracticeStation {
  readonly id: string;
  readonly area: PracticeArea;
  readonly topic: string;
  readonly figure: string;
  readonly context: string;
  /** Na foto do modelo: quais pontos numerar, na ordem. */
  readonly points?: readonly string[];
  readonly questions: readonly PracticeQuestion[];
}

export interface PracticeTopic {
  readonly id: string;
  readonly area: PracticeArea;
  readonly region?: string | null;
  readonly title: string;
  readonly schema: string;
  readonly five: {
    readonly identification: string;
    readonly location: string;
    readonly function: string;
    readonly origin: string;
    readonly clinical: string;
  };
  readonly asks: readonly string[];
  readonly model: string;
  readonly memo: string;
  readonly review: readonly { readonly q: string; readonly a: string }[];
  readonly traps: readonly string[];
}

export interface BankQuestion {
  readonly area: PracticeArea;
  readonly topic: string;
  readonly q: string;
  readonly a: string;
  readonly why: string;
  readonly trap: string;
}

export interface ReasoningChain {
  readonly title: string;
  readonly area: PracticeArea;
  readonly steps: readonly { readonly name: string; readonly text: string; readonly figure: string }[];
}

export interface PracticeData {
  readonly title: string;
  readonly case: readonly string[];
  readonly figures: Readonly<Record<string, PracticeFigure>>;
  readonly topics: readonly PracticeTopic[];
  readonly stations: readonly PracticeStation[];
  readonly bank: readonly BankQuestion[];
  readonly chains: readonly ReasoningChain[];
}

/* -------------------------------------------------------- o simulado */

export const STATIONS_PER_EXAM = 10;

/** Tempo real da prova: 1:30 de leitura + 1:30 de resposta. Treino rápido: 0:30 + 1:00. */
export function timings(fast: boolean): { read: number; answer: number } {
  return fast ? { read: 30, answer: 60 } : { read: 90, answer: 90 };
}

export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * Monta as dez estações como na prova: cinco de Anatomia, alternando com
 * cinco de Embriologia/Histologia (duas de cada e uma quinta de qualquer
 * das duas). Nenhuma estação se repete.
 */
export function buildExam(
  stations: readonly PracticeStation[],
  random: () => number = Math.random,
): PracticeStation[] {
  const anatomy = shuffled(
    stations.filter((s) => s.area === "anatomia"),
    random,
  ).slice(0, 5);
  const embryo = shuffled(
    stations.filter((s) => s.area === "embriologia"),
    random,
  );
  const histo = shuffled(
    stations.filter((s) => s.area === "histologia"),
    random,
  );
  const fifth = shuffled([...embryo.slice(2), ...histo.slice(2)], random)[0];
  const other = shuffled(
    [embryo[0], embryo[1], histo[0], histo[1], fifth].filter((s): s is PracticeStation => !!s),
    random,
  );
  const exam: PracticeStation[] = [];
  for (let i = 0; i < 5; i++) {
    const a = anatomy[i];
    const b = other[i];
    if (a) exam.push(a);
    if (b) exam.push(b);
  }
  return exam;
}

/** Uma resposta do simulado; `ok` nulo é a aberta ainda não autoavaliada. */
export interface ExamAnswer {
  readonly stationId: string;
  readonly topic: string;
  readonly area: PracticeArea;
  readonly q: string;
  readonly answer: string;
  readonly ok: boolean | null;
  readonly figure: string;
}

export interface TopicScore {
  readonly topic: string;
  readonly correct: number;
  readonly total: number;
}

export function scoreByTopic(answers: readonly ExamAnswer[]): TopicScore[] {
  const map = new Map<string, { correct: number; total: number }>();
  for (const a of answers) {
    const entry = map.get(a.topic) ?? { correct: 0, total: 0 };
    entry.total++;
    if (a.ok) entry.correct++;
    map.set(a.topic, entry);
  }
  return [...map.entries()].map(([topic, v]) => ({ topic, ...v }));
}

/** Temas abaixo de 70% neste simulado: o que revisar primeiro. */
export function weakTopics(answers: readonly ExamAnswer[]): string[] {
  return scoreByTopic(answers)
    .filter((t) => t.correct / t.total < 0.7)
    .map((t) => t.topic);
}
