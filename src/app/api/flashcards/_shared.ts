import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SharedDeckError } from "@/lib/shared-decks";

/** Transforma o erro em JSON que a tela mostra, sem vazar detalhes internos. */
export function sharedDeckErrorResponse(error: unknown): NextResponse {
  if (error instanceof SharedDeckError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return NextResponse.json(
      {
        error: first ? `${first.path.join(".") || "campo"}: ${first.message}` : "Dados inválidos.",
      },
      { status: 400 },
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  console.error("[flashcards]", error);
  return NextResponse.json({ error: "Falha inesperada no servidor." }, { status: 500 });
}

/** O segredo de quem publicou viaja num cabeçalho, nunca na URL. */
export const TOKEN_HEADER = "x-baralho-segredo";
