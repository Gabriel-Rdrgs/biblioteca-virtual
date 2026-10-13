import { NextResponse, type NextRequest } from "next/server";
import { deleteAssessment, updateAssessment } from "@/lib/admin/assessment-admin";
import { assessmentPatchSchema, visibilitySchema } from "@/lib/admin/schemas";
import { adminErrorResponse } from "../../_shared";

/** PATCH — change a date, what it covers, or whether the class sees it. */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "visibility" in body) {
      await updateAssessment(id, { visibility: visibilitySchema.parse(body).visibility });
    } else {
      await updateAssessment(id, assessmentPatchSchema.parse(body));
    }
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
