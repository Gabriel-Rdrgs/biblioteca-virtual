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
 *
 * Range requests are honoured (206) so the in-page reader can fetch a
 * 100 MB textbook a few hundred kilobytes at a time instead of downloading
 * all of it before showing page one.
 */

const STORAGE_DIR = resolve(process.cwd(), "storage", "livros");

function contentDisposition(kind: "inline" | "attachment", fileName: string): string {
  // ASCII fallback plus RFC 5987 UTF-8 form so accented titles survive.
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/** Parses a single-range header. Returns null for anything unusual. */
function parseRange(header: string | null, size: number): { start: number; end: number } | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, from, to] = match;

  if (from === "" && to === "") return null;
  // Suffix range: the last N bytes.
  if (from === "") {
    const length = Math.min(Number(to), size);
    return { start: size - length, end: size - 1 };
  }
  const start = Number(from);
  const end = to === "" ? size - 1 : Math.min(Number(to), size - 1);
  if (start > end || start >= size) return null;
  return { start, end };
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
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": contentDisposition(download ? "attachment" : "inline", fileName),
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const range = parseRange(rangeHeader, size);
    if (!range) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    const stream = Readable.toWeb(
      createReadStream(path, { start: range.start, end: range.end }),
    ) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        "Content-Length": String(range.end - range.start + 1),
      },
    });
  }

  const stream = Readable.toWeb(createReadStream(path)) as ReadableStream;
  return new Response(stream, {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(size) },
  });
}

export async function HEAD(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const response = await GET(request, context);
  return new Response(null, { status: response.status, headers: response.headers });
}

export const dynamic = "force-dynamic";
