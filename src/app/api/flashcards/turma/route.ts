import { NextResponse, type NextRequest } from "next/server";
import { publishSharedDeck, sharedDeckInputSchema } from "@/lib/shared-decks";
import { sharedDeckErrorResponse } from "../_shared";

/**
 * Baralhos da turma. A rota fica atrás da senha da turma, como todo o site;
 * o que separa quem pode alterar um baralho é o segredo devolvido aqui.
 */

/** POST — publica um baralho; devolve o id e o segredo para editá-lo depois. */
export async function POST(request: NextRequest) {
  try {
    const input = sharedDeckInputSchema.parse(await request.json());
    const { id, token } = await publishSharedDeck(input);
    return NextResponse.json({ ok: true, id, token }, { status: 201 });
  } catch (error) {
    return sharedDeckErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
