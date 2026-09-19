/**
 * Access gates.
 *
 * Two shared passwords, two cookies:
 * - ATLAS_SENHA_TURMA unlocks the library for the class (30-day session).
 * - ATLAS_SENHA_ADMIN unlocks /admin, where files and records are managed
 *   (1-day session). The admin area does not exist until it is set.
 *
 * Cookies carry an HMAC-signed payload that includes the role, so a class
 * token can never be replayed as admin. Web Crypto is used rather than
 * node:crypto so the same code runs in the edge middleware.
 *
 * While the class password is unset the gate is open and the UI says so,
 * which keeps `npm run dev` frictionless without letting a deploy be
 * silently public.
 */

export const SESSION_COOKIE = "atlas_sessao";
export const ADMIN_COOKIE = "atlas_admin";

const SESSION_DAYS = 30;
const ADMIN_DAYS = 1;

type Role = "turma" | "admin";

export function gateConfigured(): boolean {
  return Boolean(process.env.ATLAS_SENHA_TURMA);
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ATLAS_SENHA_ADMIN);
}

function secret(): string {
  return process.env.ATLAS_COOKIE_SECRET || process.env.ATLAS_SENHA_TURMA || "";
}

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

/** Constant-time comparison, so a wrong password fails in the same time as a right one. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function matches(candidate: string, expected: string | undefined): boolean {
  return (
    typeof expected === "string" &&
    expected.length > 0 &&
    timingSafeEqual(candidate.normalize("NFC"), expected.normalize("NFC"))
  );
}

export function passwordMatches(candidate: string): boolean {
  return matches(candidate, process.env.ATLAS_SENHA_TURMA);
}

export function adminPasswordMatches(candidate: string): boolean {
  return matches(candidate, process.env.ATLAS_SENHA_ADMIN);
}

/** Token = role + expiry timestamp, signed together. */
async function createToken(role: Role, days: number): Promise<string> {
  const payload = `${role}:${Date.now() + days * 24 * 60 * 60 * 1000}`;
  return `${payload}.${await hmac(payload)}`;
}

async function verifyToken(token: string | undefined, role: Role): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const [tokenRole, expires] = payload.split(":");
  if (tokenRole !== role || !expires || !/^\d+$/.test(expires)) return false;
  if (Number(expires) < Date.now()) return false;
  return timingSafeEqual(signature, await hmac(payload));
}

export const createSessionToken = () => createToken("turma", SESSION_DAYS);
export const verifySessionToken = (token: string | undefined) => verifyToken(token, "turma");
export const createAdminToken = () => createToken("admin", ADMIN_DAYS);
export const verifyAdminToken = (token: string | undefined) => verifyToken(token, "admin");
export const ADMIN_SESSION_DAYS = ADMIN_DAYS;

/**
 * The Secure flag follows the request's own protocol, not NODE_ENV: a
 * production build served over plain http (a LAN machine, a first deploy
 * without TLS) would otherwise have its cookie dropped by the browser and
 * loop back to the login page forever.
 */
export function sessionCookieOptions(secure: boolean, days: number = SESSION_DAYS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: days * 24 * 60 * 60,
  };
}

/** True when the request arrived over TLS, directly or via a proxy. */
export function requestIsHttps(request: { nextUrl: URL; headers: Headers }): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  return request.nextUrl.protocol === "https:";
}
