import { NextResponse, type NextRequest } from "next/server";
import { deleteAssessment, updateAssessment } from "@/lib/admin/assessment-admin";
import { assessmentPatchSchema } from "@/lib/admin/schemas";
import { adminErrorResponse } from "../../_shared";

/**
 * PATCH — change a date, what it covers, or whether the class sees it.
 *
 * One schema for all of it: a payload carrying both a correction and a
 * visibility must apply both, never half.
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await updateAssessment(id, assessmentPatchSchema.parse(await request.json()));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteAssessment(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
