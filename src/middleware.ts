import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, gateConfigured, verifySessionToken } from "@/lib/auth";

/** Paths that must stay reachable before login. */
const OPEN_PREFIXES = ["/entrar", "/api/entrar", "/api/sair", "/_next", "/favicon"];

export async function middleware(request: NextRequest) {
  if (!gateConfigured()) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (OPEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const login = request.nextUrl.clone();
  login.pathname = "/entrar";
  login.search = "";
  login.searchParams.set("proximo", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything, including files under public/ such as the teaching plans.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
