import { NextResponse, type NextRequest } from "next/server";
import { createBook } from "@/lib/admin/catalog-admin";
import { newBookSchema } from "@/lib/admin/schemas";
import { adminErrorResponse } from "../_shared";

export async function POST(request: NextRequest) {
  try {
    const input = newBookSchema.parse(await request.json());
    const book = await createBook(input);
    return NextResponse.json({ ok: true, id: book.id, slug: book.slug }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
