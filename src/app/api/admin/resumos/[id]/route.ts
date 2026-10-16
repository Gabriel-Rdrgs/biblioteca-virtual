import { NextResponse, type NextRequest } from "next/server";
import { deleteSummary, updateSummary } from "@/lib/admin/summary-admin";
import { summaryPatchSchema } from "@/lib/admin/schemas";
import { adminErrorResponse } from "../../_shared";

/** PATCH — corrige o que foi publicado, ou esconde da turma. */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await updateSummary(id, summaryPatchSchema.parse(await request.json()));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

/** DELETE — só o que o painel publicou; o que vem das sementes se oculta. */
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteSummary(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
