import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { Readable } from "node:stream";
import { type NextRequest } from "next/server";
import { getBookById } from "@/lib/repository";

/**
 * Streams a class-posted PDF. The middleware has already checked the session
 * cookie; this route adds the second line of defence — the file must belong
 * to a visible book and resolve inside storage/livros.
 */

const STORAGE_DIR = resolve(process.cwd(), "storage", "livros");

function contentDisposition(kind: "inline" | "attachment", fileName: string): string {
  // ASCII fallback plus RFC 5987 UTF-8 form so accented titles survive.
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const entry = getBookById(id);
  const file = entry?.book.file;

  if (!entry || !file) {
    return new Response("Arquivo não disponibilizado.", { status: 404 });
  }

  // Never let a seed value walk out of the storage directory.
  const path = resolve(STORAGE_DIR, basename(file.path));
  if (!path.startsWith(STORAGE_DIR + (process.platform === "win32" ? "\\" : "/"))) {
    return new Response("Caminho inválido.", { status: 400 });
  }

  let size: number;
  try {
    size = (await stat(path)).size;
  } catch {
    return new Response("Arquivo registrado, mas não encontrado no servidor.", { status: 404 });
  }

  const download = request.nextUrl.searchParams.get("baixar") === "1";
  const fileName = `${entry.book.slug}.pdf`;

  const stream = Readable.toWeb(createReadStream(path)) as ReadableStream;
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(size),
      "Content-Disposition": contentDisposition(download ? "attachment" : "inline", fileName),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export const dynamic = "force-dynamic";
