import { NextResponse, type NextRequest } from "next/server";
import { createDiscipline, setCurrentPeriod } from "@/lib/admin/discipline-admin";
import { currentPeriodSchema, disciplineSchema } from "@/lib/admin/schemas";
import { adminErrorResponse } from "../_shared";

/** POST — create a discipline. PATCH { currentPeriod } — choose the period shown first. */
export async function POST(request: NextRequest) {
  try {
    const discipline = await createDiscipline(disciplineSchema.parse(await request.json()));
    return NextResponse.json(
      { ok: true, id: discipline.id, slug: discipline.slug },
      { status: 201 },
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { currentPeriod } = currentPeriodSchema.parse(await request.json());
    await setCurrentPeriod(currentPeriod);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
