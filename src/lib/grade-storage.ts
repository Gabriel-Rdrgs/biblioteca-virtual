/**
 * As notas que você anotou, neste aparelho.
 *
 * Mesmo arranjo das tentativas de simulado (`src/lib/exam-storage.ts`):
 * localStorage, com guarda de SSR e try/catch em volta de tudo — uma janela
 * anônima ou uma cota cheia não valem derrubar a página.
 *
 * A diferença é que a nota aparece em quatro lugares ao mesmo tempo — na
 * matéria, no cartão da prova, na aba de notas do calendário e na página de
 * notas. Por isso aqui não há só leitura e escrita: há **assinatura**. Quem
 * escreve avisa, e todas as telas abertas se refazem juntas. Sem isso, a
 * nota digitada no pop-up ficava parada atrás dele.
 *
 * Isto é **anotação pessoal**, não registro acadêmico. A tela diz isso, e
 * enquanto não houver conta individual a nota não sai daqui: não vai para
 * servidor nenhum, e some se o navegador for limpo.
 */

const KEY = "atlas_notas_v1";

export interface GradeBook {
  /** parte → nota anotada. */
  readonly marks: Readonly<Record<string, number>>;
  /** disciplina → nota da ARA, quando houve. */
  readonly ara: Readonly<Record<string, number>>;
}

export const emptyGradeBook: GradeBook = { marks: {}, ara: {} };

export function loadGrades(): GradeBook {
  if (typeof window === "undefined") return emptyGradeBook;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyGradeBook;
    const lido = JSON.parse(raw) as Partial<GradeBook>;
    return { marks: lido.marks ?? {}, ara: lido.ara ?? {} };
  } catch {
    return emptyGradeBook;
  }
}

/* ---------------------------------------------------------------- assinatura */

type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * O retrato atual, com identidade estável.
 *
 * `useSyncExternalStore` compara por referência: se cada leitura devolvesse
 * um objeto novo, o React entenderia que mudou sempre e renderizaria em
 * laço. Então o retrato é guardado e só se refaz quando alguém escreve.
 */
let cache: GradeBook | null = null;

export function getGradeBook(): GradeBook {
  cache ??= loadGrades();
  return cache;
}

/** O retrato do servidor: ninguém tem nota antes de o aparelho responder. */
export function getServerGradeBook(): GradeBook {
  return emptyGradeBook;
}

export function subscribeGrades(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publicar(book: GradeBook | null): void {
  cache = book;
  for (const listener of listeners) listener();
}

/** Outra aba do mesmo navegador anotou: esta também se refaz. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (evento) => {
    if (evento.key !== null && evento.key !== KEY) return;
    publicar(null);
  });
}

/* ------------------------------------------------------------------ escrita */

function write(book: GradeBook): GradeBook {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    // Janela anônima ou cota cheia: a anotação se perde, a página segue.
  }
  publicar(book);
  return book;
}

/** Anota (ou apaga, com `null`) a nota de uma parte. */
export function setMark(partId: string, value: number | null): GradeBook {
  const atual = getGradeBook();
  const marks = { ...atual.marks };
  if (value === null || Number.isNaN(value)) delete marks[partId];
  else marks[partId] = value;
  return write({ ...atual, marks });
}

/** Anota (ou apaga) a nota da ARA de uma disciplina. */
export function setAra(disciplineId: string, value: number | null): GradeBook {
  const atual = getGradeBook();
  const ara = { ...atual.ara };
  if (value === null || Number.isNaN(value)) delete ara[disciplineId];
  else ara[disciplineId] = value;
  return write({ ...atual, ara });
}

/** Apaga as notas de uma disciplina só — as partes e a ARA dela. */
export function clearDiscipline(disciplineId: string, partIds: readonly string[]): GradeBook {
  const atual = getGradeBook();
  const marks = { ...atual.marks };
  for (const partId of partIds) delete marks[partId];
  const ara = { ...atual.ara };
  delete ara[disciplineId];
  return write({ marks, ara });
}

/** Apaga tudo — oferecido na página de notas, como no progresso. */
export function clearGrades(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Já estava inalcançável.
  }
  publicar(emptyGradeBook);
}

/**
 * Lê "7,5" ou "7.5" e devolve um número dentro da escala, ou `null`.
 *
 * Vírgula decimal porque é como se escreve nota em português, e limite
 * porque digitar 85 em vez de 8,5 é o erro mais fácil de cometer.
 */
export function parseMark(texto: string, max: number): number | null {
  const limpo = texto.trim().replace(",", ".");
  if (limpo === "") return null;
  const valor = Number(limpo);
  if (!Number.isFinite(valor) || valor < 0 || valor > max) return null;
  return valor;
}
