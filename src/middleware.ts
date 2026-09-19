import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_COOKIE,
  adminConfigured,
  gateConfigured,
  verifyAdminToken,
  verifySessionToken,
} from "@/lib/auth";

/** Paths reachable before any login. */
const OPEN_PREFIXES = [
  "/entrar",
  "/api/entrar",
  "/api/sair",
  "/admin/entrar",
  "/api/admin/entrar",
  "/api/admin/sair",
  "/_next",
  "/favicon",
];

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  url.searchParams.set("proximo", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (OPEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const adminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (adminArea) {
    // Without an admin password the area is simply not there.
    if (!adminConfigured()) {
      return new NextResponse("Área administrativa desativada.", { status: 404 });
    }
    if (await verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
      return NextResponse.next();
    }
    return pathname.startsWith("/api/")
      ? new NextResponse("Não autorizado.", { status: 401 })
      : redirectTo(request, "/admin/entrar");
  }

  if (!gateConfigured()) return NextResponse.next();
  if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }
  return redirectTo(request, "/entrar");
}

export const config = {
  // Everything, including files under public/ such as the teaching plans.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
