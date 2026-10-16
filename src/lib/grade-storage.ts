/**
 * As notas que você anotou, neste aparelho.
 *
 * Mesmo arranjo das tentativas de simulado (`src/lib/exam-storage.ts`):
 * localStorage, com guarda de SSR e try/catch em volta de tudo — uma janela
 * anônima ou uma cota cheia não valem derrubar a página.
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

function write(book: GradeBook): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    // Janela anônima ou cota cheia: a anotação se perde, a página segue.
  }
}

/** Anota (ou apaga, com `null`) a nota de uma parte. */
export function setMark(partId: string, value: number | null): GradeBook {
  const atual = loadGrades();
  const marks = { ...atual.marks };
  if (value === null || Number.isNaN(value)) delete marks[partId];
  else marks[partId] = value;
  const proximo = { ...atual, marks };
  write(proximo);
  return proximo;
}

/** Anota (ou apaga) a nota da ARA de uma disciplina. */
export function setAra(disciplineId: string, value: number | null): GradeBook {
  const atual = loadGrades();
  const ara = { ...atual.ara };
  if (value === null || Number.isNaN(value)) delete ara[disciplineId];
  else ara[disciplineId] = value;
  const proximo = { ...atual, ara };
  write(proximo);
  return proximo;
}

/** Apaga tudo — oferecido na página de notas, como no progresso. */
export function clearGrades(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Já estava inalcançável.
  }
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
