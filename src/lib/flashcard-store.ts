import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { emptySharedStore, type SharedDeckStore } from "@/lib/domain/flashcard-types";
import { r2Client, storageMode } from "@/lib/storage";

/**
 * Onde moram os baralhos que os alunos publicam para a turma.
 *
 * Num arquivo à parte do manifesto do catálogo, de propósito: o manifesto é
 * escrito pelo admin, poucas vezes por semana; este é escrito por qualquer
 * pessoa da turma, na véspera da prova, várias vezes por hora. Juntos, um
 * baralho grande publicado às pressas disputaria a fila com a correção de
 * uma data de prova. Separados, o pior que um baralho faz é atrasar outro.
 *
 * Mesmo esquema do catálogo: disco em desenvolvimento, R2 em produção,
 * cache curto, e escritas enfileiradas para nenhuma apagar a outra.
 */

const localPath = () =>
  resolve(
    process.env.ATLAS_STORAGE_DIR ?? resolve(process.cwd(), "storage"),
    "flashcards-turma.json",
  );
const OBJECT_KEY = "flashcards/turma.json";
const CACHE_TTL_MS = 15_000;

let cache: { store: SharedDeckStore; loadedAt: number } | null = null;

function parse(raw: string): SharedDeckStore {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || (data as { version?: unknown }).version !== 1) {
    throw new Error("Arquivo de baralhos da turma em formato desconhecido.");
  }
  const decks = (data as { decks?: unknown }).decks;
  return { version: 1, decks: Array.isArray(decks) ? (decks as SharedDeckStore["decks"]) : [] };
}

async function load(): Promise<SharedDeckStore> {
  if (storageMode() === "r2") {
    try {
      const out = await r2Client().send(
        new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: OBJECT_KEY }),
      );
      return parse((await out.Body?.transformToString("utf8")) ?? "");
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode;
      if (status === 404 || (error as { name?: string }).name === "NoSuchKey") {
        return emptySharedStore;
      }
      throw error;
    }
  }

  try {
    return parse(await readFile(localPath(), "utf8"));
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return emptySharedStore;
    throw error;
  }
}

export async function readSharedStore(): Promise<SharedDeckStore> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.store;
  const store = await load();
  cache = { store, loadedAt: Date.now() };
  return store;
}

async function write(store: SharedDeckStore): Promise<void> {
  const body = JSON.stringify(store);

  if (storageMode() === "r2") {
    await r2Client().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: OBJECT_KEY,
        Body: body,
        ContentType: "application/json",
      }),
    );
  } else {
    const destino = localPath();
    await mkdir(dirname(destino), { recursive: true });
    const tmp = `${destino}.${randomBytes(4).toString("hex")}.tmp`;
    try {
      await writeFile(tmp, body, "utf8");
      await rename(tmp, destino);
    } catch (error) {
      await unlink(tmp).catch(() => undefined);
      throw error;
    }
  }

  cache = { store, loadedAt: Date.now() };
}

let queue: Promise<unknown> = Promise.resolve();

/** Lê, altera e grava, um de cada vez. */
export async function updateSharedStore(
  mutate: (current: SharedDeckStore) => SharedDeckStore,
): Promise<SharedDeckStore> {
  const run = queue.then(async () => {
    const next = mutate(await load());
    await write(next);
    return next;
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Para os testes: esquece o que está em cache. */
export function resetSharedStoreCache(): void {
  cache = null;
}
