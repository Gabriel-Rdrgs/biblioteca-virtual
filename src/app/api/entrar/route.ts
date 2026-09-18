import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  passwordMatches,
  sessionCookieOptions,
} from "@/lib/auth";

/** Only same-site relative paths are honoured as a post-login destination. */
function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const password = form.get("senha");
  const next = safeNext(form.get("proximo"));

  if (typeof password !== "string" || !passwordMatches(password)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    url.searchParams.set("erro", "1");
    url.searchParams.set("proximo", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(next, request.nextUrl.origin), { status: 303 });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
  return response;
}
