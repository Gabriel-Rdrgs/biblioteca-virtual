import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { signedFileUrl, storageMode } from "@/lib/storage";

/**
 * Serve o PDF de um resumo do mesmo lugar privado dos livros, para ele
 * continuar atrás da senha da turma. O middleware já conferiu a sessão
 * quando isto roda.
 */
const STORAGE_DIR = resolve(process.cwd(), "storage", "resumos");

const TYPES: Record<string, string> = {
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
      folder: "resumos",
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
      // O arquivo não muda depois de publicado; a sessão é que o mantém privado.
      "Cache-Control": "private, max-age=86400",
    },
  });
}

export const dynamic = "force-dynamic";
