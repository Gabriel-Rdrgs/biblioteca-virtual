import { NextResponse, type NextRequest } from "next/server";
import {
  deleteDiscipline,
  setDisciplineVisibility,
  updateDiscipline,
} from "@/lib/admin/discipline-admin";
import { disciplinePatchSchema, visibilitySchema } from "@/lib/admin/schemas";
import { adminErrorResponse } from "../../_shared";

/**
 * PATCH { visibility } — show or hide.
 * PATCH { ...fields, plan? } — edit; a plan replaces the uploaded PDF.
 * DELETE — remove an admin-created discipline (seeds can only be hidden).
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "visibility" in body) {
      await setDisciplineVisibility(id, visibilitySchema.parse(body).visibility);
    } else {
      await updateDiscipline(id, disciplinePatchSchema.parse(body));
    }
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
