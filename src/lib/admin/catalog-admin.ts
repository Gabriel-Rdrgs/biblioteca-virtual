import { randomBytes } from "node:crypto";
import { open, stat, unlink } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { updateManifest, readManifest } from "@/lib/catalog-store";
import { compareBooks } from "@/lib/domain/dedupe";
import { slugify } from "@/lib/domain/normalize";
import type {
  Book,
  BookFile,
  CatalogLogEntry,
  CoverMotif,
  DisciplineId,
  Visibility,
} from "@/lib/domain/types";
import { mergeCatalog, mergeDisciplines } from "@/lib/repository";
import { deleteObject, objectKey, r2Client, storageMode, type StorageFolder } from "@/lib/storage";
import type { NewBookInput } from "./schemas";

/**
 * The operations behind the admin area. Each one validates the uploaded
 * object really is a PDF, then records the change in the manifest with a
 * log entry. Nothing here touches the seed files.
 */

export const LOCAL_STORAGE_ROOT = resolve(process.cwd(), "storage");
export const LOCAL_STORAGE_DIR = resolve(LOCAL_STORAGE_ROOT, "livros");
export const localDir = (folder: StorageFolder) => resolve(LOCAL_STORAGE_ROOT, folder);

export class AdminError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
    readonly extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

/** Safe object name from whatever the user called the file. */
export function safeFileName(original: string): string {
  const base = slugify(basename(original).replace(/\.pdf$/i, "")).slice(0, 80) || "arquivo";
  return `${base}-${randomBytes(3).toString("hex")}.pdf`;
}

/**
 * Reads the first bytes of the stored object and checks the PDF signature —
 * an upload named ".pdf" is not proof of anything.
 */
export async function verifyStoredPdf(
  fileName: string,
  expectedSize: number,
  folder: StorageFolder = "livros",
): Promise<void> {
  if (storageMode() === "r2") {
    const head = await r2Client()
      .send(
        new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: objectKey(fileName, folder) }),
      )
      .catch(() => null);
    if (!head) throw new AdminError("O arquivo não chegou ao storage.", 400);
    if (head.ContentLength !== expectedSize) {
      throw new AdminError("O tamanho no storage não bate com o enviado.", 400);
    }
    const first = await r2Client().send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: objectKey(fileName, folder),
        Range: "bytes=0-4",
      }),
    );
    const bytes = await first.Body?.transformToByteArray();
    if (!bytes || Buffer.from(bytes).toString("latin1") !== "%PDF-") {
      await deleteObject(fileName, folder).catch(() => undefined);
      throw new AdminError("O arquivo enviado não é um PDF.", 400);
    }
    return;
  }

  const path = resolve(localDir(folder), basename(fileName));
  let size: number;
  try {
    size = (await stat(path)).size;
  } catch {
    throw new AdminError("O arquivo não chegou ao storage.", 400);
  }
  if (size !== expectedSize)
    throw new AdminError("O tamanho no disco não bate com o enviado.", 400);

  const handle = await open(path, "r");
  try {
    const { buffer } = await handle.read(Buffer.alloc(5), 0, 5, 0);
    if (buffer.toString("latin1") !== "%PDF-") {
      await handle.close();
      await unlink(path).catch(() => undefined);
      throw new AdminError("O arquivo enviado não é um PDF.", 400);
    }
  } finally {
    await handle.close().catch(() => undefined);
  }
}

