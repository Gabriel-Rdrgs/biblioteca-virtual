import { NextResponse, type NextRequest } from "next/server";
import { createAssessment } from "@/lib/admin/assessment-admin";
import { assessmentSchema } from "@/lib/admin/schemas";
import { adminErrorResponse } from "../_shared";

/** POST — put an assessment on the class calendar. */
export async function POST(request: NextRequest) {
  try {
    const assessment = await createAssessment(assessmentSchema.parse(await request.json()));
    return NextResponse.json({ ok: true, id: assessment.id }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
