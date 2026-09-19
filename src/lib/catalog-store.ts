import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { emptyManifest, type CatalogManifest } from "@/lib/domain/types";
import { r2Client, storageMode } from "@/lib/storage";

/**
 * Persistence for what the admin area changes.
 *
 * The manifest lives next to the files: storage/catalogo.json on disk, or
 * catalogo/manifest.json in the R2 bucket. It is read through a short
 * in-memory cache so pages do not hit the bucket on every request, and a
 * write refreshes that cache at once, so the admin sees their own change
 * immediately.
 */

const LOCAL_PATH = resolve(process.cwd(), "storage", "catalogo.json");
const OBJECT_KEY = "catalogo/manifest.json";
const CACHE_TTL_MS = 30_000;

let cache: { manifest: CatalogManifest; loadedAt: number } | null = null;

function parse(raw: string): CatalogManifest {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || (data as { version?: unknown }).version !== 1) {
    throw new Error("Manifesto do catálogo em formato desconhecido.");
  }
  const m = data as Partial<CatalogManifest>;
  return {
    version: 1,
    books: m.books ?? [],
    links: m.links ?? [],
    overrides: m.overrides ?? {},
    log: m.log ?? [],
  };
}

async function load(): Promise<CatalogManifest> {
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
        return emptyManifest;
      }
      throw error;
    }
  }

  try {
    return parse(await readFile(LOCAL_PATH, "utf8"));
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return emptyManifest;
    throw error;
  }
}

export async function readManifest(): Promise<CatalogManifest> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.manifest;
  const manifest = await load();
  cache = { manifest, loadedAt: Date.now() };
  return manifest;
}

export async function writeManifest(manifest: CatalogManifest): Promise<void> {
  const body = JSON.stringify(manifest, null, 2);

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
    // Write-then-rename so a crash mid-write never leaves a half file.
    await mkdir(dirname(LOCAL_PATH), { recursive: true });
    const tmp = `${LOCAL_PATH}.tmp`;
    await writeFile(tmp, body, "utf8");
    await rename(tmp, LOCAL_PATH);
  }

  cache = { manifest, loadedAt: Date.now() };
}

/** Read-modify-write. One admin at a time is the assumption here. */
export async function updateManifest(
  mutate: (current: CatalogManifest) => CatalogManifest,
): Promise<CatalogManifest> {
  const next = mutate(await load());
  await writeManifest(next);
  return next;
}

/** Test hook: forget the cached manifest. */
export function resetManifestCache(): void {
  cache = null;
}
