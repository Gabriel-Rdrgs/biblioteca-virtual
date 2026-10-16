import { NextResponse, type NextRequest } from "next/server";
import { createSummary } from "@/lib/admin/summary-admin";
import { summarySchema } from "@/lib/admin/schemas";
import { adminErrorResponse } from "../_shared";

/** POST — publica um resumo para a turma. */
export async function POST(request: NextRequest) {
  try {
    const summary = await createSummary(summarySchema.parse(await request.json()));
    return NextResponse.json({ ok: true, id: summary.id, slug: summary.slug }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