export async function removeStoredFile(
  fileName: string,
  folder: StorageFolder = "livros",
): Promise<void> {
  if (storageMode() === "r2") {
    await deleteObject(fileName, folder).catch(() => undefined);
    return;
  }
  await unlink(resolve(localDir(folder), basename(fileName))).catch(() => undefined);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function logEntry(action: CatalogLogEntry["action"], bookId: string, detail?: string) {
  return { at: new Date().toISOString(), action, bookId, ...(detail ? { detail } : {}) };
}

function buildFile(
  input: { fileName: string; sizeBytes: number },
  meta: { origin: string; authorization: string; note?: string | undefined },
): BookFile {
  return {
    path: input.fileName,
    origin: meta.origin,
    authorization: meta.authorization,
    sizeBytes: input.sizeBytes,
    addedAt: today(),
    ...(meta.note ? { note: meta.note } : {}),
  };
}

function citation(input: NewBookInput): string {
  const parts = [
    input.authors.join("; "),
    input.subtitle ? `${input.title}: ${input.subtitle}` : input.title,
    input.edition,
    input.publisher,
    input.publicationYear ? String(input.publicationYear) : undefined,
    input.isbn ? `ISBN ${input.isbn}` : undefined,
  ].filter(Boolean);
  return `${parts.join(". ")}. (Cadastrado pela administração da turma.)`;
}

/** Creates a book record around an uploaded file. */
export async function createBook(input: NewBookInput): Promise<Book> {
  await verifyStoredPdf(input.file.fileName, input.file.sizeBytes);

  const manifest = await readManifest();
  const { books: existing } = mergeCatalog(manifest);
  const disciplines = mergeDisciplines(manifest);
  for (const disciplineId of input.disciplineIds) {
    if (!disciplines.some((d) => d.id === disciplineId)) {
      throw new AdminError(`Matéria desconhecida: ${disciplineId}.`, 400);
    }
  }

  const baseId = slugify(input.title).slice(0, 80) || "livro";
  let id = baseId;
  for (let n = 2; existing.some((b) => b.id === id); n++) id = `${baseId}-${n}`;

  const motif: CoverMotif =
    input.coverMotif ??
    disciplines.find((d) => d.id === input.disciplineIds[0])?.motif ??
    "humanidades";

  const book: Book = {
    id,
    slug: id,
    title: input.title,
    ...(input.subtitle ? { subtitle: input.subtitle } : {}),
    authors: input.authors,
    ...(input.publisher ? { publisher: input.publisher } : {}),
    ...(input.publicationYear ? { publicationYear: input.publicationYear } : {}),
    ...(input.edition ? { edition: input.edition } : {}),
    ...(input.isbn ? { isbn: input.isbn } : {}),
    kind: "livro",
    accessType: "class_only",
    visibility: "visivel",
    file: buildFile(input.file, input.fileMeta),
    coverSource: "placeholder",
    coverMotif: motif,
    topics: input.topics,
    provenance: {
      sourceKind: "acervo_da_turma",
      rawCitation: citation(input),
      reviewStatus: "ok",
    },
    addedAt: today(),
  };

  // Refuse an exact duplicate; ask before accepting a likely one.
  for (const other of existing) {
    const verdict = compareBooks(book, other);
    if (verdict.duplicate) {
      throw new AdminError(`Já existe um livro com este ISBN: “${other.title}”.`, 409, {
        duplicateOf: other.id,
      });
    }
    if (verdict.confidence !== "baixa" && verdict.reason !== "Sem indício de duplicidade") {
      if (!input.confirmDuplicate) {
        throw new AdminError(
          `Parece o mesmo livro que “${other.title}” (${verdict.reason.toLowerCase()}). Confirme para cadastrar mesmo assim.`,
          409,
          { possibleDuplicateOf: other.id, needsConfirmation: true },
        );
      }
    }
  }

  await updateManifest((current) => ({
    ...current,
    books: [...current.books, book],
    links: [
      ...current.links,
      ...input.disciplineIds.map((disciplineId) => ({
        bookId: id,
        disciplineId: disciplineId as DisciplineId,
        bibliographyType: input.bibliographyType,
        priority: input.bibliographyType === "basica" ? 1 : 4,
      })),
    ],
    log: [...current.log, logEntry("livro_criado", id, input.title)],
  }));

  return book;
}

/** Attaches (or replaces) the file of an existing record. */
export async function attachFile(
  bookId: string,
  file: { fileName: string; sizeBytes: number },
  meta: { origin: string; authorization: string; note?: string | undefined },
): Promise<void> {
  await verifyStoredPdf(file.fileName, file.sizeBytes);

  const { books } = mergeCatalog(await readManifest());
  const book = books.find((b) => b.id === bookId);
  if (!book) throw new AdminError("Livro não encontrado.", 404);

  const previous = book.file?.path;

  await updateManifest((current) => ({
    ...current,
    overrides: {
      ...current.overrides,
      [bookId]: {
        ...current.overrides[bookId],
        file: buildFile(file, meta),
        visibility: "visivel",
      },
    },
    log: [
      ...current.log,
      logEntry("arquivo_anexado", bookId, previous ? `substituiu ${previous}` : file.fileName),
    ],
  }));

  if (previous && previous !== file.fileName) await removeStoredFile(previous);
}

/** Removes a file; the book falls back to a catalogued reference. */
export async function removeFile(bookId: string): Promise<void> {
  const { books } = mergeCatalog(await readManifest());
  const book = books.find((b) => b.id === bookId);
  if (!book) throw new AdminError("Livro não encontrado.", 404);
  if (!book.file) throw new AdminError("Este livro não tem arquivo.", 400);

  const path = book.file.path;
  await updateManifest((current) => ({
    ...current,
    overrides: {
      ...current.overrides,
      [bookId]: { ...current.overrides[bookId], file: null, visibility: "oculto" },
    },
    log: [...current.log, logEntry("arquivo_removido", bookId, path)],
  }));
  await removeStoredFile(path);
}

export async function setVisibility(bookId: string, visibility: Visibility): Promise<void> {
  const { books } = mergeCatalog(await readManifest());
  if (!books.some((b) => b.id === bookId)) throw new AdminError("Livro não encontrado.", 404);

  await updateManifest((current) => ({
    ...current,
    overrides: {
      ...current.overrides,
      [bookId]: { ...current.overrides[bookId], visibility },
    },
    log: [...current.log, logEntry("visibilidade", bookId, visibility)],
  }));
}

/**
 * Deletes a record the admin area created, file included. Seed records
 * come from the teaching plans and can only be hidden, never deleted.
 */
export async function deleteBook(bookId: string): Promise<void> {
  const manifest = await readManifest();
  const book = manifest.books.find((b) => b.id === bookId);
  if (!book) {
    const { books } = mergeCatalog(manifest);
    if (books.some((b) => b.id === bookId)) {
      throw new AdminError("Registros do plano de ensino só podem ser ocultados.", 400);
    }
    throw new AdminError("Livro não encontrado.", 404);
  }

  const override = manifest.overrides[bookId];
  const filePath = override?.file === null ? undefined : (override?.file?.path ?? book.file?.path);

  await updateManifest((current) => {
    const { [bookId]: _dropped, ...overrides } = current.overrides;
    return {
      ...current,
      books: current.books.filter((b) => b.id !== bookId),
      links: current.links.filter((l) => l.bookId !== bookId),
      overrides,
      log: [...current.log, logEntry("registro_excluido", bookId, book.title)],
    };
  });
  if (filePath) await removeStoredFile(filePath);
}
