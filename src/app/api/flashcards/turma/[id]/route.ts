import { NextResponse, type NextRequest } from "next/server";
import { sharedDeckInputSchema, updateSharedDeck, withdrawSharedDeck } from "@/lib/shared-decks";
import { sharedDeckErrorResponse, TOKEN_HEADER } from "../../_shared";

/** PUT — substitui o baralho inteiro; só com o segredo de quem publicou. */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const input = sharedDeckInputSchema.parse(await request.json());
    await updateSharedDeck(id, request.headers.get(TOKEN_HEADER), input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return sharedDeckErrorResponse(error);
  }
}

/** DELETE — retira o baralho da turma; a cópia no aparelho continua. */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await withdrawSharedDeck(id, request.headers.get(TOKEN_HEADER));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return sharedDeckErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
