import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { getTeachingPlanForDiscipline } from "@/lib/repository";
import { signedFileUrl, storageMode } from "@/lib/storage";

/**
 * Serves a teaching plan the admin uploaded (the seven original ones are
 * static files under /planos). Same shape as the book route: a signed R2
 * redirect in production, a stream from storage/planos locally.
 */
const STORAGE_DIR = resolve(process.cwd(), "storage", "planos");

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const plan = await getTeachingPlanForDiscipline(id);
  if (!plan || plan.storage !== "storage" || !plan.storagePath) {
    return new Response("Plano não disponibilizado.", { status: 404 });
  }

  const download = request.nextUrl.searchParams.get("baixar") === "1";
  const fileName = `plano-de-ensino-${id}.pdf`;

  if (storageMode() === "r2") {
    const url = await signedFileUrl(plan.storagePath, {
      download,
      downloadName: fileName,
      expiresIn: 600,
      folder: "planos",
    });
    return NextResponse.redirect(url, { status: 302 });
  }

  const path = resolve(STORAGE_DIR, basename(plan.storagePath));
  let size: number;
  try {
    size = (await stat(path)).size;
  } catch {
    return new Response("Plano registrado, mas não encontrado no servidor.", { status: 404 });
  }

  return new Response(Readable.toWeb(createReadStream(path)) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export const dynamic = "force-dynamic";
