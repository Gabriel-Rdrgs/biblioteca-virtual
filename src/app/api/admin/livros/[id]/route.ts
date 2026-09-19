import { NextResponse, type NextRequest } from "next/server";
import { attachFile, deleteBook, removeFile, setVisibility } from "@/lib/admin/catalog-admin";
import { attachFileSchema, visibilitySchema } from "@/lib/admin/schemas";
import { adminErrorResponse } from "../../_shared";

/**
 * PATCH { visibility } — show or hide a record.
 * PATCH { file, fileMeta } — attach or replace its PDF.
 * DELETE — remove the PDF (the record stays, hidden, as a reference).
 * DELETE ?registro=1 — delete a record the admin created, file included.
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();

    if (body && typeof body === "object" && "visibility" in body) {
      const { visibility } = visibilitySchema.parse(body);
      await setVisibility(id, visibility);
      return NextResponse.json({ ok: true });
    }

    const { file, fileMeta } = attachFileSchema.parse(body);
    await attachFile(id, file, fileMeta);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (request.nextUrl.searchParams.get("registro") === "1") await deleteBook(id);
    else await removeFile(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
