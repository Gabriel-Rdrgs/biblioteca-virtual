import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { NextResponse, type NextRequest } from "next/server";
import { LOCAL_STORAGE_DIR } from "@/lib/admin/catalog-admin";
import { MAX_FILE_BYTES } from "@/lib/admin/schemas";
import { storageMode } from "@/lib/storage";

/**
 * Local-mode upload target: streams the request body straight to
 * storage/livros without buffering it in memory. Only names minted by
 * /api/admin/upload-url are accepted, and the PDF signature is checked
 * again when the record is saved.
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  if (storageMode() !== "local") {
    return NextResponse.json({ error: "Uploads vão direto para o bucket." }, { status: 400 });
  }

  const { name } = await context.params;
  if (!/^[a-z0-9][a-z0-9-]{2,120}\.pdf$/.test(name) || name !== basename(name)) {
    return NextResponse.json({ error: "Nome de arquivo inválido." }, { status: 400 });
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (!request.body || declared <= 0 || declared > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Tamanho de arquivo inválido." }, { status: 400 });
  }

  const path = resolve(LOCAL_STORAGE_DIR, name);
  await mkdir(LOCAL_STORAGE_DIR, { recursive: true });

  try {
    let received = 0;
    const counter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        received += chunk.byteLength;
        if (received > MAX_FILE_BYTES) {
          controller.error(new Error("Arquivo maior que o limite."));
          return;
        }
        controller.enqueue(chunk);
      },
    });
    await pipeline(
      Readable.fromWeb(request.body.pipeThrough(counter) as NodeReadableStream),
      createWriteStream(path),
    );
    return NextResponse.json({ ok: true, sizeBytes: received });
  } catch (error) {
    await unlink(path).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Falha ao gravar o arquivo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const dynamic = "force-dynamic";
