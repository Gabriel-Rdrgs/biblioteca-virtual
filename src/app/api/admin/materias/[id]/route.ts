import { NextResponse, type NextRequest } from "next/server";
import {
  deleteDiscipline,
  setDisciplineVisibility,
  updateDiscipline,
} from "@/lib/admin/discipline-admin";
import { disciplinePatchSchema } from "@/lib/admin/schemas";
import { adminErrorResponse } from "../../_shared";

/**
 * PATCH { visibility } — show or hide.
 * PATCH { ...fields, plan? } — edit; a plan replaces the uploaded PDF.
 * DELETE — remove an admin-created discipline (seeds can only be hidden).
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { visibility, ...fields } = disciplinePatchSchema.parse(await request.json());
    // Both, when both are sent: a half-applied edit is worse than none.
    if (Object.keys(fields).length > 0) await updateDiscipline(id, fields);
    if (visibility) await setDisciplineVisibility(id, visibility);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteDiscipline(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
