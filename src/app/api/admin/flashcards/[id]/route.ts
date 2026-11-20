import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { deleteSharedDeckAsAdmin, setSharedDeckVisibility } from "@/lib/shared-decks";
import { sharedDeckErrorResponse } from "../../../flashcards/_shared";

const patchSchema = z.object({ visibility: z.enum(["visivel", "oculto"]) });

/** PATCH — oculta ou volta a mostrar um baralho publicado por um aluno. */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { visibility } = patchSchema.parse(await request.json());
    await setSharedDeckVisibility(id, visibility);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return sharedDeckErrorResponse(error);
  }
}

/** DELETE — apaga de vez; para o que não deveria ter sido publicado. */
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await deleteSharedDeckAsAdmin(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return sharedDeckErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
