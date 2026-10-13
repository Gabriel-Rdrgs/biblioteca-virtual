import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { signedFileUrl, storageMode } from "@/lib/storage";

/**
 * Serves a simulado's assets — the figures of the digital version and the
 * printable PDF — from the same private storage the books use, so they stay
 * behind the class password. The middleware has already checked the session
 * by the time this runs.
 */
const STORAGE_DIR = resolve(process.cwd(), "storage", "simulados");

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
};

export async function GET(request: NextRequest, context: { params: Promise<{ arquivo: string }> }) {
  const { arquivo } = await context.params;
  const name = basename(arquivo);
  if (!/^[a-z0-9][a-z0-9.-]{2,120}$/i.test(name)) {
    return new Response("Nome inválido.", { status: 400 });
  }

  const contentType = TYPES[extname(name).toLowerCase()];
  if (!contentType) return new Response("Tipo não servido.", { status: 400 });

  const download = request.nextUrl.searchParams.get("baixar") === "1";

  if (storageMode() === "r2") {
    const url = await signedFileUrl(name, {
      download,
      downloadName: name,
      expiresIn: 3600,
      folder: "simulados",
      contentType,
    });
    return NextResponse.redirect(url, { status: 302 });
  }

  const path = resolve(STORAGE_DIR, name);
  let size: number;
  try {
    size = (await stat(path)).size;
  } catch {
    return new Response("Arquivo não encontrado.", { status: 404 });
  }

  return new Response(Readable.toWeb(createReadStream(path)) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
      // Figures never change once published; the session gate keeps them private.
      "Cache-Control": "private, max-age=86400",
    },
  });
}

export const dynamic = "force-dynamic";
