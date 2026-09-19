import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AdminError } from "@/lib/admin/catalog-admin";

/** Turns thrown errors into JSON the admin UI can show, without leaking internals. */
export function adminErrorResponse(error: unknown): NextResponse {
  if (error instanceof AdminError) {
    return NextResponse.json({ error: error.message, ...error.extra }, { status: error.status });
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
  console.error("[admin]", error);
  return NextResponse.json({ error: "Falha inesperada no servidor." }, { status: 500 });
}
