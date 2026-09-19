import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_DAYS,
  SESSION_COOKIE,
  adminPasswordMatches,
  createAdminToken,
  createSessionToken,
  requestIsHttps,
  sessionCookieOptions,
} from "@/lib/auth";

function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/admin";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/admin";
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const password = form.get("senha");
  const next = safeNext(form.get("proximo"));

  if (typeof password !== "string" || !adminPasswordMatches(password)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/entrar";
    url.search = "";
    url.searchParams.set("erro", "1");
    url.searchParams.set("proximo", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const secure = requestIsHttps(request);
  const response = NextResponse.redirect(new URL(next, request.nextUrl.origin), { status: 303 });
  response.cookies.set(
    ADMIN_COOKIE,
    await createAdminToken(),
    sessionCookieOptions(secure, ADMIN_SESSION_DAYS),
  );
  // An admin also browses the library, so grant the class session as well.
  response.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions(secure));
  return response;
}
